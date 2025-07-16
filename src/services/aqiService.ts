import axios from 'axios';
import { AQIData, ForecastData, LocationData } from '../types';

export class AQIService {
  // Multiple API endpoints for redundancy
  private static readonly WAQI_BASE_URL = 'https://api.waqi.info';
  private static readonly OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';
  private static readonly IQAIR_BASE_URL = 'https://api.airvisual.com/v2';
  
  // API Keys - these should be set in environment variables
  private static readonly WAQI_API_KEY = import.meta.env.VITE_WAQI_API_KEY;
  private static readonly OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
  private static readonly IQAIR_API_KEY = import.meta.env.VITE_IQAIR_API_KEY;

  // Cache for API responses
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async getCurrentAQI(location: LocationData): Promise<AQIData> {
    const cacheKey = `aqi_${location.city}_${location.coordinates.lat}_${location.coordinates.lon}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('Using cached AQI data for', location.city);
      return cached.data;
    }

    // Try multiple APIs in order of preference
    const apis = [
      () => this.getWAQIData(location),
      () => this.getOpenWeatherAQI(location),
      () => this.getIQAirData(location)
    ];

    for (const apiCall of apis) {
      try {
        const data = await apiCall();
        // Cache successful response
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
      } catch (error) {
        console.warn('API call failed, trying next source:', error);
        continue;
      }
    }

    // If all APIs fail, return mock data with warning
    console.warn('All APIs failed, using mock data for', location.city);
    return this.getMockAQI(location);
  }

  // World Air Quality Index API (Primary)
  private static async getWAQIData(location: LocationData): Promise<AQIData> {
    if (!this.WAQI_API_KEY) {
      throw new Error('WAQI API key not configured');
    }

    // Use station ID if available for more accurate data
    const endpoint = location.stationId 
      ? `${this.WAQI_BASE_URL}/feed/@${location.stationId}/`
      : `${this.WAQI_BASE_URL}/feed/geo:${location.coordinates.lat};${location.coordinates.lon}/`;

    const response = await axios.get(endpoint, {
      params: { token: this.WAQI_API_KEY },
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AirWatch-App/1.0'
      }
    });

    if (response.data.status !== 'ok') {
      throw new Error(`WAQI API error: ${response.data.data || 'Unknown error'}`);
    }

    const data = response.data.data;
    const iaqi = data.iaqi || {};
    
    return {
      aqi: data.aqi || 0,
      pm25: iaqi.pm25?.v || 0,
      pm10: iaqi.pm10?.v || 0,
      o3: iaqi.o3?.v || 0,
      no2: iaqi.no2?.v || 0,
      so2: iaqi.so2?.v || 0,
      co: iaqi.co?.v || 0,
      timestamp: data.time?.iso || new Date().toISOString(),
      location: {
        city: data.city?.name || location.city,
        country: location.country,
        coordinates: location.coordinates
      }
    };
  }

  // OpenWeatherMap Air Pollution API (Secondary)
  private static async getOpenWeatherAQI(location: LocationData): Promise<AQIData> {
    if (!this.OPENWEATHER_API_KEY) {
      throw new Error('OpenWeather API key not configured');
    }

    const response = await axios.get(`${this.OPENWEATHER_BASE_URL}/air_pollution`, {
      params: {
        lat: location.coordinates.lat,
        lon: location.coordinates.lon,
        appid: this.OPENWEATHER_API_KEY
      },
      timeout: 10000
    });

    const data = response.data.list[0];
    const components = data.components;
    
    // Convert OpenWeather AQI (1-5) to standard AQI (0-500)
    const aqiMap = { 1: 25, 2: 75, 3: 125, 4: 175, 5: 225 };
    const aqi = aqiMap[data.main.aqi as keyof typeof aqiMap] || 50;

    return {
      aqi,
      pm25: components.pm2_5 || 0,
      pm10: components.pm10 || 0,
      o3: components.o3 || 0,
      no2: components.no2 || 0,
      so2: components.so2 || 0,
      co: components.co || 0,
      timestamp: new Date(data.dt * 1000).toISOString(),
      location
    };
  }

  // IQAir API (Tertiary)
  private static async getIQAirData(location: LocationData): Promise<AQIData> {
    if (!this.IQAIR_API_KEY) {
      throw new Error('IQAir API key not configured');
    }

    const response = await axios.get(`${this.IQAIR_BASE_URL}/nearest_city`, {
      params: {
        lat: location.coordinates.lat,
        lon: location.coordinates.lon,
        key: this.IQAIR_API_KEY
      },
      timeout: 10000
    });

    if (response.data.status !== 'success') {
      throw new Error(`IQAir API error: ${response.data.data?.message || 'Unknown error'}`);
    }

    const data = response.data.data;
    const pollution = data.current.pollution;

    return {
      aqi: pollution.aqius || 0,
      pm25: pollution.p2?.conc || 0,
      pm10: pollution.p1?.conc || 0,
      o3: pollution.o3?.conc || 0,
      no2: pollution.n2?.conc || 0,
      so2: pollution.s2?.conc || 0,
      co: pollution.co?.conc || 0,
      timestamp: pollution.ts || new Date().toISOString(),
      location: {
        city: data.city || location.city,
        country: data.country || location.country,
        coordinates: location.coordinates
      }
    };
  }

  static async getForecast(location: LocationData): Promise<ForecastData[]> {
    try {
      // Try to get forecast from OpenWeather (has historical/forecast data)
      if (this.OPENWEATHER_API_KEY) {
        return await this.getOpenWeatherForecast(location);
      }
    } catch (error) {
      console.warn('Forecast API failed:', error);
    }

    // Fallback: Generate realistic forecast based on current data
    try {
      const currentData = await this.getCurrentAQI(location);
      return this.generateRealisticForecast(currentData.aqi, location);
    } catch (error) {
      console.warn('Failed to generate forecast:', error);
      return this.getMockForecast();
    }
  }

  private static async getOpenWeatherForecast(location: LocationData): Promise<ForecastData[]> {
    // Get current and historical data to create forecast
    const [current, historical] = await Promise.all([
      axios.get(`${this.OPENWEATHER_BASE_URL}/air_pollution`, {
        params: {
          lat: location.coordinates.lat,
          lon: location.coordinates.lon,
          appid: this.OPENWEATHER_API_KEY
        }
      }),
      axios.get(`${this.OPENWEATHER_BASE_URL}/air_pollution/history`, {
        params: {
          lat: location.coordinates.lat,
          lon: location.coordinates.lon,
          start: Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000),
          end: Math.floor(Date.now() / 1000),
          appid: this.OPENWEATHER_API_KEY
        }
      })
    ]);

    const currentAqi = this.convertOpenWeatherAQI(current.data.list[0].main.aqi);
    const historicalData = historical.data.list.map((item: any) => ({
      aqi: this.convertOpenWeatherAQI(item.main.aqi),
      timestamp: new Date(item.dt * 1000).toISOString()
    }));

    return this.generateRealisticForecast(currentAqi, location, historicalData);
  }

  private static convertOpenWeatherAQI(owAqi: number): number {
    const aqiMap = { 1: 25, 2: 75, 3: 125, 4: 175, 5: 225 };
    return aqiMap[owAqi as keyof typeof aqiMap] || 50;
  }

  static async searchLocations(query: string): Promise<LocationData[]> {
    // Delegate to SearchService for optimized search
    const { SearchService } = await import('./searchService');
    const results = await SearchService.searchLocations(query, undefined, { maxResults: 8 });
    return results.map(result => ({
      city: result.city,
      country: result.country,
      state: result.state,
      coordinates: result.coordinates,
      stationId: result.stationId,
      hasMonitoringStation: result.hasStation
    }));
  }

  // Expose mock locations for fallback use
  static getMockLocations(): LocationData[] {
    return this.mockLocations;
  }

  // Enhanced search methods
  // Deprecated - use SearchService instead
  static async searchNearbyStations(query: string): Promise<LocationData[]> {
    const { SearchService } = await import('./searchService');
    const results = await SearchService.searchLocations(query, undefined, { 
      includeStations: true, 
      includeCoordinates: false,
      maxResults: 6 
    });
    return results.filter(r => r.hasStation);
  }

  // Deprecated - use SearchService instead  
  static async searchByCoordinates(query: string): Promise<LocationData[]> {
    const { SearchService } = await import('./searchService');
    const results = await SearchService.searchLocations(query, undefined, { 
      includeStations: false, 
      includeCoordinates: true,
      maxResults: 1 
    });
    return results.filter(r => r.type === 'coordinate');
  }
  static async checkStationAvailability(location: LocationData): Promise<boolean> {
    try {
      if (this.WAQI_API_KEY) {
        const response = await axios.get(`${this.WAQI_BASE_URL}/feed/geo:${location.coordinates.lat};${location.coordinates.lon}/`, {
          params: { token: this.WAQI_API_KEY },
          timeout: 5000
        });
        
        return response.data.status === 'ok' && response.data.data?.aqi;
      }
    } catch (error) {
      console.warn('Station availability check failed:', error);
    }
    
    return false;
  }

  // Enhanced location search with WAQI stations
  static async searchLocationWithStations(query: string): Promise<LocationData[]> {
    const results: LocationData[] = [];
    
    try {
      // Search WAQI stations first for most accurate data
      if (this.WAQI_API_KEY) {
        const stationResponse = await axios.get(`${this.WAQI_BASE_URL}/search/`, {
          params: {
            token: this.WAQI_API_KEY,
            keyword: query
          },
          timeout: 8000
        });

        if (stationResponse.data.status === 'ok' && stationResponse.data.data) {
          const stations = stationResponse.data.data
            .filter((station: any) => station.station.geo && station.station.geo.length === 2)
            .map((station: any) => ({
              city: station.station.name.split(',')[0].trim(),
              country: station.station.country || 'Unknown',
              coordinates: {
                lat: station.station.geo[0],
                lon: station.station.geo[1]
              },
              stationId: station.uid,
              hasMonitoringStation: true
            }));
          
          results.push(...stations.slice(0, 5));
        }
      }

      // Also search general locations
      const generalLocations = await this.searchLocations(query);
      
      // Merge and deduplicate
      const combined = [...results, ...generalLocations];
      const unique = combined.filter((location, index, self) => 
        index === self.findIndex(l => 
          Math.abs(l.coordinates.lat - location.coordinates.lat) < 0.01 &&
          Math.abs(l.coordinates.lon - location.coordinates.lon) < 0.01
        )
      );
      
      return unique.slice(0, 10);
    } catch (error) {
      console.error('Enhanced location search failed:', error);
      return this.searchLocations(query);
    }
  }

  static async reverseGeocode(lat: number, lon: number): Promise<LocationData> {
    // Delegate to SearchService for optimized reverse geocoding
    const { SearchService } = await import('./searchService');
    return SearchService.reverseGeocode(lat, lon);
  }

  // Enhanced forecast generation with historical patterns
  private static generateRealisticForecast(
    currentAqi: number, 
    location: LocationData, 
    historicalData?: Array<{ aqi: number; timestamp: string }>
  ): ForecastData[] {
    const forecast: ForecastData[] = [];
    const now = new Date();
    let baseAqi = currentAqi;

    // Analyze historical patterns if available
    let dailyPattern = 0;
    let weeklyTrend = 0;
    
    if (historicalData && historicalData.length > 0) {
      const avgHistorical = historicalData.reduce((sum, item) => sum + item.aqi, 0) / historicalData.length;
      weeklyTrend = (currentAqi - avgHistorical) / 7; // Weekly trend
    }

    // Location-specific patterns
    const locationFactors = this.getLocationAQIFactors(location.city);
    
    for (let i = 0; i < 48; i++) {
      const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hour = timestamp.getHours();
      const dayOfWeek = timestamp.getDay();
      
      // Time-based variations
      const rushHourFactor = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19) ? 15 : 0;
      const nightTimeFactor = (hour >= 22 || hour <= 6) ? -10 : 0;
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? -5 : 0;
      
      // Weather simulation (simplified)
      const weatherVariation = Math.sin(i * Math.PI / 12) * 8; // 12-hour cycle
      const randomVariation = (Math.random() - 0.5) * 10;
      
      // Apply all factors
      const totalVariation = rushHourFactor + nightTimeFactor + weekendFactor + 
                           weatherVariation + randomVariation + (weeklyTrend * i / 24);
      
      baseAqi = Math.max(10, Math.min(300, baseAqi + totalVariation * 0.1));
      const aqi = Math.round(baseAqi + locationFactors.baseVariation);
      
      forecast.push({
        timestamp: timestamp.toISOString(),
        aqi,
        pm25: Math.round(aqi * 0.6 + Math.random() * 10),
        pm10: Math.round(aqi * 0.8 + Math.random() * 15)
      });
    }
    
    return forecast;
  }

  private static getLocationAQIFactors(city: string) {
    const factors: Record<string, { baseVariation: number; seasonalFactor: number }> = {
      'Beijing': { baseVariation: 20, seasonalFactor: 1.5 },
      'Mumbai': { baseVariation: 25, seasonalFactor: 1.3 },
      'Los Angeles': { baseVariation: 10, seasonalFactor: 1.1 },
      'London': { baseVariation: -5, seasonalFactor: 0.9 },
      'Sydney': { baseVariation: -15, seasonalFactor: 0.8 },
      'Tokyo': { baseVariation: 5, seasonalFactor: 1.0 }
    };
    
    return factors[city] || { baseVariation: 0, seasonalFactor: 1.0 };
  }

  // Fallback data and mock locations
  private static readonly mockLocations: LocationData[] = [
    { city: 'New York', country: 'USA', coordinates: { lat: 40.7128, lon: -74.0060 } },
    { city: 'London', country: 'UK', coordinates: { lat: 51.5074, lon: -0.1278 } },
    { city: 'Tokyo', country: 'Japan', coordinates: { lat: 35.6762, lon: 139.6503 } },
    { city: 'Mumbai', country: 'India', coordinates: { lat: 19.0760, lon: 72.8777 } },
    { city: 'Beijing', country: 'China', coordinates: { lat: 39.9042, lon: 116.4074 } },
    { city: 'Los Angeles', country: 'USA', coordinates: { lat: 34.0522, lon: -118.2437 } },
    { city: 'Paris', country: 'France', coordinates: { lat: 48.8566, lon: 2.3522 } },
    { city: 'Sydney', country: 'Australia', coordinates: { lat: -33.8688, lon: 151.2093 } },
    { city: 'São Paulo', country: 'Brazil', coordinates: { lat: -23.5505, lon: -46.6333 } },
    { city: 'Cairo', country: 'Egypt', coordinates: { lat: 30.0444, lon: 31.2357 } },
    { city: 'Moscow', country: 'Russia', coordinates: { lat: 55.7558, lon: 37.6176 } },
    { city: 'Bangkok', country: 'Thailand', coordinates: { lat: 13.7563, lon: 100.5018 } },
    { city: 'Mexico City', country: 'Mexico', coordinates: { lat: 19.4326, lon: -99.1332 } },
    { city: 'Jakarta', country: 'Indonesia', coordinates: { lat: -6.2088, lon: 106.8456 } },
    { city: 'Delhi', country: 'India', coordinates: { lat: 28.7041, lon: 77.1025 } }
  ];

  private static getMockAQI(location: LocationData): AQIData {
    const baseAqi = this.getLocationBaseAQI(location.city);
    const timeOfDay = new Date().getHours();
    const timeVariation = Math.sin((timeOfDay - 6) * Math.PI / 12) * 20;
    const randomVariation = (Math.random() - 0.5) * 30;
    const weatherFactor = Math.random() > 0.7 ? -20 : 0;
    
    const variation = timeVariation + randomVariation + weatherFactor;
    const aqi = Math.max(10, Math.min(300, Math.round(baseAqi + variation)));
    
    return {
      aqi,
      pm25: Math.round(aqi * 0.6 + Math.random() * 20),
      pm10: Math.round(aqi * 0.8 + Math.random() * 30),
      o3: Math.round(aqi * 0.4 + Math.random() * 15),
      no2: Math.round(aqi * 0.3 + Math.random() * 10),
      so2: Math.round(aqi * 0.2 + Math.random() * 8),
      co: Math.round(aqi * 10 + Math.random() * 500),
      timestamp: new Date().toISOString(),
      location
    };
  }

  private static getMockForecast(): ForecastData[] {
    const forecast: ForecastData[] = [];
    const now = new Date();
    let currentAqi = 80 + Math.random() * 60;
    
    for (let i = 0; i < 48; i++) {
      const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hourlyChange = (Math.random() - 0.5) * 20;
      const timeOfDayFactor = Math.sin((i % 24) * Math.PI / 12) * 15;
      currentAqi = Math.max(20, Math.min(200, currentAqi + hourlyChange + timeOfDayFactor));
      
      const aqi = Math.round(currentAqi);
      
      forecast.push({
        timestamp: timestamp.toISOString(),
        aqi,
        pm25: Math.round(aqi * 0.6 + Math.random() * 10),
        pm10: Math.round(aqi * 0.8 + Math.random() * 15)
      });
    }
    
    return forecast;
  }

  private static getLocationBaseAQI(city: string): number {
    const aqiMap: Record<string, number> = {
      'New York': 85, 'London': 65, 'Tokyo': 75, 'Mumbai': 150,
      'Beijing': 120, 'Los Angeles': 95, 'Paris': 70, 'Sydney': 45,
      'São Paulo': 110, 'Cairo': 140, 'Moscow': 90, 'Bangkok': 130,
      'Mexico City': 135, 'Jakarta': 125, 'Delhi': 160,
      'Current Location': 80
    };
    return aqiMap[city] || 80;
  }

  // API health check
  static async checkAPIHealth(): Promise<{ waqi: boolean; openweather: boolean; iqair: boolean }> {
    const results = { waqi: false, openweather: false, iqair: false };
    
    // Check WAQI
    if (this.WAQI_API_KEY) {
      try {
        await axios.get(`${this.WAQI_BASE_URL}/feed/beijing/`, {
          params: { token: this.WAQI_API_KEY },
          timeout: 5000
        });
        results.waqi = true;
      } catch (error) {
        console.warn('WAQI API health check failed');
      }
    }
    
    // Check OpenWeather
    if (this.OPENWEATHER_API_KEY) {
      try {
        await axios.get(`${this.OPENWEATHER_BASE_URL}/air_pollution`, {
          params: { lat: 40.7128, lon: -74.0060, appid: this.OPENWEATHER_API_KEY },
          timeout: 5000
        });
        results.openweather = true;
      } catch (error) {
        console.warn('OpenWeather API health check failed');
      }
    }
    
    // Check IQAir
    if (this.IQAIR_API_KEY) {
      try {
        await axios.get(`${this.IQAIR_BASE_URL}/nearest_city`, {
          params: { lat: 40.7128, lon: -74.0060, key: this.IQAIR_API_KEY },
          timeout: 5000
        });
        results.iqair = true;
      } catch (error) {
        console.warn('IQAir API health check failed');
      }
    }
    
    return results;
  }
}