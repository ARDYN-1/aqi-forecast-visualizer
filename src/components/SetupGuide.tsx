import React, { useState } from 'react';
import { Key, ExternalLink, Copy, CheckCircle, AlertCircle, Info } from 'lucide-react';

export const SetupGuide: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const apiSources = [
    {
      name: 'World Air Quality Index (WAQI)',
      key: 'VITE_WAQI_API_KEY',
      url: 'https://aqicn.org/api/',
      description: 'Primary source for global air quality data',
      priority: 'High',
      free: true,
      steps: [
        'Visit aqicn.org/api/',
        'Click "Request API Token"',
        'Fill out the form with your details',
        'Copy the API token from your email'
      ]
    },
    {
      name: 'OpenWeatherMap',
      key: 'VITE_OPENWEATHER_API_KEY',
      url: 'https://openweathermap.org/api',
      description: 'Air pollution data and geocoding services',
      priority: 'Medium',
      free: true,
      steps: [
        'Create account at openweathermap.org',
        'Go to API keys section',
        'Generate a new API key',
        'Wait for activation (can take up to 2 hours)'
      ]
    },
    {
      name: 'IQAir',
      key: 'VITE_IQAIR_API_KEY',
      url: 'https://www.iqair.com/air-pollution-data-api',
      description: 'High-quality air quality data',
      priority: 'Low',
      free: false,
      steps: [
        'Visit iqair.com/air-pollution-data-api',
        'Contact sales for API access',
        'Choose appropriate plan',
        'Receive API key after setup'
      ]
    }
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Key className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">API Setup Guide</h2>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Get Real-Time Data</h3>
            <p className="text-sm text-blue-800 leading-relaxed">
              To access live air quality data, you'll need API keys from the services below. 
              The app will automatically use the best available data source and fall back to others if needed.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {apiSources.map((api, index) => (
          <div key={index} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{api.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    api.priority === 'High' ? 'bg-red-100 text-red-700' :
                    api.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {api.priority} Priority
                  </span>
                  {api.free && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Free
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{api.description}</p>
              </div>
              <a
                href={api.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Get API Key
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Setup Steps:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                {api.steps.map((step, stepIndex) => (
                  <li key={stepIndex}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Environment Variable:</span>
                <button
                  onClick={() => copyToClipboard(api.key, api.key)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {copiedKey === api.key ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <code className="text-sm font-mono text-gray-800 bg-white px-2 py-1 rounded border">
                {api.key}=your_api_key_here
              </code>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-900 mb-2">Environment Setup</h3>
            <div className="text-sm text-yellow-800 space-y-2">
              <p>1. Create a <code className="bg-yellow-100 px-1 rounded">.env</code> file in your project root</p>
              <p>2. Add your API keys using the variable names shown above</p>
              <p>3. Restart your development server after adding keys</p>
              <p>4. The app will automatically detect and use available APIs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have API keys? The app will work with realistic mock data for demonstration purposes.
        </p>
      </div>
    </div>
  );
};