import React, { useState } from 'react';
import { LocationData, AQIData } from '../types';
import { getAQIColor } from '../utils/aqiUtils';
import { Map, MapPin, Loader } from 'lucide-react';

interface AQIMapProps {
  selectedLocation: LocationData | null;
  onLocationSelect: (location: LocationData) => void;
}

export const AQIMap: React.FC<AQIMapProps> = ({ selectedLocation, onLocationSelect }) => {
  const [mapLocations] = useState<LocationData[]>([
    {
      city: 'Dhaka',
      country: 'Bangladesh',
      coordinates: { lat: 23.8103, lon: 90.4125 }
    },
    {
      city: 'Mumbai',
      country: 'India',
      coordinates: { lat: 19.0760, lon: 72.8777 }
    },
    {
      city: 'New York',
      country: 'USA',
      coordinates: { lat: 40.7128, lon: -74.0060 }
    },
    {
      city: 'London',
      country: 'UK',
      coordinates: { lat: 51.5074, lon: -0.1278 }
    },
    {
      city: 'Tokyo',
      country: 'Japan',
      coordinates: { lat: 35.6762, lon: 139.6503 }
    }
  ]);

  const [mockAQIData] = useState<Record<string, number>>({
    'Dhaka': 165,
    'Mumbai': 142,
    'New York': 78,
    'London': 45,
    'Tokyo': 92
  });

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <Map className="h-5 w-5 text-gray-600" />
        <h3 className="text-xl font-semibold text-gray-900">AQI Map</h3>
      </div>

      <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8 min-h-[300px] border border-gray-200">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-green-400/10 rounded-xl"></div>
        
        <div className="relative space-y-4">
          {mapLocations.map((location, index) => {
            const aqi = mockAQIData[location.city] || 50;
            const isSelected = selectedLocation?.city === location.city;
            
            return (
              <div
                key={index}
                className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'bg-white/90 shadow-md border-2 border-blue-500' 
                    : 'bg-white/60 hover:bg-white/80'
                }`}
                onClick={() => onLocationSelect(location)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${getAQIColor(aqi)}`}></div>
                  <div>
                    <div className="font-semibold text-gray-900">{location.city}</div>
                    <div className="text-sm text-gray-500">{location.country}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{aqi}</div>
                    <div className="text-xs text-gray-500">AQI</div>
                  </div>
                  <MapPin className={`h-4 w-4 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Good</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span>Unhealthy</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Dangerous</span>
        </div>
      </div>
    </div>
  );
};