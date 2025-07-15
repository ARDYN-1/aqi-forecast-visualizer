import React, { useState, useEffect } from 'react';
import { AQIService } from '../services/aqiService';
import { Wifi, WifiOff, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export const APIStatus: React.FC = () => {
  const [apiHealth, setApiHealth] = useState<{ waqi: boolean; openweather: boolean; iqair: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    checkAPIs();
    const interval = setInterval(checkAPIs, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const checkAPIs = async () => {
    setLoading(true);
    try {
      const health = await AQIService.checkAPIHealth();
      setApiHealth(health);
      setLastCheck(new Date());
    } catch (error) {
      console.error('API health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-3 w-3 text-green-500" />
    ) : (
      <AlertCircle className="h-3 w-3 text-red-500" />
    );
  };

  const getOverallStatus = () => {
    if (!apiHealth) return { icon: <WifiOff className="h-4 w-4" />, text: 'Unknown', color: 'text-gray-500' };
    
    const activeAPIs = Object.values(apiHealth).filter(Boolean).length;
    if (activeAPIs === 0) {
      return { icon: <WifiOff className="h-4 w-4" />, text: 'Offline', color: 'text-red-500' };
    } else if (activeAPIs >= 2) {
      return { icon: <Wifi className="h-4 w-4" />, text: 'Excellent', color: 'text-green-500' };
    } else {
      return { icon: <Wifi className="h-4 w-4" />, text: 'Limited', color: 'text-yellow-500' };
    }
  };

  const status = getOverallStatus();

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {status.icon}
          <span className={`text-sm font-medium ${status.color}`}>
            Data Sources: {status.text}
          </span>
        </div>
        <button
          onClick={checkAPIs}
          disabled={loading}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {apiHealth && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              {getStatusIcon(apiHealth.waqi)}
              WAQI (Primary)
            </span>
            <span className={apiHealth.waqi ? 'text-green-600' : 'text-red-600'}>
              {apiHealth.waqi ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              {getStatusIcon(apiHealth.openweather)}
              OpenWeather
            </span>
            <span className={apiHealth.openweather ? 'text-green-600' : 'text-red-600'}>
              {apiHealth.openweather ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2">
              {getStatusIcon(apiHealth.iqair)}
              IQAir
            </span>
            <span className={apiHealth.iqair ? 'text-green-600' : 'text-red-600'}>
              {apiHealth.iqair ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
        <Clock className="h-3 w-3" />
        <span>Last check: {lastCheck.toLocaleTimeString()}</span>
      </div>
    </div>
  );
};