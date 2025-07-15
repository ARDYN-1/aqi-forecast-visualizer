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

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000 // 5 minutes
        });
      });

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
      }
    } catch (error: any) {
      let errorMessage = 'Unable to retrieve your location';
      
      if (error.code === 1) {
        errorMessage = 'Location access denied. Please enable location services.';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable. Please try again.';
      } else if (error.code === 3) {
        errorMessage = 'Location request timed out. Please try again.';
      }
      
      setError(errorMessage);
      console.error('Geolocation error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-get location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  return { location, loading, error, getCurrentLocation };
};