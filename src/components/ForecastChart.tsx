import React from 'react';
import { ForecastData } from '../types';
import { formatTimestamp, getAQIColor, getAQILevel } from '../utils/aqiUtils';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

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
          <div className="h-40 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-6 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!forecast.length) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="text-center text-gray-500 py-8">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">No forecast data available</p>
          <p className="text-sm">Check your connection and try again</p>
        </div>
      </div>
    );
  }

  const next24Hours = forecast.slice(0, 24);
  const next7Days = forecast.filter((_, index) => index % 24 === 0).slice(0, 7);
  const maxAqi = Math.max(...next24Hours.map(f => f.aqi));
  const minAqi = Math.min(...next24Hours.map(f => f.aqi));
  const currentAqi = next24Hours[0]?.aqi || 0;
  const futureAqi = next24Hours[12]?.aqi || 0;

  const getTrendIcon = () => {
    const diff = futureAqi - currentAqi;
    if (diff > 15) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (diff < -15) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendText = () => {
    const diff = futureAqi - currentAqi;
    if (diff > 15) return { text: "Worsening", color: "text-red-600" };
    if (diff < -15) return { text: "Improving", color: "text-green-600" };
    return { text: "Stable", color: "text-gray-600" };
  };

  const trend = getTrendText();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-900">Air Quality Forecast</h3>
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          <span className={`text-sm font-medium ${trend.color}`}>{trend.text}</span>
        </div>
      </div>

      {/* 24-Hour Chart */}
      <div className="mb-8">
        <h4 className="text-sm font-medium text-gray-700 mb-4">Next 24 Hours</h4>
        <div className="relative h-40 mb-4">
          <div className="absolute inset-0 flex items-end justify-between gap-1">
            {next24Hours.map((item, index) => {
              const height = ((item.aqi - minAqi) / (maxAqi - minAqi)) * 100;
              const level = getAQILevel(item.aqi);
              
              return (
                <div key={index} className="flex flex-col items-center flex-1 group">
                  <div className="relative">
                    <div 
                      className={`w-full min-w-[8px] rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer ${getAQIColor(item.aqi)}`}
                      style={{ height: `${Math.max(height * 1.4, 20)}px` }}
                      title={`${formatTimestamp(item.timestamp)}: AQI ${item.aqi} (${level.level})`}
                    ></div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap">
                        <div className="font-medium">{item.aqi} AQI</div>
                        <div className="text-gray-300">{formatTimestamp(item.timestamp)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time labels */}
        <div className="grid grid-cols-6 gap-2 text-center">
          {next24Hours.filter((_, index) => index % 4 === 0).map((item, index) => (
            <div key={index} className="text-xs text-gray-500">
              {formatTimestamp(item.timestamp)}
            </div>
          ))}
        </div>
      </div>

      {/* 7-Day Forecast */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-4">7-Day Outlook</h4>
        <div className="space-y-2">
          {next7Days.map((item, index) => {
            const level = getAQILevel(item.aqi);
            const date = new Date(item.timestamp);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            return (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-900 w-12">{dayName}</div>
                  <div className={`w-4 h-4 rounded-full ${getAQIColor(item.aqi)}`}></div>
                  <div className="text-sm text-gray-600">{level.level}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-500">PM2.5: {item.pm25}μg/m³</div>
                  <div className="text-lg font-bold text-gray-900">{item.aqi}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">24h Average</div>
          <div className="text-lg font-semibold text-gray-900">
            {Math.round(next24Hours.reduce((sum, item) => sum + item.aqi, 0) / next24Hours.length)}
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">24h Peak</div>
          <div className="text-lg font-semibold text-gray-900">{maxAqi}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className="text-xs text-gray-500 mb-1">24h Low</div>
          <div className="text-lg font-semibold text-gray-900">{minAqi}</div>
        </div>
      </div>
    </div>
  );
};