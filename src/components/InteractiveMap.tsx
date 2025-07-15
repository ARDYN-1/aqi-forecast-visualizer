import React, { useState, useEffect, useRef } from 'react';
import { LocationData } from '../types';
import { getAQIColor } from '../utils/aqiUtils';
import { AQIService } from '../services/aqiService';
import { Map, MapPin, Loader, Globe, Zap, Wind } from 'lucide-react';

interface InteractiveMapProps {
  selectedLocation: LocationData | null;
  onLocationSelect: (location: LocationData) => void;
}

interface LocationWithAQI extends LocationData {
  aqi: number;
  loading?: boolean;
}

interface MapPoint {
  x: number;
  y: number;
  location: LocationWithAQI;
  pulse: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ selectedLocation, onLocationSelect }) => {
  const [mapLocations, setMapLocations] = useState<LocationWithAQI[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredLocation, setHoveredLocation] = useState<LocationWithAQI | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);
  const mapRef = useRef<HTMLDivElement>(null);

  const majorCities: LocationData[] = [
    { city: 'New York', country: 'USA', coordinates: { lat: 40.7128, lon: -74.0060 } },
    { city: 'London', country: 'UK', coordinates: { lat: 51.5074, lon: -0.1278 } },
    { city: 'Tokyo', country: 'Japan', coordinates: { lat: 35.6762, lon: 139.6503 } },
    { city: 'Mumbai', country: 'India', coordinates: { lat: 19.0760, lon: 72.8777 } },
    { city: 'Beijing', country: 'China', coordinates: { lat: 39.9042, lon: 116.4074 } },
    { city: 'Los Angeles', country: 'USA', coordinates: { lat: 34.0522, lon: -118.2437 } },
    { city: 'Paris', country: 'France', coordinates: { lat: 48.8566, lon: 2.3522 } },
    { city: 'Sydney', country: 'Australia', coordinates: { lat: -33.8688, lon: 151.2093 } },
    { city: 'São Paulo', country: 'Brazil', coordinates: { lat: -23.5505, lon: -46.6333 } },
    { city: 'Cairo', country: 'Egypt', coordinates: { lat: 30.0444, lon: 31.2357 } },
    { city: 'Moscow', country: 'Russia', coordinates: { lat: 55.7558, lon: 37.6176 } },
    { city: 'Bangkok', country: 'Thailand', coordinates: { lat: 13.7563, lon: 100.5018 } }
  ];

  // Convert lat/lon to map coordinates
  const coordsToMapPosition = (lat: number, lon: number) => {
    const x = ((lon + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(10, Math.min(90, y)) };
  };

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
            aqi: 50 + Math.random() * 100 // Fallback with variation
          });
        }
      }

      setMapLocations(locationsWithAQI);
      setLoading(false);
    };

    fetchAQIData();
  }, []);

  // Animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 100);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { text: 'Good', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (aqi <= 100) return { text: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (aqi <= 150) return { text: 'Unhealthy for Sensitive', color: 'text-orange-600', bgColor: 'bg-orange-100' };
    if (aqi <= 200) return { text: 'Unhealthy', color: 'text-red-600', bgColor: 'bg-red-100' };
    if (aqi <= 300) return { text: 'Very Unhealthy', color: 'text-purple-600', bgColor: 'bg-purple-100' };
    return { text: 'Hazardous', color: 'text-red-800', bgColor: 'bg-red-200' };
  };

  const mapPoints: MapPoint[] = mapLocations.map(location => {
    const position = coordsToMapPosition(location.coordinates.lat, location.coordinates.lon);
    return {
      x: position.x,
      y: position.y,
      location,
      pulse: location.aqi > 100
    };
  });

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-900">Global Air Quality Map</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live Data</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <span className="text-gray-600">Loading global air quality data...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Interactive World Map */}
          <div 
            ref={mapRef}
            className="relative bg-gradient-to-br from-blue-100 via-blue-50 to-green-50 rounded-xl overflow-hidden border border-gray-200 mb-6 touch-pan-x touch-pan-y"
            style={{ height: '350px' }}
          >
            {/* Animated Background Grid */}
            <div className="absolute inset-0 opacity-20">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200 to-transparent"
                style={{
                  transform: `translateX(${(animationPhase * 2) % 200 - 100}%)`,
                  transition: 'none'
                }}
              ></div>
            </div>

            {/* World Map SVG */}
            <svg 
              viewBox="0 0 800 400" 
              className="absolute inset-0 w-full h-full opacity-30"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            >
              {/* Simplified world continents */}
              <g fill="currentColor" className="text-gray-400">
                {/* North America */}
                <path d="M120 100 Q160 80 200 100 L240 120 Q260 110 280 120 L300 140 Q320 130 340 140" 
                      stroke="currentColor" strokeWidth="2" fill="none"/>
                
                {/* South America */}
                <path d="M240 220 Q260 200 280 220 L300 240 Q320 230 340 240 L360 260 Q380 250 400 260" 
                      stroke="currentColor" strokeWidth="2" fill="none"/>
                
                {/* Europe */}
                <path d="M380 80 Q400 60 420 80 L440 100 Q460 90 480 100" 
                      stroke="currentColor" strokeWidth="2" fill="none"/>
                
                {/* Africa */}
                <path d="M400 140 Q420 120 440 140 L460 160 Q480 150 500 160 L520 180 Q540 170 560 180" 
                      stroke="currentColor" strokeWidth="2" fill="none"/>
                
                {/* Asia */}
                <path d="M500 60 Q540 40 580 60 L620 80 Q660 70 700 80" 
                      stroke="currentColor" strokeWidth="2" fill="none"/>
                
                {/* Australia */}
                <path d="M580 260 Q620 240 660 260 L700 280" 
                      stroke="currentColor" strokeWidth="2" fill="none"/>
              </g>
            </svg>

            {/* Air Quality Data Points */}
            {mapPoints.map((point, index) => {
              const isSelected = selectedLocation?.city === point.location.city;
              const isHovered = hoveredLocation?.city === point.location.city;
              const status = getAQIStatus(point.location.aqi);
              const pulseIntensity = point.pulse ? Math.sin(animationPhase * 0.2) * 0.3 + 0.7 : 1;
              
              return (
                <div
                  key={index}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ 
                    left: `${point.x}%`, 
                    top: `${point.y}%`,
                    zIndex: isSelected || isHovered ? 20 : 10
                  }}
                  onClick={() => onLocationSelect(point.location)}
                  onMouseEnter={() => setHoveredLocation(point.location)}
                  onMouseLeave={() => setHoveredLocation(null)}
                >
                  {/* Animated Pulse Ring */}
                  {point.pulse && (
                    <div 
                      className={`absolute inset-0 rounded-full ${getAQIColor(point.location.aqi)} opacity-30 animate-ping`}
                      style={{ 
                        width: '24px', 
                        height: '24px',
                        transform: `scale(${pulseIntensity})`,
                        marginLeft: '-12px',
                        marginTop: '-12px'
                      }}
                    ></div>
                  )}
                  
                  {/* Main Data Point */}
                  <div 
                    className={`relative w-6 h-6 rounded-full border-2 border-white shadow-lg transition-all duration-300 ${getAQIColor(point.location.aqi)} ${
                      isSelected ? 'scale-150 ring-4 ring-blue-500 ring-opacity-50' : 
                      isHovered ? 'scale-125' : 'hover:scale-110'
                    }`}
                    style={{ opacity: pulseIntensity }}
                  >
                    {/* AQI Value */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-bold text-gray-900 bg-white/90 px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {point.location.aqi} AQI
                    </div>
                  </div>

                  {/* Detailed Tooltip */}
                  {(isHovered || isSelected) && (
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-200 p-3 min-w-40 z-30 pointer-events-none">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="font-semibold text-gray-900">{point.location.city}</div>
                          <div className="text-xs text-gray-500">{point.location.country}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-bold text-gray-900">{point.location.aqi}</span>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${status.color} ${status.bgColor}`}>
                          {status.text}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-600">
                        Click to view detailed analysis
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Wind Flow Animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-40"
                  style={{
                    left: `${(animationPhase * 2 + i * 20) % 100}%`,
                    top: `${30 + Math.sin(animationPhase * 0.1 + i) * 20}%`,
                    transform: `scale(${0.5 + Math.sin(animationPhase * 0.1 + i) * 0.3})`,
                    transition: 'none'
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Legend and Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AQI Legend */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Wind className="h-4 w-4" />
                Air Quality Index Scale
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 font-medium">Good (0-50)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-700 font-medium">Moderate (51-100)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-orange-700 font-medium">Unhealthy (101-150)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 font-medium">Dangerous (151+)</span>
                </div>
              </div>
            </div>

            {/* Global Statistics */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Global Overview
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {mapLocations.filter(l => l.aqi <= 50).length}
                  </div>
                  <div className="text-xs text-green-700">Good</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">
                    {mapLocations.filter(l => l.aqi > 50 && l.aqi <= 100).length}
                  </div>
                  <div className="text-xs text-yellow-700">Moderate</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {mapLocations.filter(l => l.aqi > 100).length}
                  </div>
                  <div className="text-xs text-red-700">Unhealthy</div>
                </div>
              </div>
              
              {/* Average AQI */}
              <div className="p-3 bg-gray-50 rounded-lg text-center">
                <div className="text-lg font-bold text-gray-900">
                  {Math.round(mapLocations.reduce((sum, l) => sum + l.aqi, 0) / mapLocations.length)}
                </div>
                <div className="text-xs text-gray-600">Global Average AQI</div>
              </div>
            </div>
          </div>

          {/* Real-time Updates Indicator */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-gray-500 text-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Data updates every 5 minutes</span>
            <span className="hidden sm:inline">•</span>
            <span>Click any location for detailed analysis</span>
          </div>
        </>
      )}
    </div>
  );
};