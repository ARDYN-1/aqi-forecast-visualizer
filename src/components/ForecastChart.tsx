import React from 'react';
import { ForecastData } from '../types';
import { formatTimestamp, getAQIColor } from '../utils/aqiUtils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ForecastChartProps {
  forecast: ForecastData[];
  loading: boolean;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ forecast, loading }) => {
  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="flex space-x-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex-1 h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!forecast.length) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <TrendingUp className="h-8 w-8 mx-auto mb-2" />
          <p>No forecast data available</p>
        </div>
      </div>
    );
  }

  const next24Hours = forecast.slice(0, 24);
  const maxAqi = Math.max(...next24Hours.map(f => f.aqi));
  const minAqi = Math.min(...next24Hours.map(f => f.aqi));
  const currentAqi = next24Hours[0]?.aqi || 0;
  const futureAqi = next24Hours[12]?.aqi || 0;

  const getTrendIcon = () => {
    if (futureAqi > currentAqi + 10) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (futureAqi < currentAqi - 10) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendText = () => {
    if (futureAqi > currentAqi + 10) return "Worsening";
    if (futureAqi < currentAqi - 10) return "Improving";
    return "Stable";
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">24-Hour Forecast</h3>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className="text-sm text-gray-600">{getTrendText()}</span>
        </div>
      </div>

      <div className="relative h-32 mb-6">
        <div className="absolute inset-0 flex items-end justify-between">
          {next24Hours.slice(0, 12).map((item, index) => {
            const height = ((item.aqi - minAqi) / (maxAqi - minAqi)) * 100;
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div 
                  className={`w-4 rounded-t transition-all duration-300 hover:opacity-80 ${getAQIColor(item.aqi)}`}
                  style={{ height: `${Math.max(height, 10)}%` }}
                  title={`AQI: ${item.aqi} at ${formatTimestamp(item.timestamp)}`}
                ></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2 mb-4">
        {next24Hours.slice(0, 6).map((item, index) => (
          <div key={index} className="text-center">
            <div className="text-xs text-gray-500 mb-1">
              {formatTimestamp(item.timestamp)}
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {item.aqi}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-1">Average AQI</div>
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(next24Hours.reduce((sum, item) => sum + item.aqi, 0) / next24Hours.length)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-xs text-gray-500 mb-1">Peak AQI</div>
          <div className="text-lg font-semibold text-gray-900">{maxAqi}</div>
        </div>
      </div>
    </div>
  );
};