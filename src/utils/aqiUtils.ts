import { HealthRecommendation } from '../types';

export const getAQILevel = (aqi: number): HealthRecommendation => {
  if (aqi <= 50) {
    return {
      level: 'Good',
      color: 'bg-green-500',
      emoji: '😊',
      message: 'Air quality is considered satisfactory',
      activities: ['Perfect for outdoor activities', 'Great for morning jogs', 'Safe for children to play outside']
    };
  } else if (aqi <= 100) {
    return {
      level: 'Moderate',
      color: 'bg-yellow-500',
      emoji: '😐',
      message: 'Air quality is acceptable for most people',
      activities: ['Outdoor activities OK for most', 'Consider reducing prolonged outdoor exposure', 'Sensitive individuals should limit time outside']
    };
  } else if (aqi <= 150) {
    return {
      level: 'Unhealthy for Sensitive Groups',
      color: 'bg-orange-500',
      emoji: '😷',
      message: 'Sensitive groups may experience health effects',
      activities: ['Limit outdoor activities', 'Wear masks if going outside', 'Keep windows closed']
    };
  } else if (aqi <= 200) {
    return {
      level: 'Unhealthy',
      color: 'bg-red-500',
      emoji: '😨',
      message: 'Everyone may experience health effects',
      activities: ['Avoid outdoor activities', 'Stay indoors', 'Use air purifiers if available']
    };
  } else if (aqi <= 300) {
    return {
      level: 'Very Unhealthy',
      color: 'bg-purple-600',
      emoji: '😱',
      message: 'Health alert: everyone may experience serious health effects',
      activities: ['Emergency measures needed', 'Avoid all outdoor activities', 'Seek medical attention if symptoms occur']
    };
  } else {
    return {
      level: 'Hazardous',
      color: 'bg-red-800',
      emoji: '☠️',
      message: 'Health warning of emergency conditions',
      activities: ['Emergency situation', 'Everyone should avoid outdoor activities', 'Consider evacuation if possible']
    };
  }
};

export const getAQIColor = (aqi: number): string => {
  const level = getAQILevel(aqi);
  return level.color;
};

export const formatTimestamp = (timestamp: string): string => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const formatDate = (timestamp: string): string => {
  return new Date(timestamp).toLocaleDateString([], { 
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};