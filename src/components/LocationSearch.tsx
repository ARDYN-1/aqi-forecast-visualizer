import React, { useState, useEffect } from 'react';
import { Search, MapPin, Loader } from 'lucide-react';
import { LocationData } from '../types';
import { AQIService } from '../services/aqiService';

interface LocationSearchProps {
  onLocationSelect: (location: LocationData) => void;
  currentLocation: LocationData | null;
  onGetCurrentLocation: () => void;
  geoLoading: boolean;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  currentLocation,
  onGetCurrentLocation,
  geoLoading
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const searchLocations = async () => {
      setLoading(true);
      try {
        const locations = await AQIService.searchLocations(query);
        setResults(locations);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchLocations, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleLocationClick = (location: LocationData) => {
    onLocationSelect(location);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search for a city or location..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80 transition-all duration-200 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowResults(results.length > 0)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)} // Delay to allow clicks
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
        </div>
        
        <button
          onClick={onGetCurrentLocation}
          disabled={geoLoading}
          className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {geoLoading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Current Location</span>
        </button>
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg z-50 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
          {results.map((location, index) => (
            <button
              key={index}
              onClick={() => handleLocationClick(location)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-center gap-3 first:rounded-t-xl last:rounded-b-xl text-sm"
            >
              <MapPin className="h-4 w-4 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">{location.city}</div>
                <div className="text-xs text-gray-500">{location.country}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};