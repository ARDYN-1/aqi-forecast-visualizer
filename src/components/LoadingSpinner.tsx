import React from 'react';
import { Wind, Zap } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Animated Logo */}
      <div className="relative mb-4">
        <div className="absolute inset-0">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full opacity-20 animate-ping"></div>
        </div>
        <div className="relative w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-lg">
          <Wind className="w-8 h-8 text-white animate-spin" />
        </div>
      </div>

      {/* Spinning Elements */}
      <div className="relative mb-4">
        <div className="flex justify-center space-x-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-green-500 rounded-full`}
              style={{ animationDelay: `${i * 0.2}s` }}
            ></div>
          ))}
        </div>
      </div>

      {/* Loading Text */}
      <div className="text-center">
        <p className="text-gray-700 font-medium mb-2">{message}</p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Zap className="w-4 h-4 animate-pulse" />
          <span>Fetching real-time data...</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-48 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-pulse" style={{ width: '60%' }}></div>
      </div>
    </div>
  );
};