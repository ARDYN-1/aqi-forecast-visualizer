import { useState, useEffect } from 'react';
import { LocationData } from '../types';

export const useGeolocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Mock reverse geocoding - replace with real service
        const mockLocation: LocationData = {
          city: 'Current Location',
          country: 'Unknown',
          coordinates: { lat: latitude, lon: longitude }
        };
        
        setLocation(mockLocation);
        setLoading(false);
      },
      (error) => {
        setError('Unable to retrieve your location');
        setLoading(false);
        console.error('Geolocation error:', error);
      }
    );
  };

  return { location, loading, error, getCurrentLocation };
};