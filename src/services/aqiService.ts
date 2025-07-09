import axios from 'axios';
import { AQIData, ForecastData, LocationData } from '../types';

const OPENWEATHER_API_KEY = 'demo_key'; // Replace with your actual API key
const WAQI_API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';

export class AQIService {
  private static readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';
  private static readonly WAQI_BASE_URL = 'https://api.waqi.info';
  private static readonly GEOCODING_URL = 'https://api.openweathermap.org/geo/1.0';

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
    try {
      // Try to get real data from OpenWeather API
      const response = await axios.get(`${this.BASE_URL}/air_pollution`, {
        params: {
          lat: location.coordinates.lat,
          lon: location.coordinates.lon,
          appid: OPENWEATHER_API_KEY
        }
      });

      const data = response.data.list[0];
      const components = data.components;

      return {
        aqi: data.main.aqi * 50, // Convert to US AQI scale
        pm25: Math.round(components.pm2_5 || 0),
        pm10: Math.round(components.pm10 || 0),
        o3: Math.round(components.o3 || 0),
        no2: Math.round(components.no2 || 0),
        so2: Math.round(components.so2 || 0),
        co: Math.round(components.co || 0),
        timestamp: new Date().toISOString(),
        location
      };
    } catch (error) {
      console.warn('Failed to fetch real AQI data, using mock data:', error);
      return this.getMockAQI(location);
    }
  }

  static async getForecast(location: LocationData): Promise<ForecastData[]> {
    try {
      // Try to get real forecast data
      const response = await axios.get(`${this.BASE_URL}/air_pollution/forecast`, {
        params: {
          lat: location.coordinates.lat,
          lon: location.coordinates.lon,
          appid: OPENWEATHER_API_KEY
        }
      });

      return response.data.list.slice(0, 48).map((item: any) => ({
        timestamp: new Date(item.dt * 1000).toISOString(),
        aqi: item.main.aqi * 50,
        pm25: Math.round(item.components.pm2_5 || 0),
        pm10: Math.round(item.components.pm10 || 0)
      }));
    } catch (error) {
      console.warn('Failed to fetch real forecast data, using mock data:', error);
      return this.getMockForecast();
    }
  }

  static async searchLocations(query: string): Promise<LocationData[]> {
    try {
      const response = await axios.get(`${this.GEOCODING_URL}/direct`, {
        params: {
          q: query,
          limit: 5,
          appid: OPENWEATHER_API_KEY
        }
      });

      return response.data.map((item: any) => ({
        city: item.name,
        country: item.country,
        coordinates: { lat: item.lat, lon: item.lon }
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
    try {
      const response = await axios.get(`${this.GEOCODING_URL}/reverse`, {
        params: {
          lat,
          lon,
          limit: 1,
          appid: OPENWEATHER_API_KEY
        }
      });

      const data = response.data[0];
      return {
        city: data.name,
        country: data.country,
        coordinates: { lat, lon }
      };
    } catch (error) {
      console.warn('Failed to reverse geocode:', error);
      return {
        city: 'Current Location',
        country: 'Unknown',
        coordinates: { lat, lon }
      };
    }
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