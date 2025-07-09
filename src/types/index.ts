export interface AQIData {
  aqi: number;
  pm25: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  timestamp: string;
  location: {
    city: string;
    country: string;
    coordinates: {
      lat: number;
      lon: number;
    };
  };
}

export interface ForecastData {
  timestamp: string;
  aqi: number;
  pm25: number;
  pm10: number;
}

export interface HealthRecommendation {
  level: string;
  color: string;
  emoji: string;
  message: string;
  activities: string[];
}

export interface LocationData {
  city: string;
  country: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

export type Language = 'en' | 'hi' | 'bn';