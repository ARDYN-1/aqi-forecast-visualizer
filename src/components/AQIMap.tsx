import React, { useState, useEffect } from 'react';
import { LocationData } from '../types';
import { getAQIColor } from '../utils/aqiUtils';
import { AQIService } from '../services/aqiService';
import { Map, MapPin, Loader, Globe } from 'lucide-react';

interface AQIMapProps {
  selectedLocation: LocationData | null;
  onLocationSelect: (location: LocationData) => void;
}

interface LocationWithAQI extends LocationData {
  aqi: number;
  loading?: boolean;
}

export const AQIMap: React.FC<AQIMapProps> = ({ selectedLocation, onLocationSelect }) => {
  const [mapLocations, setMapLocations] = useState<LocationWithAQI[]>([]);
  const [loading, setLoading] = useState(true);

  const majorCities: LocationData[] = [
    { city: 'New York', country: 'USA', coordinates: { lat: 40.7128, lon: -74.0060 } },
    { city: 'London', country: 'UK', coordinates: { lat: 51.5074, lon: -0.1278 } },
    { city: 'Tokyo', country: 'Japan', coordinates: { lat: 35.6762, lon: 139.6503 } },
    { city: 'Mumbai', country: 'India', coordinates: { lat: 19.0760, lon: 72.8777 } },
    { city: 'Beijing', country: 'China', coordinates: { lat: 39.9042, lon: 116.4074 } },
    { city: 'Los Angeles', country: 'USA', coordinates: { lat: 34.0522, lon: -118.2437 } },
    { city: 'Paris', country: 'France', coordinates: { lat: 48.8566, lon: 2.3522 } },
    { city: 'Sydney', country: 'Australia', coordinates: { lat: -33.8688, lon: 151.2093 } }
  ];

  useEffect(() => {
    const fetchAQIData = async () => {
      setLoading(true);
      const locationsWithAQI: LocationWithAQI[] = [];

      for (const location of majorCities) {
        try {
          const aqiData = await AQIService.getCurrentAQI(location);
          locationsWithAQI.push({
            ...location,
            aqi: aqiData.aqi
          });
        } catch (error) {
          console.error(`Failed to fetch AQI for ${location.city}:`, error);
          locationsWithAQI.push({
            ...location,
            aqi: 50 // Default fallback
          });
        }
      }

      setMapLocations(locationsWithAQI);
      setLoading(false);
    };

    fetchAQIData();
  }, []);

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { text: 'Good', color: 'text-green-600' };
    if (aqi <= 100) return { text: 'Moderate', color: 'text-yellow-600' };
    if (aqi <= 150) return { text: 'Unhealthy for Sensitive', color: 'text-orange-600' };
    if (aqi <= 200) return { text: 'Unhealthy', color: 'text-red-600' };
    if (aqi <= 300) return { text: 'Very Unhealthy', color: 'text-purple-600' };
    return { text: 'Hazardous', color: 'text-red-800' };
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="h-5 w-5 text-gray-600" />
        <h3 className="text-xl font-semibold text-gray-900">Global AQI Monitor</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading global data...</span>
        </div>
      ) : (
        <>
          {/* World Map Visualization */}
          <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 mb-6 min-h-[200px] border border-gray-200 overflow-hidden">
            {/* Background pattern to simulate world map */}
            <div className="absolute inset-0 opacity-10">
              <svg viewBox="0 0 400 200" className="w-full h-full">
                {/* Simplified world continents */}
                <path d="M50 80 Q80 60 120 80 L140 100 Q160 90 180 100 L200 120 Q220 110 240 120 L260 140 Q280 130 300 140 L320 160 Q340 150 360 160" 
                      stroke="currentColor" strokeWidth="2" fill="none" className="text-gray-400"/>
                <path d="M60 120 Q90 100 130 120 L150 140 Q170 130 190 140 L210 160 Q230 150 250 160" 
                      stroke="currentColor" strokeWidth="2" fill="none" className="text-gray-400"/>
              </svg>
            </div>

            {/* Location markers */}
            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3">
              {mapLocations.map((location, index) => {
                const isSelected = selectedLocation?.city === location.city;
                const status = getAQIStatus(location.aqi);
                
                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'bg-white shadow-md border-2 border-blue-500 scale-105' 
                        : 'bg-white/70 hover:bg-white/90 hover:shadow-sm'
                    }`}
                    onClick={() => onLocationSelect(location)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-3 h-3 rounded-full ${getAQIColor(location.aqi)}`}></div>
                      <span className="font-medium text-sm text-gray-900">{location.city}</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-1">{location.country}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">{location.aqi}</span>
                      <span className={`text-xs font-medium ${status.color}`}>{status.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">Good (0-50)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">Moderate (51-100)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-600">Unhealthy (101-150)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Dangerous (151+)</span>
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-4 p-3 bg-gray-50 rounded-xl">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {mapLocations.filter(l => l.aqi <= 50).length}
                </div>
                <div className="text-xs text-gray-500">Good</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">
                  {mapLocations.filter(l => l.aqi > 50 && l.aqi <= 100).length}
                </div>
                <div className="text-xs text-gray-500">Moderate</div>
              </div>
              <div>
                <div className="text-lg font-bold text-red-600">
                  {mapLocations.filter(l => l.aqi > 100).length}
                </div>
                <div className="text-xs text-gray-500">Unhealthy</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};