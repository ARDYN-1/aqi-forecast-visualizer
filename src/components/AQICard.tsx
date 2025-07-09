import React from 'react';
import { AQIData } from '../types';
import { getAQILevel, formatTimestamp } from '../utils/aqiUtils';
import { Wind, AlertTriangle, Thermometer, Activity, Eye, Droplets } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

interface AQICardProps {
  data: AQIData;
  loading: boolean;
}

export const AQICard: React.FC<AQICardProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
        <LoadingSpinner message="Loading air quality data..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="text-center text-gray-500 py-8">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No air quality data available</p>
          <p className="text-sm">Please select a location or check your connection</p>
        </div>
      </div>
    );
  }

  const aqiLevel = getAQILevel(data.aqi);

  const pollutants = [
    { name: 'O₃', value: data.o3, unit: 'μg/m³', icon: Eye, description: 'Ozone' },
    { name: 'NO₂', value: data.no2, unit: 'μg/m³', icon: Wind, description: 'Nitrogen Dioxide' },
    { name: 'SO₂', value: data.so2, unit: 'μg/m³', icon: Droplets, description: 'Sulfur Dioxide' },
    { name: 'CO', value: Math.round(data.co/1000), unit: 'mg/m³', icon: Activity, description: 'Carbon Monoxide' }
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{aqiLevel.emoji}</div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{data.location.city}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Wind className="h-3 w-3" />
              Updated {formatTimestamp(data.timestamp)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-green-700">Live</span>
        </div>
      </div>

      {/* Main AQI Display */}
      <div className="text-center mb-8">
        <div className="relative inline-block">
          <div className="text-6xl font-bold text-gray-900 mb-2">{data.aqi}</div>
          <div className="absolute -top-2 -right-8 text-sm text-gray-500">AQI</div>
        </div>
        <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium text-white ${aqiLevel.color} shadow-lg`}>
          {aqiLevel.level}
        </div>
        <p className="text-sm text-gray-600 mt-3 max-w-xs mx-auto leading-relaxed">
          {aqiLevel.message}
        </p>
      </div>

      {/* Primary Pollutants */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">PM</span>
            </div>
            <div>
              <div className="text-xs text-blue-600 font-medium">PM2.5</div>
              <div className="text-xs text-blue-500">Fine Particles</div>
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-900">{data.pm25}</div>
          <div className="text-xs text-blue-600">μg/m³</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">PM</span>
            </div>
            <div>
              <div className="text-xs text-purple-600 font-medium">PM10</div>
              <div className="text-xs text-purple-500">Coarse Particles</div>
            </div>
          </div>
          <div className="text-2xl font-bold text-purple-900">{data.pm10}</div>
          <div className="text-xs text-purple-600">μg/m³</div>
        </div>
      </div>

      {/* Other Pollutants */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {pollutants.map((pollutant, index) => {
          const Icon = pollutant.icon;
          return (
            <div key={index} className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors group">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                <div className="text-xs text-gray-500 font-medium">{pollutant.name}</div>
              </div>
              <div className="text-lg font-bold text-gray-900">{pollutant.value}</div>
              <div className="text-xs text-gray-500">{pollutant.unit}</div>
            </div>
          );
        })}
      </div>

      {/* Health Impact Indicator */}
      <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${aqiLevel.color}`}></div>
            <span className="text-sm font-medium text-gray-700">Health Impact</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">{aqiLevel.level}</div>
            <div className="text-xs text-gray-500">Current Status</div>
          </div>
        </div>
      </div>
    </div>
  );
};