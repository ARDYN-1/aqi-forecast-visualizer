import { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { AQIService } from '../services/aqiService';

export const useGeolocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const locationData = await AQIService.reverseGeocode(latitude, longitude);
          setLocation(locationData);
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
          setLocation({
            city: 'Current Location',
            country: 'Unknown',
            coordinates: { lat: latitude, lon: longitude }
          });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setError('Unable to retrieve your location');
        setLoading(false);
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Auto-get location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  return { location, loading, error, getCurrentLocation };
};