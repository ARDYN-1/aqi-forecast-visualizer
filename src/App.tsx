import React, { useState, useEffect } from 'react';
import { Wind, Wifi, WifiOff } from 'lucide-react';
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

  const { location: geoLocation, loading: geoLoading, getCurrentLocation } = useGeolocation();
  const { data: aqiData, loading: aqiLoading, error: aqiError } = useAQI(selectedLocation);
  const { forecast, loading: forecastLoading, error: forecastError } = useForecast(selectedLocation);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
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

  const handleLocationSelect = (location: LocationData) => {
    setSelectedLocation(location);
  };

  const handleGetCurrentLocation = () => {
    getCurrentLocation();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.1)_1px,transparent_0)] [background-size:20px_20px]"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-xl">
                  <Wind className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AirWatch</h1>
                  <p className="text-sm text-gray-600">Real-time Air Quality Monitor</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-600">
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                
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

          {/* Error Message */}
          {!isOnline && (
            <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-2">
                <WifiOff className="h-5 w-5 text-yellow-600" />
                <span className="text-yellow-800">
                  You're offline. Showing cached data when available.
                </span>
              </div>
            </div>
          )}

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - AQI Data */}
            <div className="lg:col-span-2 space-y-8">
              <AQICard data={aqiData} loading={aqiLoading} />
              
              <ForecastChart forecast={forecast} loading={forecastLoading} />
              
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
              
              <div className="hidden lg:block">
                <AQIMap 
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleLocationSelect}
                />
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-sm text-gray-600">
              <p>
                Data updates every 5 minutes • Built with ❤️ for cleaner air awareness
              </p>
              <p className="mt-2">
                Emergency? Call local authorities if AQI {'>'}  300
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;