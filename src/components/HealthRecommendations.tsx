import React from 'react';
import { AQIData } from '../types';
import { getAQILevel } from '../utils/aqiUtils';
import { Heart, Activity, Shield, AlertCircle } from 'lucide-react';

interface HealthRecommendationsProps {
  data: AQIData | null;
}

export const HealthRecommendations: React.FC<HealthRecommendationsProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Select a location to see health recommendations</p>
        </div>
      </div>
    );
  }

  const aqiLevel = getAQILevel(data.aqi);

  const getRecommendationIcon = (aqi: number) => {
    if (aqi <= 50) return <Heart className="h-5 w-5 text-green-500" />;
    if (aqi <= 100) return <Activity className="h-5 w-5 text-yellow-500" />;
    if (aqi <= 150) return <Shield className="h-5 w-5 text-orange-500" />;
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        {getRecommendationIcon(data.aqi)}
        <h3 className="text-xl font-semibold text-gray-900">Health Recommendations</h3>
      </div>

      <div className={`p-4 rounded-xl mb-6 ${aqiLevel.color} bg-opacity-10 border border-current border-opacity-20`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{aqiLevel.emoji}</span>
          <div>
            <h4 className="font-semibold text-gray-900">{aqiLevel.level}</h4>
            <p className="text-sm text-gray-600">{aqiLevel.message}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 mb-3">Recommended Actions:</h4>
        {aqiLevel.activities.map((activity, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-sm text-gray-700 leading-relaxed">{activity}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">Health Tip</span>
        </div>
        <p className="text-sm text-blue-800">
          {data.aqi > 100 
            ? "Consider using an air purifier indoors and wearing a mask outdoors."
            : "Great air quality! Perfect time for outdoor activities and exercise."
          }
        </p>
      </div>
    </div>
  );
};