import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, MapPin, Loader, Navigation, Target, Clock, Star, Zap, Wifi } from 'lucide-react';
import { LocationData } from '../types';
import { SearchService } from '../services/searchService';
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
  hasStation?: boolean;
  relevanceScore?: number;
  type?: 'city' | 'station' | 'coordinate' | 'recent' | 'favorite';
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
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchStats, setSearchStats] = useState({ searchTime: 0, resultCount: 0 });
  
  // Local storage state
  const [recentSearches, setRecentSearches] = useState<LocationData[]>([]);
  const [favorites, setFavorites] = useState<LocationData[]>([]);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Load saved data on mount
  useEffect(() => {
    try {
      const recent = localStorage.getItem('recentSearches');
      const favs = localStorage.getItem('favoriteLocations');
      
      if (recent) setRecentSearches(JSON.parse(recent));
      if (favs) setFavorites(JSON.parse(favs));
    } catch (error) {
      console.error('Failed to load saved search data:', error);
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      // Show recent searches and favorites for empty/short queries
      const combinedResults: SearchResult[] = [
        ...favorites.map(loc => ({ ...loc, isFavorite: true, type: 'favorite' as const })),
        ...recentSearches
          .filter(recent => !favorites.some(fav => 
            fav.city === recent.city && fav.country === recent.country
          ))
          .map(loc => ({ ...loc, isRecent: true, type: 'recent' as const }))
      ];
      
      setResults(combinedResults.slice(0, 8));
      setShowResults(combinedResults.length > 0);
      setSearchStats({ searchTime: 0, resultCount: combinedResults.length });
      return;
    }

    // Cancel previous search
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setSelectedIndex(-1);
    
    const startTime = performance.now();
    
    try {
      const searchResults = await SearchService.searchLocations(
        searchQuery,
        currentLocation || undefined,
        {
          includeStations: true,
          includeCoordinates: true,
          maxResults: 10
        }
      );

      // Add local data flags
      const enhancedResults = searchResults.map(result => ({
        ...result,
        isFavorite: favorites.some(fav => 
          fav.city === result.city && fav.country === result.country
        ),
        isRecent: recentSearches.some(recent => 
          recent.city === result.city && recent.country === result.country
        )
      }));

      const searchTime = performance.now() - startTime;
      
      setResults(enhancedResults);
      setShowResults(true);
      setSearchStats({ 
        searchTime: Math.round(searchTime), 
        resultCount: enhancedResults.length 
      });
      
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Search failed:', error);
        setResults([]);
        setShowResults(false);
      }
    } finally {
      setLoading(false);
    }
  }, [favorites, recentSearches, currentLocation]);

  // Search effect with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      debouncedSearch(query);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, debouncedSearch]);

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

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.children[selectedIndex + 1] as HTMLElement; // +1 for header
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const handleLocationClick = async (location: SearchResult) => {
    try {
      setLoading(true);
      
      // Validate location has monitoring data
      const testData = await AQIService.getCurrentAQI(location);
      
      if (testData) {
        onLocationSelect(location);
        setQuery('');
        setShowResults(false);
        setSelectedIndex(-1);
        
        // Update recent searches
        const updatedRecent = [
          location,
          ...recentSearches.filter(recent => 
            !(recent.city === location.city && recent.country === location.country)
          )
        ].slice(0, 8); // Increased to 8 recent items
        
        setRecentSearches(updatedRecent);
        localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));
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

  const toggleFavorite = useCallback((location: LocationData, e: React.MouseEvent) => {
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
      updatedFavorites = [...favorites, location].slice(0, 12); // Increased to 12 favorites
    }
    
    setFavorites(updatedFavorites);
    localStorage.setItem('favoriteLocations', JSON.stringify(updatedFavorites));
  }, [favorites]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  }, []);

  // Memoized helper functions
  const getLocationIcon = useMemo(() => (result: SearchResult) => {
    if (result.isFavorite) return <Star className="h-4 w-4 text-yellow-500 fill-current" />;
    if (result.isRecent) return <Clock className="h-4 w-4 text-gray-400" />;
    if (result.hasStation) return <Wifi className="h-4 w-4 text-green-500" />;
    if (result.type === 'coordinate') return <Target className="h-4 w-4 text-blue-500" />;
    return <MapPin className="h-4 w-4 text-gray-400" />;
  }, []);

  const formatDistance = useCallback((distance?: number) => {
    if (!distance) return '';
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    if (distance < 10) return `${distance.toFixed(1)}km`;
    return `${Math.round(distance)}km`;
  }, []);

  const getResultTypeLabel = useCallback((result: SearchResult) => {
    if (result.hasStation) return 'Monitoring Station';
    if (result.type === 'coordinate') return 'Coordinates';
    if (result.type === 'station') return 'Air Quality Station';
    return 'City';
  }, []);

  // Enhanced location selection with precise GPS
  const handlePreciseLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          setLoading(true);
          const locationData = await SearchService.reverseGeocode(latitude, longitude);
          await handleLocationClick(locationData);
        } catch (error) {
          console.error('Precise location failed:', error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        onGetCurrentLocation(); // Fallback to regular geolocation
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 60000 
      }
    );
  }, [onGetCurrentLocation, handleLocationClick]);

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search cities, coordinates, or monitoring stations..."
            className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm bg-white/80 transition-all duration-200 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowResults(results.length > 0)}
            onBlur={() => setTimeout(() => setShowResults(false), 200)}
          />
          
          {/* Loading indicator */}
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
          
          {/* Search stats */}
          {!loading && query.length >= 2 && searchStats.resultCount > 0 && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
              {searchStats.resultCount} • {searchStats.searchTime}ms
            </div>
          )}
        </div>
        
        {/* Current Location Button */}
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

        {/* Precise Location Button */}
        <button
          onClick={handlePreciseLocation}
          disabled={loading}
          className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
          title="Get precise GPS location"
        >
          <Target className="h-4 w-4" />
          <span className="hidden sm:inline">Precise</span>
        </button>
      </div>

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-xl z-50 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300"
        >
          {/* Results Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {query.length < 2 ? 'Recent & Favorites' : 'Search Results'}
              </span>
              {searchStats.resultCount > 0 && (
                <span className="text-xs text-gray-400">
                  ({searchStats.resultCount} found in {searchStats.searchTime}ms)
                </span>
              )}
            </div>
            
            {query.length < 2 && recentSearches.length > 0 && (
              <button
                onClick={clearRecentSearches}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Clear Recent
              </button>
            )}
          </div>

          {/* Results List */}
          {results.map((location, index) => {
            const isSelected = index === selectedIndex;
            const isFavorite = favorites.some(fav => 
              fav.city === location.city && fav.country === location.country
            );
            
            return (
              <button
                key={`${location.city}-${location.country}-${index}`}
                onClick={() => handleLocationClick(location)}
                className={`w-full px-4 py-3 text-left transition-all duration-150 flex items-center justify-between group ${
                  isSelected 
                    ? 'bg-blue-50 border-l-4 border-blue-500' 
                    : 'hover:bg-gray-50'
                } first:rounded-t-xl last:rounded-b-xl`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getLocationIcon(location)}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 truncate">
                        {location.city}
                      </span>
                      
                      {location.state && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {location.state}
                        </span>
                      )}
                      
                      {location.hasStation && (
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live monitoring station" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{location.country}</span>
                      
                      {location.distance && (
                        <>
                          <span>•</span>
                          <span>{formatDistance(location.distance)} away</span>
                        </>
                      )}
                      
                      <span>•</span>
                      <span>{getResultTypeLabel(location)}</span>
                    </div>
                    
                    <div className="text-xs text-gray-400 mt-1">
                      {location.coordinates.lat.toFixed(4)}, {location.coordinates.lon.toFixed(4)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {location.relevanceScore && location.relevanceScore > 80 && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <Zap className="h-3 w-3" />
                      <span>Match</span>
                    </div>
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

          {/* No Results */}
          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="px-4 py-8 text-center text-gray-500">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="font-medium">No locations found</p>
              <p className="text-sm">Try a different city, coordinates, or check spelling</p>
            </div>
          )}
        </div>
      )}

      {/* Search Tips */}
      {query.length === 0 && !showResults && (
        <div className="mt-2 text-xs text-gray-500 text-center space-y-1">
          <p>Search by city name, coordinates (lat,lon), or monitoring station</p>
          <p className="text-gray-400">Examples: "New York", "40.7128,-74.0060", "Beijing Embassy"</p>
        </div>
      )}
    </div>
  );
};