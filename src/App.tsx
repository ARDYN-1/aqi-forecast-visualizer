import React, { useState, useEffect } from 'react';
import { LocationData, Language } from './types';
import { AnimatedBackground } from './components/AnimatedBackground';
import { LocationSearch } from './components/LocationSearch';
import { AQICard } from './components/AQICard';
import { ForecastChart } from './components/ForecastChart';
import { HealthRecommendations } from './components/HealthRecommendations';
import { InteractiveMap } from './components/InteractiveMap';
import { LanguageSelector } from './components/LanguageSelector';
import { useAQI } from './hooks/useAQI';
import { useForecast } from './hooks/useForecast';
import { useGeolocation } from './hooks/useGeolocation';
import { Wind, Zap, Globe, RefreshCw, AlertCircle } from 'lucide-react';

function App() {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [language, setLanguage] = useState<Language>('en');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { location: geoLocation, loading: geoLoading, getCurrentLocation } = useGeolocation();
  const { data: aqiData, loading: aqiLoading, error: aqiError } = useAQI(selectedLocation);
  const { forecast, loading: forecastLoading, error: forecastError } = useForecast(selectedLocation);

  // Set initial location from geolocation
  useEffect(() => {
    if (geoLocation && !selectedLocation) {
      setSelectedLocation(geoLocation);
    }
  }, [geoLocation, selectedLocation]);

  // Monitor online status
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

  // Update timestamp when data changes
  useEffect(() => {
    if (aqiData) {
      setLastUpdated(new Date());
    }
  }, [aqiData]);

  const handleRefresh = () => {
    if (selectedLocation) {
      // Force refresh by updating the location object
      setSelectedLocation({ ...selectedLocation });
      setLastUpdated(new Date());
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <AnimatedBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo and Title */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Wind className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">AirWatch</h1>
                  <p className="text-xs text-gray-500">Real-time Air Quality Monitor</p>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center gap-4">
                {/* Online Status */}
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-600">{isOnline ? 'Online' : 'Offline'}</span>
                </div>

                {/* Language Selector */}
                <LanguageSelector currentLanguage={language} onLanguageChange={setLanguage} />

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={aqiLoading || !selectedLocation}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh data"
                >
                  <RefreshCw className={`h-4 w-4 ${aqiLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {getGreeting()}! 👋
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Monitor air quality in real-time and stay informed about your environment
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <LocationSearch
                onLocationSelect={setSelectedLocation}
                currentLocation={selectedLocation}
                onGetCurrentLocation={getCurrentLocation}
                geoLoading={geoLoading}
              />
            </div>

            {/* Last Updated */}
            {selectedLocation && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                <Zap className="h-4 w-4" />
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {/* Error States */}
          {!isOnline && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <h3 className="font-medium text-yellow-800">You're offline</h3>
                  <p className="text-sm text-yellow-700">Some features may not work properly. Please check your internet connection.</p>
                </div>
              </div>
            </div>
          )}

          {(aqiError || forecastError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-medium text-red-800">Data Error</h3>
                  <p className="text-sm text-red-700">
                    {aqiError || forecastError} - Using fallback data for demonstration.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Current AQI */}
            <div className="lg:col-span-1">
              <AQICard data={aqiData} loading={aqiLoading} />
            </div>

            {/* Health Recommendations */}
            <div className="lg:col-span-1">
              <HealthRecommendations data={aqiData} />
            </div>

            {/* Forecast Chart */}
            <div className="lg:col-span-1">
              <ForecastChart forecast={forecast} loading={forecastLoading} />
            </div>
          </div>

          {/* Interactive Map */}
          <div className="mb-8">
            <InteractiveMap
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
            />
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* About AQI */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Globe className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">About AQI</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                The Air Quality Index (AQI) is a standardized way to communicate air pollution levels to the public. 
                It ranges from 0-500, with higher values indicating worse air quality and greater health concerns.
              </p>
            </div>

            {/* Health Impact */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Wind className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Health Impact</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Poor air quality can affect respiratory and cardiovascular health. Children, elderly, and people 
                with pre-existing conditions are particularly vulnerable to air pollution effects.
              </p>
            </div>

            {/* Data Sources */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Data Sources</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Our data comes from government monitoring stations, satellite observations, and validated 
                sensor networks to provide accurate, real-time air quality information.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                    <Wind className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold">AirWatch</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Empowering communities with real-time air quality data and health recommendations 
                  for a cleaner, healthier future.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Features</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Real-time AQI monitoring</li>
                  <li>• 48-hour forecasting</li>
                  <li>• Health recommendations</li>
                  <li>• Global coverage</li>
                  <li>• Mobile responsive</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Multi-language support</li>
                  <li>• Offline capabilities</li>
                  <li>• Accessibility features</li>
                  <li>• Regular updates</li>
                  <li>• Community driven</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 text-center">
              <p className="text-gray-400 text-sm">
                © 2025 AirWatch. Built with care for global air quality awareness.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;