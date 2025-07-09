import axios from 'axios';
import { AQIData, ForecastData, LocationData } from '../types';

export class AQIService {
  private static readonly WAQI_BASE_URL = 'https://api.waqi.info';
  private static readonly WAQI_API_KEY = import.meta.env.VITE_WAQI_API_KEY;

  // Fallback data for demo purposes
  private static readonly mockLocations: LocationData[] = [
    { city: 'New York', country: 'USA', coordinates: { lat: 40.7128, lon: -74.0060 } },
    { city: 'London', country: 'UK', coordinates: { lat: 51.5074, lon: -0.1278 } },
    { city: 'Tokyo', country: 'Japan', coordinates: { lat: 35.6762, lon: 139.6503 } },
    { city: 'Mumbai', country: 'India', coordinates: { lat: 19.0760, lon: 72.8777 } },
    { city: 'Beijing', country: 'China', coordinates: { lat: 39.9042, lon: 116.4074 } },
    { city: 'Los Angeles', country: 'USA', coordinates: { lat: 34.0522, lon: -118.2437 } },
    { city: 'Paris', country: 'France', coordinates: { lat: 48.8566, lon: 2.3522 } },
    { city: 'Sydney', country: 'Australia', coordinates: { lat: -33.8688, lon: 151.2093 } }
  ];

  static async getCurrentAQI(location: LocationData): Promise<AQIData> {
    if (!this.WAQI_API_KEY || this.WAQI_API_KEY === 'demo_key') {
      console.warn('WAQI API key not configured, using mock data');
      return this.getMockAQI(location);
    }

    try {
      // Try to get data by coordinates first
      const response = await axios.get(`${this.WAQI_BASE_URL}/feed/geo:${location.coordinates.lat};${location.coordinates.lon}/`, {
        params: {
          token: this.WAQI_API_KEY
        },
        timeout: 10000
      });

      if (response.data.status !== 'ok') {
        throw new Error(`WAQI API error: ${response.data.data || 'Unknown error'}`);
      }

      const data = response.data.data;
      
      // Extract pollutant data safely
      const iaqi = data.iaqi || {};
      
      return {
        aqi: data.aqi || 50,
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
    } catch (error) {
      console.warn('Failed to fetch real AQI data, using mock data:', error);
      return this.getMockAQI(location);
    }
  }

  static async getForecast(location: LocationData): Promise<ForecastData[]> {
    // WAQI doesn't provide forecast data, so we'll generate realistic mock forecast
    // based on current conditions
    try {
      const currentData = await this.getCurrentAQI(location);
      return this.generateForecastFromCurrent(currentData.aqi);
    } catch (error) {
      console.warn('Failed to generate forecast, using default mock data:', error);
      return this.getMockForecast();
    }
  }

  static async searchLocations(query: string): Promise<LocationData[]> {
    if (!this.WAQI_API_KEY || this.WAQI_API_KEY === 'demo_key') {
      console.warn('WAQI API key not configured, using mock search');
      return this.mockLocations.filter(location => 
        location.city.toLowerCase().includes(query.toLowerCase()) ||
        location.country.toLowerCase().includes(query.toLowerCase())
      );
    }

    try {
      const response = await axios.get(`${this.WAQI_BASE_URL}/search/`, {
        params: {
          token: this.WAQI_API_KEY,
          keyword: query
        },
        timeout: 10000
      });

      if (response.data.status !== 'ok') {
        throw new Error(`WAQI search error: ${response.data.data || 'Unknown error'}`);
      }

      return response.data.data.slice(0, 8).map((station: any) => ({
        city: station.station?.name || station.name || 'Unknown',
        country: station.station?.country || 'Unknown',
        coordinates: {
          lat: station.station?.geo?.[0] || 0,
          lon: station.station?.geo?.[1] || 0
        }
      }));
    } catch (error) {
      console.warn('Failed to search locations, using mock data:', error);
      return this.mockLocations.filter(location => 
        location.city.toLowerCase().includes(query.toLowerCase()) ||
        location.country.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  static async reverseGeocode(lat: number, lon: number): Promise<LocationData> {
    if (!this.WAQI_API_KEY || this.WAQI_API_KEY === 'demo_key') {
      return {
        city: 'Current Location',
        country: 'Unknown',
        coordinates: { lat, lon }
      };
    }

    try {
      const response = await axios.get(`${this.WAQI_BASE_URL}/feed/geo:${lat};${lon}/`, {
        params: {
          token: this.WAQI_API_KEY
        },
        timeout: 10000
      });

      if (response.data.status === 'ok' && response.data.data) {
        const data = response.data.data;
        return {
          city: data.city?.name || 'Current Location',
          country: data.city?.country || 'Unknown',
          coordinates: { lat, lon }
        };
      }
    } catch (error) {
      console.warn('Failed to reverse geocode:', error);
    }

    return {
      city: 'Current Location',
      country: 'Unknown',
      coordinates: { lat, lon }
    };
  }

  // Generate realistic forecast based on current AQI
  private static generateForecastFromCurrent(currentAqi: number): ForecastData[] {
    const forecast: ForecastData[] = [];
    const now = new Date();
    let baseAqi = currentAqi;
    
    for (let i = 0; i < 48; i++) {
      const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000);
      
      // Add realistic hourly variations
      const hourlyVariation = (Math.random() - 0.5) * 15;
      const timeOfDayFactor = Math.sin((i % 24) * Math.PI / 12) * 10;
      const weatherPattern = Math.sin(i * Math.PI / 24) * 8;
      
      baseAqi = Math.max(10, Math.min(300, baseAqi + hourlyVariation + timeOfDayFactor + weatherPattern));
      
      const aqi = Math.round(baseAqi);
      
      forecast.push({
        timestamp: timestamp.toISOString(),
        aqi,
        pm25: Math.round(aqi * 0.6 + Math.random() * 10),
        pm10: Math.round(aqi * 0.8 + Math.random() * 15)
      });
    }
    
    return forecast;
  }

  // Mock data methods for fallback
  private static getMockAQI(location: LocationData): AQIData {
    const baseAqi = this.getLocationBaseAQI(location.city);
    const variation = (Math.random() - 0.5) * 40;
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
      
      // Add some realistic variation
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
      'New York': 85,
      'London': 65,
      'Tokyo': 75,
      'Mumbai': 150,
      'Beijing': 120,
      'Los Angeles': 95,
      'Paris': 70,
      'Sydney': 45
    };
    return aqiMap[city] || 80;
  }
}