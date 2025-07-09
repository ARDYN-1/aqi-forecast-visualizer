import { AQIData, ForecastData, LocationData } from '../types';

// Mock API service - replace with real API calls
export class AQIService {
  private static readonly mockLocations: LocationData[] = [
    {
      city: 'Dhaka',
      country: 'Bangladesh',
      coordinates: { lat: 23.8103, lon: 90.4125 }
    },
    {
      city: 'Mumbai',
      country: 'India',
      coordinates: { lat: 19.0760, lon: 72.8777 }
    },
    {
      city: 'New York',
      country: 'USA',
      coordinates: { lat: 40.7128, lon: -74.0060 }
    },
    {
      city: 'London',
      country: 'UK',
      coordinates: { lat: 51.5074, lon: -0.1278 }
    },
    {
      city: 'Tokyo',
      country: 'Japan',
      coordinates: { lat: 35.6762, lon: 139.6503 }
    }
  ];

  static async getCurrentAQI(location: LocationData): Promise<AQIData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate mock data
    const aqi = Math.floor(Math.random() * 200) + 20;
    const pm25 = Math.floor(Math.random() * 100) + 10;
    const pm10 = Math.floor(Math.random() * 150) + 20;
    
    return {
      aqi,
      pm25,
      pm10,
      o3: Math.floor(Math.random() * 80) + 10,
      no2: Math.floor(Math.random() * 60) + 5,
      so2: Math.floor(Math.random() * 40) + 2,
      co: Math.floor(Math.random() * 2000) + 100,
      timestamp: new Date().toISOString(),
      location
    };
  }

  static async getForecast(location: LocationData): Promise<ForecastData[]> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const forecast: ForecastData[] = [];
    const now = new Date();
    
    for (let i = 0; i < 48; i++) {
      const timestamp = new Date(now.getTime() + i * 60 * 60 * 1000);
      const aqi = Math.floor(Math.random() * 150) + 30;
      const pm25 = Math.floor(Math.random() * 80) + 15;
      const pm10 = Math.floor(Math.random() * 120) + 25;
      
      forecast.push({
        timestamp: timestamp.toISOString(),
        aqi,
        pm25,
        pm10
      });
    }
    
    return forecast;
  }

  static async searchLocations(query: string): Promise<LocationData[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return this.mockLocations.filter(location => 
      location.city.toLowerCase().includes(query.toLowerCase()) ||
      location.country.toLowerCase().includes(query.toLowerCase())
    );
  }

  static async getMultipleLocationsAQI(locations: LocationData[]): Promise<AQIData[]> {
    const promises = locations.map(location => this.getCurrentAQI(location));
    return Promise.all(promises);
  }
}