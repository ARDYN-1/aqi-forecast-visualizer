import React from 'react';
import { AQIData } from '../types';
import { getAQILevel } from '../utils/aqiUtils';
import { Heart, Activity, Shield, AlertCircle, Users, Baby, Zap } from 'lucide-react';

interface HealthRecommendationsProps {
  data: AQIData | null;
}

export const HealthRecommendations: React.FC<HealthRecommendationsProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
        <div className="text-center text-gray-500 py-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium">Select a location</p>
          <p className="text-sm">Get personalized health recommendations</p>
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

  const getVulnerableGroups = (aqi: number) => {
    if (aqi <= 50) return [];
    if (aqi <= 100) return ['People with respiratory conditions', 'Heart disease patients'];
    if (aqi <= 150) return ['Children', 'Elderly', 'People with asthma', 'Heart disease patients'];
    return ['Everyone', 'Especially children and elderly', 'People with chronic conditions'];
  };

  const getProtectiveMeasures = (aqi: number) => {
    if (aqi <= 50) return [
      'Perfect time for outdoor activities',
      'Open windows for fresh air',
      'Great for morning exercise'
    ];
    if (aqi <= 100) return [
      'Limit prolonged outdoor activities',
      'Consider indoor exercise alternatives',
      'Monitor sensitive individuals'
    ];
    if (aqi <= 150) return [
      'Wear N95 masks when outdoors',
      'Keep windows closed',
      'Use air purifiers indoors',
      'Avoid outdoor exercise'
    ];
    return [
      'Stay indoors as much as possible',
      'Wear high-quality masks (N95/N99)',
      'Use air purifiers continuously',
      'Seek medical attention if symptoms occur'
    ];
  };

  const vulnerableGroups = getVulnerableGroups(data.aqi);
  const protectiveMeasures = getProtectiveMeasures(data.aqi);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        {getRecommendationIcon(data.aqi)}
        <h3 className="text-xl font-semibold text-gray-900">Health Guidance</h3>
      </div>

      {/* Current Status */}
      <div className={`p-4 rounded-xl mb-6 border-2 border-opacity-20`} style={{ 
        backgroundColor: `${aqiLevel.color.replace('bg-', '').replace('-500', '')}-50`,
        borderColor: `${aqiLevel.color.replace('bg-', '').replace('-500', '')}-200`
      }}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{aqiLevel.emoji}</span>
          <div>
            <h4 className="font-bold text-gray-900 text-lg">{aqiLevel.level}</h4>
            <p className="text-sm text-gray-600">{aqiLevel.message}</p>
          </div>
        </div>
        
        {/* Risk Level Indicator */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs font-medium text-gray-500">Risk Level:</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full ${aqiLevel.color}`}
              style={{ width: `${Math.min((data.aqi / 300) * 100, 100)}%` }}
            ></div>
          </div>
          <span className="text-xs font-medium text-gray-700">{Math.round((data.aqi / 300) * 100)}%</span>
        </div>
      </div>

      {/* Vulnerable Groups */}
      {vulnerableGroups.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-orange-500" />
            <h4 className="font-semibold text-gray-900">At-Risk Groups</h4>
          </div>
          <div className="space-y-2">
            {vulnerableGroups.map((group, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                <Baby className="h-4 w-4 text-orange-500 flex-shrink-0" />
                <span className="text-sm text-orange-800">{group}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Protective Measures */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-blue-500" />
          <h4 className="font-semibold text-gray-900">Recommended Actions</h4>
        </div>
        <div className="space-y-2">
          {protectiveMeasures.map((measure, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-blue-800 leading-relaxed">{measure}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Health Tips */}
      <div className="space-y-4">
        <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-green-900">Quick Tip</span>
          </div>
          <p className="text-sm text-green-800">
            {data.aqi > 100 
              ? "Indoor plants like spider plants and peace lilies can help improve indoor air quality naturally."
              : "Take advantage of this clean air! Consider outdoor activities like walking, cycling, or gardening."
            }
          </p>
        </div>

        {data.aqi > 150 && (
          <div className="p-3 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-semibold text-red-900">Health Alert</span>
            </div>
            <p className="text-sm text-red-800">
              Air quality is unhealthy. If you experience difficulty breathing, chest pain, or persistent cough, seek medical attention immediately.
            </p>
          </div>
        )}
      </div>

      {/* Emergency Contact */}
      {data.aqi > 200 && (
        <div className="mt-4 p-3 bg-red-100 rounded-xl border-2 border-red-300 animate-pulse">
          <div className="text-center">
            <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-red-900">Emergency Level Air Quality</p>
            <p className="text-xs text-red-700 mt-1">
              Contact emergency services if experiencing severe symptoms
            </p>
          </div>
        </div>
      )}
    </div>
  );
};