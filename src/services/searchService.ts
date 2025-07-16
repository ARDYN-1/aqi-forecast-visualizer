import axios from 'axios';
import { LocationData } from '../types';

interface SearchCache {
  [key: string]: {
    data: LocationData[];
    timestamp: number;
    expiresAt: number;
  };
}

interface SearchResult extends LocationData {
  relevanceScore: number;
  distance?: number;
  hasStation?: boolean;
  population?: number;
  type: 'city' | 'station' | 'coordinate' | 'recent' | 'favorite';
}

export class SearchService {
  private static cache: SearchCache = {};
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  private static readonly DEBOUNCE_DELAY = 300;
  private static readonly MAX_RESULTS = 12;
  
  // API endpoints
  private static readonly OPENWEATHER_GEOCODING = 'https://api.openweathermap.org/geo/1.0';
  private static readonly WAQI_BASE_URL = 'https://api.waqi.info';
  
  // API Keys
  private static readonly OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
  private static readonly WAQI_API_KEY = import.meta.env.VITE_WAQI_API_KEY;

  // Optimized search with multiple strategies
  static async searchLocations(
    query: string, 
    currentLocation?: LocationData,
    options: {
      includeStations?: boolean;
      includeCoordinates?: boolean;
      maxResults?: number;
    } = {}
  ): Promise<SearchResult[]> {
    const { 
      includeStations = true, 
      includeCoordinates = true, 
      maxResults = this.MAX_RESULTS 
    } = options;

    // Return empty for very short queries
    if (query.length < 2) return [];

    // Check cache first
    const cacheKey = `search_${query.toLowerCase()}_${includeStations}_${includeCoordinates}`;
    const cached = this.cache[cacheKey];
    
    if (cached && Date.now() < cached.expiresAt) {
      return this.rankAndFilterResults(cached.data as SearchResult[], query, currentLocation, maxResults);
    }

    try {
      // Run searches in parallel for better performance
      const searchPromises: Promise<SearchResult[]>[] = [];

      // 1. Coordinate search (fastest)
      if (includeCoordinates) {
        searchPromises.push(this.searchByCoordinates(query));
      }

      // 2. City/location search
      searchPromises.push(this.searchCities(query));

      // 3. Monitoring stations search
      if (includeStations && this.WAQI_API_KEY) {
        searchPromises.push(this.searchMonitoringStations(query));
      }

      // 4. Fallback to predefined locations
      searchPromises.push(this.searchPredefinedLocations(query));

      // Execute all searches with timeout
      const results = await Promise.allSettled(
        searchPromises.map(promise => 
          Promise.race([
            promise,
            new Promise<SearchResult[]>((_, reject) => 
              setTimeout(() => reject(new Error('Search timeout')), 8000)
            )
          ])
        )
      );

      // Combine successful results
      const allResults: SearchResult[] = [];
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          allResults.push(...result.value);
        }
      });

      // Remove duplicates and rank results
      const uniqueResults = this.removeDuplicates(allResults);
      const rankedResults = this.rankAndFilterResults(uniqueResults, query, currentLocation, maxResults);

      // Cache the results
      this.cache[cacheKey] = {
        data: rankedResults,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      };

      return rankedResults;

    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to predefined locations only
      return this.searchPredefinedLocations(query);
    }
  }

  // Fast coordinate search
  private static async searchByCoordinates(query: string): Promise<SearchResult[]> {
    const coordPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/;
    const match = query.match(coordPattern);
    
    if (!match) return [];

    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    
    // Validate coordinates
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return [];

    try {
      const location = await this.reverseGeocode(lat, lon);
      return [{
        ...location,
        relevanceScore: 100, // Exact coordinate match gets highest score
        type: 'coordinate' as const
      }];
    } catch (error) {
      // Return coordinate location even if reverse geocoding fails
      return [{
        city: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        country: 'Coordinates',
        coordinates: { lat, lon },
        relevanceScore: 90,
        type: 'coordinate' as const
      }];
    }
  }

  // Optimized city search with OpenWeather Geocoding
  private static async searchCities(query: string): Promise<SearchResult[]> {
    if (!this.OPENWEATHER_API_KEY) {
      return this.searchPredefinedLocations(query);
    }

    try {
      const response = await axios.get(`${this.OPENWEATHER_GEOCODING}/direct`, {
        params: {
          q: query,
          limit: 8,
          appid: this.OPENWEATHER_API_KEY
        },
        timeout: 6000
      });

      return response.data.map((item: any) => ({
        city: item.name,
        country: item.country,
        state: item.state,
        coordinates: {
          lat: item.lat,
          lon: item.lon
        },
        relevanceScore: this.calculateCityRelevance(item.name, query),
        type: 'city' as const
      }));

    } catch (error) {
      console.warn('City search API failed:', error);
      return this.searchPredefinedLocations(query);
    }
  }

  // Enhanced monitoring station search
  private static async searchMonitoringStations(query: string): Promise<SearchResult[]> {
    if (!this.WAQI_API_KEY) return [];

    try {
      const response = await axios.get(`${this.WAQI_BASE_URL}/search/`, {
        params: {
          token: this.WAQI_API_KEY,
          keyword: query
        },
        timeout: 7000
      });

      if (response.data.status !== 'ok' || !response.data.data) {
        return [];
      }

      return response.data.data
        .filter((station: any) => 
          station.station.geo && 
          station.station.geo.length === 2 &&
          station.station.geo[0] !== 0 && 
          station.station.geo[1] !== 0
        )
        .map((station: any) => {
          const stationName = station.station.name || '';
          const cityName = stationName.split(',')[0].trim();
          
          return {
            city: cityName,
            country: station.station.country || 'Unknown',
            coordinates: {
              lat: station.station.geo[0],
              lon: station.station.geo[1]
            },
            stationId: station.uid,
            hasStation: true,
            relevanceScore: this.calculateStationRelevance(stationName, query),
            type: 'station' as const
          };
        })
        .slice(0, 6); // Limit station results

    } catch (error) {
      console.warn('Station search failed:', error);
      return [];
    }
  }

  // Fast predefined location search
  private static searchPredefinedLocations(query: string): SearchResult[] {
    const queryLower = query.toLowerCase();
    
    return this.predefinedLocations
      .filter(location => 
        location.city.toLowerCase().includes(queryLower) ||
        location.country.toLowerCase().includes(queryLower) ||
        (location.state && location.state.toLowerCase().includes(queryLower))
      )
      .map(location => ({
        ...location,
        relevanceScore: this.calculateCityRelevance(location.city, query),
        type: 'city' as const
      }))
      .slice(0, 6);
  }

  // Improved relevance scoring
  private static calculateCityRelevance(cityName: string, query: string): number {
    const city = cityName.toLowerCase();
    const q = query.toLowerCase();
    
    // Exact match
    if (city === q) return 100;
    
    // Starts with query
    if (city.startsWith(q)) return 90;
    
    // Contains query at word boundary
    if (city.includes(` ${q}`)) return 80;
    
    // Contains query anywhere
    if (city.includes(q)) return 70;
    
    // Fuzzy matching for typos
    const similarity = this.calculateStringSimilarity(city, q);
    return Math.max(0, similarity * 60);
  }

  private static calculateStationRelevance(stationName: string, query: string): number {
    const relevance = this.calculateCityRelevance(stationName, query);
    return relevance + 10; // Boost stations slightly as they have real-time data
  }

  // Simple string similarity calculation
  private static calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Remove duplicate locations
  private static removeDuplicates(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(location => {
      const key = `${location.city.toLowerCase()}_${location.coordinates.lat.toFixed(3)}_${location.coordinates.lon.toFixed(3)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Rank and filter results
  private static rankAndFilterResults(
    results: SearchResult[], 
    query: string, 
    currentLocation?: LocationData,
    maxResults: number = this.MAX_RESULTS
  ): SearchResult[] {
    // Add distance calculation if current location is available
    if (currentLocation) {
      results.forEach(result => {
        result.distance = this.calculateDistance(
          currentLocation.coordinates.lat,
          currentLocation.coordinates.lon,
          result.coordinates.lat,
          result.coordinates.lon
        );
      });
    }

    // Sort by relevance score, then by distance, then by type priority
    return results
      .sort((a, b) => {
        // Primary: relevance score
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        
        // Secondary: type priority (stations > cities > coordinates)
        const typePriority = { station: 3, city: 2, coordinate: 1, recent: 4, favorite: 5 };
        const aPriority = typePriority[a.type] || 0;
        const bPriority = typePriority[b.type] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        // Tertiary: distance (if available)
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        
        // Final: alphabetical
        return a.city.localeCompare(b.city);
      })
      .slice(0, maxResults);
  }

  // Distance calculation
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Enhanced reverse geocoding
  static async reverseGeocode(lat: number, lon: number): Promise<LocationData> {
    if (!this.OPENWEATHER_API_KEY) {
      return {
        city: `Location ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        country: 'Unknown',
        coordinates: { lat, lon }
      };
    }

    try {
      const response = await axios.get(`${this.OPENWEATHER_GEOCODING}/reverse`, {
        params: {
          lat,
          lon,
          limit: 1,
          appid: this.OPENWEATHER_API_KEY
        },
        timeout: 5000
      });

      if (response.data.length > 0) {
        const location = response.data[0];
        return {
          city: location.name,
          country: location.country,
          state: location.state,
          coordinates: { lat, lon }
        };
      }
    } catch (error) {
      console.warn('Reverse geocoding failed:', error);
    }

    return {
      city: `Location ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      country: 'Unknown',
      coordinates: { lat, lon }
    };
  }

  // Clear cache
  static clearCache(): void {
    this.cache = {};
  }

  // Get cache stats
  static getCacheStats(): { size: number; oldestEntry: number } {
    const entries = Object.values(this.cache);
    return {
      size: entries.length,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : 0
    };
  }

  // Predefined locations for fallback
  private static readonly predefinedLocations: LocationData[] = [
    { city: 'New York', country: 'USA', state: 'New York', coordinates: { lat: 40.7128, lon: -74.0060 } },
    { city: 'London', country: 'UK', coordinates: { lat: 51.5074, lon: -0.1278 } },
    { city: 'Tokyo', country: 'Japan', coordinates: { lat: 35.6762, lon: 139.6503 } },
    { city: 'Mumbai', country: 'India', state: 'Maharashtra', coordinates: { lat: 19.0760, lon: 72.8777 } },
    { city: 'Beijing', country: 'China', coordinates: { lat: 39.9042, lon: 116.4074 } },
    { city: 'Los Angeles', country: 'USA', state: 'California', coordinates: { lat: 34.0522, lon: -118.2437 } },
    { city: 'Paris', country: 'France', coordinates: { lat: 48.8566, lon: 2.3522 } },
    { city: 'Sydney', country: 'Australia', coordinates: { lat: -33.8688, lon: 151.2093 } },
    { city: 'São Paulo', country: 'Brazil', coordinates: { lat: -23.5505, lon: -46.6333 } },
    { city: 'Cairo', country: 'Egypt', coordinates: { lat: 30.0444, lon: 31.2357 } },
    { city: 'Moscow', country: 'Russia', coordinates: { lat: 55.7558, lon: 37.6176 } },
    { city: 'Bangkok', country: 'Thailand', coordinates: { lat: 13.7563, lon: 100.5018 } },
    { city: 'Mexico City', country: 'Mexico', coordinates: { lat: 19.4326, lon: -99.1332 } },
    { city: 'Jakarta', country: 'Indonesia', coordinates: { lat: -6.2088, lon: 106.8456 } },
    { city: 'Delhi', country: 'India', state: 'Delhi', coordinates: { lat: 28.7041, lon: 77.1025 } },
    { city: 'Shanghai', country: 'China', coordinates: { lat: 31.2304, lon: 121.4737 } },
    { city: 'Berlin', country: 'Germany', coordinates: { lat: 52.5200, lon: 13.4050 } },
    { city: 'Toronto', country: 'Canada', state: 'Ontario', coordinates: { lat: 43.6532, lon: -79.3832 } },
    { city: 'Singapore', country: 'Singapore', coordinates: { lat: 1.3521, lon: 103.8198 } },
    { city: 'Dubai', country: 'UAE', coordinates: { lat: 25.2048, lon: 55.2708 } }
  ];
}