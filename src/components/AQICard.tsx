import React from 'react';
import { AQIData } from '../types';
import { getAQILevel, formatTimestamp } from '../utils/aqiUtils';
import { Wind, AlertTriangle, Thermometer } from 'lucide-react';

interface AQICardProps {
  data: AQIData;
  loading: boolean;
}

export const AQICard: React.FC<AQICardProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded-xl"></div>
          <div className="h-16 bg-gray-200 rounded-xl"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>No air quality data available</p>
        </div>
      </div>
    );
  }

  const aqiLevel = getAQILevel(data.aqi);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{aqiLevel.emoji}</div>
          <div>
            <h3 className="font-semibold text-gray-900">{data.location.city}</h3>
            <p className="text-sm text-gray-500">
              Updated {formatTimestamp(data.timestamp)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">Live</span>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-gray-900 mb-2">{data.aqi}</div>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${aqiLevel.color}`}>
          {aqiLevel.level}
        </div>
        <p className="text-sm text-gray-600 mt-2">{aqiLevel.message}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-1">PM2.5</div>
          <div className="text-lg font-semibold text-gray-900">{data.pm25}</div>
          <div className="text-xs text-gray-500">μg/m³</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-1">PM10</div>
          <div className="text-lg font-semibold text-gray-900">{data.pm10}</div>
          <div className="text-xs text-gray-500">μg/m³</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-500">O₃</div>
          <div className="text-sm font-medium text-gray-900">{data.o3}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-500">NO₂</div>
          <div className="text-sm font-medium text-gray-900">{data.no2}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-500">SO₂</div>
          <div className="text-sm font-medium text-gray-900">{data.so2}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-xs text-gray-500">CO</div>
          <div className="text-sm font-medium text-gray-900">{Math.round(data.co/1000)}K</div>
        </div>
      </div>
    </div>
  );
};