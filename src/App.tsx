import React, { useState, useEffect } from 'react';
import { Wind, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { LocationData, Language } from './types';
import { LocationSearch } from './components/LocationSearch';
import { AQICard } from './components/AQICard';
import { ForecastChart } from './components/ForecastChart';
import { HealthRecommendations } from './components/HealthRecommendations';
import { AQIMap } from './components/AQIMap';
import { LanguageSelector } from './components/LanguageSelector';
import { useAQI } from './hooks/useAQI';
import { useForecast } from './hooks/useForecast';
import { useGeolocation } from './hooks/useGeolocation';

function App() {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { location: geoLocation, loading: geoLoading, getCurrentLocation } = useGeolocation();
  const { data: aqiData, loading: aqiLoading, error: aqiError } = useAQI(selectedLocation);
  const { forecast, loading: forecastLoading, error: forecastError } = useForecast(selectedLocation);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastUpdated(new Date());
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (geoLocation && !selectedLocation) {
      setSelectedLocation(geoLocation);
    }
  }, [geoLocation, selectedLocation]);

  useEffect(() => {
    if (aqiData) {
      setLastUpdated(new Date());
    }
  }, [aqiData]);

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
  };

  const handleGetCurrentLocation = () => {
    getCurrentLocation();
  };

  const handleRefresh = () => {
    if (selectedLocation) {
      // Force refresh by updating the location
      setSelectedLocation({ ...selectedLocation });
      setLastUpdated(new Date());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.1)_1px,transparent_0)] [background-size:20px_20px] animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-400/5 to-green-400/5"></div>
      </div>
      
      <div className="relative z-10">
        {/* Enhanced Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl shadow-lg">
                    <Wind className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    AirWatch Pro
                  </h1>
                  <p className="text-sm text-gray-600">Real-time Global Air Quality Monitor</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Connection Status */}
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-700 font-medium">Online</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full">
                      <WifiOff className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700 font-medium">Offline</span>
                    </div>
                  )}
                </div>

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={aqiLoading}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh data"
                >
                  <RefreshCw className={`h-4 w-4 ${aqiLoading ? 'animate-spin' : ''}`} />
                </button>
                
                <LanguageSelector 
                  currentLanguage={language} 
                  onLanguageChange={setLanguage} 
                />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Section */}
          <div className="mb-8">
            <LocationSearch
              onLocationSelect={handleLocationSelect}
              currentLocation={selectedLocation}
              onGetCurrentLocation={handleGetCurrentLocation}
              geoLoading={geoLoading}
            />
          </div>

          {/* Status Messages */}
          {!isOnline && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <WifiOff className="h-5 w-5 text-yellow-600" />
                <div>
                  <span className="text-yellow-800 font-medium">You're offline</span>
                  <p className="text-sm text-yellow-700 mt-1">
                    Showing cached data when available. Connect to internet for latest updates.
                  </p>
                </div>
              </div>
            </div>
          )}

          {(aqiError || forecastError) && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <WifiOff className="h-5 w-5 text-red-600" />
                <div>
                  <span className="text-red-800 font-medium">Data unavailable</span>
                  <p className="text-sm text-red-700 mt-1">
                    Unable to fetch latest air quality data. Please check your connection and try again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - AQI Data */}
            <div className="lg:col-span-2 space-y-8">
              <AQICard data={aqiData} loading={aqiLoading} />
              
              <ForecastChart forecast={forecast} loading={forecastLoading} />
              
              {/* Mobile Map */}
              <div className="lg:hidden">
                <AQIMap 
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleLocationSelect}
                />
              </div>
            </div>

            {/* Right Column - Health & Map */}
            <div className="space-y-8">
              <HealthRecommendations data={aqiData} />
              
              {/* Desktop Map */}
              <div className="hidden lg:block">
                <AQIMap 
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleLocationSelect}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Enhanced Footer */}
        <footer className="bg-white/90 backdrop-blur-md border-t border-gray-200/50 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Wind className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold text-gray-900">AirWatch Pro</span>
                </div>
                <p className="text-sm text-gray-600">
                  Real-time air quality monitoring for a healthier world.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Data Sources</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• OpenWeather Air Pollution API</li>
                  <li>• World Air Quality Index</li>
                  <li>• EPA Air Quality Standards</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Updates</h4>
                <p className="text-sm text-gray-600">
                  Data refreshes every 5 minutes
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 mt-8 pt-6 text-center">
              <p className="text-sm text-gray-600">
                Built with ❤️ for cleaner air awareness • Emergency? Call local authorities if AQI {'>'} 300
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;