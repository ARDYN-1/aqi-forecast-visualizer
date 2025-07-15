import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader, Navigation, Target, Clock, Star } from 'lucide-react';
import { LocationData } from '../types';
import { AQIService } from '../services/aqiService';

interface LocationSearchProps {
  onLocationSelect: (location: LocationData) => void;
  currentLocation: LocationData | null;
  onGetCurrentLocation: () => void;
  geoLoading: boolean;
}

interface SearchResult extends LocationData {
  distance?: number;
  isRecent?: boolean;
  isFavorite?: boolean;
  state?: string;
  region?: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelect,
  currentLocation,
  onGetCurrentLocation,
  geoLoading
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<LocationData[]>([]);
  const [favorites, setFavorites] = useState<LocationData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load recent searches and favorites from localStorage
  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    const favs = localStorage.getItem('favoriteLocations');
    
    if (recent) {
      try {
        setRecentSearches(JSON.parse(recent));
      } catch (error) {
        console.error('Failed to parse recent searches:', error);
      }
    }
    
    if (favs) {
      try {
        setFavorites(JSON.parse(favs));
      } catch (error) {
        console.error('Failed to parse favorites:', error);
      }
    }
  }, []);

  // Enhanced search with multiple data sources
  useEffect(() => {
    if (query.length < 2) {
      // Show recent searches and favorites when no query
      const combinedResults: SearchResult[] = [
        ...favorites.map(loc => ({ ...loc, isFavorite: true })),
        ...recentSearches.filter(recent => 
          !favorites.some(fav => fav.city === recent.city && fav.country === recent.country)
        ).map(loc => ({ ...loc, isRecent: true }))
      ];
      
      setResults(combinedResults.slice(0, 8));
      setShowResults(combinedResults.length > 0);
      return;
    }

    const searchLocations = async () => {
      setLoading(true);
      setSelectedIndex(-1);
      
      try {
        // Enhanced search with multiple strategies
        const searchResults = await Promise.all([
          AQIService.searchLocations(query),
          AQIService.searchNearbyStations(query),
          AQIService.searchByCoordinates(query)
        ]);

        // Combine and deduplicate results
        const allResults = searchResults.flat();
        const uniqueResults = allResults.filter((location, index, self) => 
          index === self.findIndex(l => 
            l.city.toLowerCase() === location.city.toLowerCase() && 
            l.country.toLowerCase() === location.country.toLowerCase()
          )
        );

        // Add distance calculation if current location is available
        const resultsWithDistance = await Promise.all(
          uniqueResults.map(async (location) => {
            let distance;
            if (currentLocation) {
              distance = calculateDistance(
                currentLocation.coordinates.lat,
                currentLocation.coordinates.lon,
                location.coordinates.lat,
                location.coordinates.lon
              );
            }

            // Check if location has monitoring station
            const hasStation = await AQIService.checkStationAvailability(location);
            
            return {
              ...location,
              distance,
              hasStation
            } as SearchResult;
          })
        );

        // Sort by relevance: exact matches first, then by distance
        const sortedResults = resultsWithDistance.sort((a, b) => {
          // Exact city name matches first
          const aExact = a.city.toLowerCase() === query.toLowerCase();
          const bExact = b.city.toLowerCase() === query.toLowerCase();
          
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          // Then by distance if available
          if (a.distance !== undefined && b.distance !== undefined) {
            return a.distance - b.distance;
          }
          
          // Finally alphabetically
          return a.city.localeCompare(b.city);
        });

        setResults(sortedResults.slice(0, 10));
        setShowResults(true);
      } catch (error) {
        console.error('Enhanced search error:', error);
        // Fallback to basic search
        try {
          const basicResults = await AQIService.searchLocations(query);
          setResults(basicResults.slice(0, 8));
          setShowResults(true);
        } catch (fallbackError) {
          console.error('Fallback search failed:', fallbackError);
          setResults([]);
          setShowResults(false);
        }
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchLocations, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, currentLocation]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showResults || results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleLocationClick(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowResults(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    if (showResults) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showResults, results, selectedIndex]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleLocationClick = async (location: SearchResult) => {
    // Validate location has monitoring data before selecting
    try {
      setLoading(true);
      
      // Test if we can get AQI data for this location
      const testData = await AQIService.getCurrentAQI(location);
      
      if (testData) {
        onLocationSelect(location);
        setQuery('');
        setShowResults(false);
        setSelectedIndex(-1);
        
        // Add to recent searches
        const updatedRecent = [
          location,
          ...recentSearches.filter(recent => 
            !(recent.city === location.city && recent.country === location.country)
          )
        ].slice(0, 5);
        
        setRecentSearches(updatedRecent);
        localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));
      } else {
        throw new Error('No monitoring data available');
      }
    } catch (error) {
      console.error('Location validation failed:', error);
      // Still allow selection but show warning
      onLocationSelect(location);
      setQuery('');
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (location: LocationData, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isFavorite = favorites.some(fav => 
      fav.city === location.city && fav.country === location.country
    );
    
    let updatedFavorites;
    if (isFavorite) {
      updatedFavorites = favorites.filter(fav => 
        !(fav.city === location.city && fav.country === location.country)
      );
    } else {
      updatedFavorites = [...favorites, location].slice(0, 10);
    }
    
    setFavorites(updatedFavorites);
    localStorage.setItem('favoriteLocations', JSON.stringify(updatedFavorites));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getLocationIcon = (result: SearchResult) => {
    if (result.isFavorite) return <Star className="h-4 w-4 text-yellow-500 fill-current" />;
    if (result.isRecent) return <Clock className="h-4 w-4 text-gray-400" />;
    return <MapPin className="h-4 w-4 text-gray-400" />;
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    if (distance < 1) return `${Math.round(distance * 1000)}m away`;
    return `${Math.round(distance)}km away`;
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search cities, coordinates, or monitoring stations..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80 transition-all duration-200 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowResults(results.length > 0)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
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
          title="Get current location"
        >
          {geoLoading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">Current</span>
        </button>

        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  const { latitude, longitude } = position.coords;
                  try {
                    const locationData = await AQIService.reverseGeocode(latitude, longitude);
                    handleLocationClick(locationData);
                  } catch (error) {
                    console.error('Precise location failed:', error);
                  }
                },
                (error) => console.error('Geolocation error:', error),
                { enableHighAccuracy: true, timeout: 10000 }
              );
            }
          }}
          className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-2"
          title="Get precise location"
        >
          <Target className="h-4 w-4" />
          <span className="hidden sm:inline">Precise</span>
        </button>
      </div>

      {showResults && results.length > 0 && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg z-50 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300"
        >
          {/* Header for recent/favorites */}
          {query.length < 2 && (
            <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {favorites.length > 0 ? 'Favorites & Recent' : 'Recent Searches'}
              </span>
              {recentSearches.length > 0 && (
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {results.map((location, index) => {
            const isSelected = index === selectedIndex;
            const isFavorite = favorites.some(fav => 
              fav.city === location.city && fav.country === location.country
            );
            
            return (
              <button
                key={`${location.city}-${location.country}-${index}`}
                onClick={() => handleLocationClick(location)}
                className={`w-full px-4 py-3 text-left transition-colors duration-150 flex items-center justify-between group ${
                  isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                } first:rounded-t-xl last:rounded-b-xl`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getLocationIcon(location)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 truncate">
                        {location.city}
                      </span>
                      {location.state && (
                        <span className="text-xs text-gray-500">
                          {location.state}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{location.country}</span>
                      {location.distance && (
                        <>
                          <span>•</span>
                          <span>{formatDistance(location.distance)}</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {location.coordinates.lat.toFixed(4)}, {location.coordinates.lon.toFixed(4)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(location as any).hasStation && (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="Monitoring station available" />
                  )}
                  <button
                    onClick={(e) => toggleFavorite(location, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                  >
                    <Star className={`h-3 w-3 ${isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                  </button>
                </div>
              </button>
            );
          })}

          {/* No results message */}
          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="px-4 py-8 text-center text-gray-500">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="font-medium">No locations found</p>
              <p className="text-sm">Try searching for a different city or region</p>
            </div>
          )}
        </div>
      )}

      {/* Search tips */}
      {query.length === 0 && !showResults && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          <p>Search by city name, coordinates (lat,lon), or monitoring station</p>
        </div>
      )}
    </div>
  );
};