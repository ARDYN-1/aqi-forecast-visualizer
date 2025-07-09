import { useState, useEffect } from 'react';
import { ForecastData, LocationData } from '../types';
import { AQIService } from '../services/aqiService';

export const useForecast = (location: LocationData | null) => {
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;

    const fetchForecast = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const forecastData = await AQIService.getForecast(location);
        setForecast(forecastData);
      } catch (err) {
        setError('Failed to fetch forecast data');
        console.error('Forecast fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [location]);

  return { forecast, loading, error };
};