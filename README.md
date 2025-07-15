# 🌍 Air Quality Forecast Web App 

A modern, real-time air quality visualization and forecasting web application, designed to deliver live AQI (Air Quality Index) data from multiple reliable sources. Built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**, featuring multiple API integrations for comprehensive global coverage.

---

## 🎯 Project Objective

This app provides comprehensive air quality monitoring by integrating multiple data sources to ensure reliable, real-time information:
- 🔬 **Granular, location-specific AQI data**
- 🔮 **Intelligent forecasting based on historical patterns**
- 🛡️ **Health alerts and protective recommendations**
- 🌐 **User-friendly and accessible interface for everyone**
- 📡 **Multiple API sources for maximum reliability**

---

## 🚀 Features

### ✅ Real-time AQI Monitoring
- Live data from World Air Quality Index (WAQI), OpenWeatherMap, and IQAir APIs
- Automatic fallback between data sources for maximum reliability
- Real-time updates every 5 minutes

### 🔮 Intelligent Air Quality Forecast
- 48-hour detailed forecasting with hourly breakdowns
- Historical pattern analysis for improved accuracy
- Location-specific factors and seasonal adjustments

### 📍 Geolocation & Search
- Auto-detects user's location using GPS
- Global city search with real-time geocoding
- Support for coordinates-based location lookup

### 🎨 Color-Coded AQI Indicator
- Standard AQI color coding (Good to Hazardous)
- Interactive visual indicators and progress bars
- Animated status indicators for real-time feedback

### 📊 Data Visualizations
- Interactive forecast charts with hover details
- 24-hour and 7-day trend analysis
- Global air quality map with live data points

### 🧘‍♀️ Health Advice & Actions
- Personalized health recommendations based on current AQI
- Activity suggestions and protective measures
- Vulnerable group alerts and emergency notifications

### 🔧 API Integration
- **Primary**: World Air Quality Index (WAQI) - Global coverage
- **Secondary**: OpenWeatherMap - Air pollution + weather data
- **Tertiary**: IQAir - Premium air quality data
- Automatic failover and data source health monitoring

---
## Host: https://aqi-forecast-visualizer.vercel.app/

## 🛠️ Setup Instructions

### 1. Clone and Install
```bash
git clone <repository-url>
cd air-quality-app
npm install
```

### 2. Get API Keys (Optional but Recommended)

For real-time data, obtain free API keys from:

#### World Air Quality Index (Primary - Recommended)
1. Visit [aqicn.org/api/](https://aqicn.org/api/)
2. Request API token
3. Add to `.env`: `VITE_WAQI_API_KEY=your_key_here`

#### OpenWeatherMap (Secondary)
1. Create account at [openweathermap.org](https://openweathermap.org/api)
2. Generate API key
3. Add to `.env`: `VITE_OPENWEATHER_API_KEY=your_key_here`

#### IQAir (Optional)
1. Visit [iqair.com/air-pollution-data-api](https://www.iqair.com/air-pollution-data-api)
2. Contact for API access
3. Add to `.env`: `VITE_IQAIR_API_KEY=your_key_here`

### 3. Environment Setup
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your API keys
# The app works without keys using realistic mock data
```

### 4. Run Development Server
```bash
npm run dev
```

---

## 🌐 API Sources & Data Quality

### Data Source Priority
1. **WAQI** (Primary) - Comprehensive global coverage
2. **OpenWeatherMap** (Secondary) - Reliable with weather integration  
3. **IQAir** (Tertiary) - Premium data quality
4. **Mock Data** (Fallback) - Realistic simulation for demo

### Data Refresh Strategy
- Real-time updates every 5 minutes
- Intelligent caching to reduce API calls
- Automatic retry with exponential backoff
- Health monitoring for all data sources

---

## 🎨 Features Overview

### Real-Time Dashboard
- Live AQI readings with pollutant breakdown
- Health recommendations based on current conditions
- Interactive global map with data points
- Responsive design for all devices

### Advanced Forecasting
- 48-hour detailed predictions
- Historical pattern analysis
- Location-specific adjustments
- Weather pattern integration

### User Experience
- Intuitive search and location detection
- Offline capability with cached data
- Multi-language support framework
- Accessibility-focused design

---

## 🔧 Technical Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Axios** for API communication

### API Integration
- Multiple data source support
- Automatic failover mechanisms
- Response caching and optimization
- Rate limiting and error handling

### Performance Features
- Lazy loading and code splitting
- Optimized animations and transitions
- Efficient state management
- Progressive Web App capabilities

---

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- World Air Quality Index for comprehensive global data
- OpenWeatherMap for weather and pollution APIs
- IQAir for premium air quality information
- All contributors and the open-source community
