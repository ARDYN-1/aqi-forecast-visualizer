import { useState, useEffect } from 'react';
import { AQIData, LocationData } from '../types';
import { AQIService } from '../services/aqiService';

export const useAQI = (location: LocationData | null) => {
  const [data, setData] = useState<AQIData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;

    const fetchAQI = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const aqiData = await AQIService.getCurrentAQI(location);
        setData(aqiData);
      } catch (err) {
        setError('Failed to fetch AQI data');
        console.error('AQI fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAQI();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchAQI, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [location]);

  return { data, loading, error };
};