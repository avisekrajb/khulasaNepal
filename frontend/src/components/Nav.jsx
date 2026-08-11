import React, { useState, useEffect, useCallback, useRef } from 'react';
import fallbackLogo from '../assets/image/logotop.png';
import { NavbarAd } from '../components/ads/AdComponents';
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Logo caching
let cachedLogoUrl = null;
const LOGO_CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const LOGO_CACHE_KEY = 'khulasa_logo_cache';
const LOGO_CACHE_TIMESTAMP_KEY = 'khulasa_logo_timestamp';

// Weather caching
let cachedWeatherData = null;
let weatherFetchPromise = null;
const WEATHER_CACHE_DURATION = 1000 * 60 * 15; // 15 minutes
let weatherCacheTimestamp = null;
const WEATHER_CACHE_KEY = 'khulasa_weather_cache';
const WEATHER_CACHE_TIMESTAMP_KEY = 'khulasa_weather_timestamp';

// Load logo cache
try {
  const stored = localStorage.getItem(LOGO_CACHE_KEY);
  const timestamp = localStorage.getItem(LOGO_CACHE_TIMESTAMP_KEY);
  if (stored && timestamp) {
    const age = Date.now() - parseInt(timestamp, 10);
    if (age < LOGO_CACHE_DURATION) {
      cachedLogoUrl = stored;
    } else {
      localStorage.removeItem(LOGO_CACHE_KEY);
      localStorage.removeItem(LOGO_CACHE_TIMESTAMP_KEY);
    }
  }
} catch (err) {
  console.warn('Logo cache load failed:', err);
}

// Load weather cache
try {
  const stored = localStorage.getItem(WEATHER_CACHE_KEY);
  const timestamp = localStorage.getItem(WEATHER_CACHE_TIMESTAMP_KEY);
  if (stored && timestamp) {
    const age = Date.now() - parseInt(timestamp, 10);
    if (age < WEATHER_CACHE_DURATION) {
      cachedWeatherData = JSON.parse(stored);
      weatherCacheTimestamp = parseInt(timestamp, 10);
      console.log('✅ Weather cache loaded:', cachedWeatherData);
    } else {
      localStorage.removeItem(WEATHER_CACHE_KEY);
      localStorage.removeItem(WEATHER_CACHE_TIMESTAMP_KEY);
      console.log('⏰ Weather cache expired, removed');
    }
  }
} catch (err) {
  console.warn('Weather cache load failed:', err);
}

if (!cachedLogoUrl) cachedLogoUrl = fallbackLogo;

function Nav() {
  const { isDark } = useTheme();
  
  // Time offset from server (calculated once)
  const [serverTimeOffset, setServerTimeOffset] = useState(0);
  const [dateTimeData, setDateTimeData] = useState({
    nepaliDate: '',
    nepaliTime: '',
    englishDateTime: '',
    loading: true
  });
  
  const [weatherData, setWeatherData] = useState(() => {
    if (cachedWeatherData) {
      return {
        kathmandu: { temp: cachedWeatherData.kathmandu.temp, loading: false },
        phidim: { temp: cachedWeatherData.phidim.temp, loading: false }
      };
    }
    return {
      kathmandu: { temp: '--', loading: true },
      phidim: { temp: '--', loading: true }
    };
  });
  
  const [logoUrl] = useState(cachedLogoUrl);
  const weatherTimeoutRef = useRef(null);
  const weatherIntervalRef = useRef(null);
  const clockIntervalRef = useRef(null);
  const isMountedRef = useRef(true);
  const adContainerRef = useRef(null);

  const toNepaliNumerals = useCallback((num) => {
    const nepali = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return String(num).split('').map(d => nepali[Number(d)] || d).join('');
  }, []);

  // Fetch server time and date info once on mount
  useEffect(() => {
    const fetchServerDateTime = async () => {
      try {
        const response = await fetch(`${API_URL}/api/datetime`);
        if (!response.ok) throw new Error('Failed to fetch server time');
        
        const data = await response.json();
        
        const serverTime = new Date(data.serverTimestamp);
        const clientTime = new Date();
        const offset = serverTime.getTime() - clientTime.getTime();
        
        setServerTimeOffset(offset);
        setDateTimeData({
          nepaliDate: data.nepaliDate,
          nepaliTime: data.nepaliTime,
          englishDateTime: data.englishDateTime,
          loading: false
        });
      } catch (err) {
        console.error('Error fetching server time:', err);
        setDateTimeData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchServerDateTime();
  }, []);

  // Update time display every second based on server offset
  useEffect(() => {
    if (dateTimeData.loading) return;

    const updateLocalTime = () => {
      const NPT_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;
      const utcNow = new Date(Date.now() + serverTimeOffset);
      const nptNow = new Date(utcNow.getTime() + NPT_OFFSET_MS);

      let h = nptNow.getUTCHours();
      const min = nptNow.getUTCMinutes().toString().padStart(2, '0');
      const period = h >= 12 ? 'अपराह्न' : 'पूर्वाह्न';
      h = h % 12 || 12;
      const nepaliTime = `${toNepaliNumerals(h)}:${toNepaliNumerals(min)} ${period}`;

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const m = months[nptNow.getUTCMonth()];
      const d = nptNow.getUTCDate();
      const day = days[nptNow.getUTCDay()];
      let eh = nptNow.getUTCHours();
      const emin = nptNow.getUTCMinutes().toString().padStart(2, '0');
      const ePeriod = eh >= 12 ? 'pm' : 'am';
      eh = eh % 12 || 12;
      const englishDateTime = `${m} ${d} ${day}, ${eh}.${emin} ${ePeriod}`;

      setDateTimeData(prev => ({ ...prev, nepaliTime, englishDateTime }));
    };

    updateLocalTime();
    clockIntervalRef.current = setInterval(updateLocalTime, 1000);

    return () => {
      if (clockIntervalRef.current) clearInterval(clockIntervalRef.current);
    };
  }, [serverTimeOffset, dateTimeData.loading, toNepaliNumerals]);

  // Weather logic with memory caching
  useEffect(() => {
    isMountedRef.current = true;

    const fetchWeather = async () => {
      if (cachedWeatherData && weatherCacheTimestamp) {
        const age = Date.now() - weatherCacheTimestamp;
        if (age < WEATHER_CACHE_DURATION) {
          console.log('✅ Using cached weather data (age:', Math.floor(age / 1000), 'seconds)');
          if (isMountedRef.current) {
            setWeatherData({
              kathmandu: { temp: cachedWeatherData.kathmandu.temp, loading: false },
              phidim: { temp: cachedWeatherData.phidim.temp, loading: false }
            });
          }
          return;
        }
      }

      if (weatherFetchPromise) {
        console.log('⏳ Weather fetch already in progress, waiting...');
        try {
          await weatherFetchPromise;
          return;
        } catch (err) {
          console.warn('Previous weather fetch failed:', err);
        }
      }

      if (weatherTimeoutRef.current) clearTimeout(weatherTimeoutRef.current);
      weatherTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setWeatherData(prev => ({
            ...prev,
            kathmandu: { ...prev.kathmandu, loading: false },
            phidim: { ...prev.phidim, loading: false }
          }));
        }
      }, 10000);

      weatherFetchPromise = (async () => {
        try {
          console.log('🌤️ Fetching fresh weather data...');
          const response = await fetch(`${API_URL}/api/weather`);
          
          if (!response.ok) {
            throw new Error(`Weather API returned ${response.status}`);
          }

          const data = await response.json();

          const newData = {
            kathmandu: { temp: data.kathmandu.temp, loading: false },
            phidim: { temp: data.phidim.temp, loading: false }
          };

          if (data.kathmandu.temp !== '--' || data.phidim.temp !== '--') {
            cachedWeatherData = newData;
            weatherCacheTimestamp = Date.now();
            
            try {
              localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(newData));
              localStorage.setItem(WEATHER_CACHE_TIMESTAMP_KEY, String(weatherCacheTimestamp));
              console.log('✅ Weather data cached successfully');
            } catch (e) {
              console.warn('Failed to cache weather to localStorage:', e);
            }
          }

          if (isMountedRef.current) {
            setWeatherData(newData);
          }

        } catch (err) {
          console.error('❌ Weather fetch error:', err);
          
          if (cachedWeatherData) {
            console.log('📦 Using fallback cached weather data');
            if (isMountedRef.current) {
              setWeatherData({
                kathmandu: { temp: cachedWeatherData.kathmandu.temp, loading: false },
                phidim: { temp: cachedWeatherData.phidim.temp, loading: false }
              });
            }
          } else {
            if (isMountedRef.current) {
              setWeatherData({
                kathmandu: { temp: '--', loading: false },
                phidim: { temp: '--', loading: false }
              });
            }
          }
        } finally {
          if (weatherTimeoutRef.current) clearTimeout(weatherTimeoutRef.current);
          weatherFetchPromise = null;
        }
      })();

      await weatherFetchPromise;
    };

    fetchWeather();
    weatherIntervalRef.current = setInterval(fetchWeather, WEATHER_CACHE_DURATION);

    return () => {
      isMountedRef.current = false;
      if (weatherTimeoutRef.current) clearTimeout(weatherTimeoutRef.current);
      if (weatherIntervalRef.current) clearInterval(weatherIntervalRef.current);
      weatherFetchPromise = null;
    };
  }, []);

  // Determine text color based on theme
  const textColor = isDark ? 'text-white' : 'text-[#123E8C]';
  const borderColor = isDark ? 'border-white/20' : 'border-[#123E8C]';
  const bgColor = isDark ? 'bg-slate-800' : 'bg-white';

  return (
    <div className={`${bgColor} border-b-2 ${borderColor} transition-colors duration-300 relative`}>
      {/* Top Border with Red, Blue, Green, Black Colors and Blur Effect - Only this changed */}
      <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-red-600 via-blue-500 via-green-500 via-black to-red-600 bg-[length:300%_100%] animate-color-flow blur-sm"></div>
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-600 via-blue-500 via-green-500 via-black to-red-600 bg-[length:300%_100%] animate-color-flow"></div>
      
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Horizontal Layout: Logo 25%, Date/Weather 20%, Ad 55% */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Left Section: Logo - 25% of navbar */}
          <div className="flex-shrink-0 w-full md:w-[25%] flex items-center">
            <div className="rounded-lg inline-block w-full">
              <div className={`relative flex items-center justify-center w-full h-[140px] overflow-hidden rounded-2xl ${isDark ? 'bg-slate-700' : 'bg-gradient-to-br from-gray-50 to-gray-100'} shadow-lg transition-colors duration-300`}>
                {/* Snake Border Animation - UNCHANGED */}
                <div className="absolute inset-0 rounded-2xl p-[3px] bg-gradient-to-r from-[#123E8C] via-[#E31B23] via-[#123E8C] to-[#E31B23] bg-[length:200%_200%] animate-border-flow">
                  <div className={`absolute inset-[3px] rounded-2xl ${isDark ? 'bg-slate-700' : 'bg-white'} transition-colors duration-300`}></div>
                </div>
                
                {/* Red Top Border - UNCHANGED */}
                <div className="absolute top-0 left-0 right-0 z-15 h-[4px] bg-gradient-to-r from-red-600 via-red-500 to-red-700 blur-sm rounded-t-2xl"></div>
                <div className="absolute top-0 left-0 right-0 z-15 h-[2px] bg-gradient-to-r from-red-500 via-red-400 to-red-600 rounded-t-2xl"></div>
                
                {/* Logo Image - UNCHANGED */}
                <img
                  src={logoUrl}
                  alt="Khulasa Nepal Logo"
                  className="relative z-10 w-full h-full object-contain object-center p-3 transition-opacity duration-900"
                  onError={e => {
                    if (e.target.src !== fallbackLogo) {
                      e.target.src = fallbackLogo;
                      cachedLogoUrl = fallbackLogo;
                      localStorage.setItem(LOGO_CACHE_KEY, fallbackLogo);
                    }
                  }}
                  loading="eager"
                  decoding="async"
                  style={{ opacity: 1 }}
                />

                {/* Text Overlay - UNCHANGED */}
                <div className={`absolute bottom-2 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-1 ${isDark ? 'bg-slate-800/90' : 'bg-white/90'} backdrop-blur-sm px-3 py-1 rounded-full shadow-md transition-colors duration-300`}>
                  <span className="text-base font-extrabold tracking-tight" style={{ color: '#123E8C' }}>
                    Khulasa
                  </span>
                  <span className="text-base font-extrabold tracking-tight" style={{ color: '#E31B23' }}>
                    Nepal
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Section: Date Time Weather - 20% of navbar - UNCHANGED */}
          <div className={`flex-shrink-0 w-full md:w-[20%] ${textColor} transition-colors duration-300 flex items-center`}>
            {dateTimeData.loading ? (
              <p className="text-base font-bold">Loading...</p>
            ) : (
              <div>
                <p className="text-sm font-bold">
                  {dateTimeData.nepaliDate}, {dateTimeData.nepaliTime}
                </p>
                <p className={`text-xs font-bold ${isDark ? 'text-white/80' : 'opacity-90'} transition-colors duration-300`}>
                  {dateTimeData.englishDateTime}
                </p>
                
                <div className={`text-xs font-bold ${isDark ? 'text-white/80' : 'opacity-90'} transition-colors duration-300`}>
                  <span>काठमाडौं: {weatherData.kathmandu.temp}°C</span>
                  <span className="ml-2">फिदिम: {weatherData.phidim.temp}°C</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Section: Navbar Ad - 55% of navbar - UNCHANGED */}
          <div className="flex-shrink-0 w-full md:w-[55%] flex items-center">
            <div
              className={`w-full flex items-center justify-center overflow-hidden ${
                isDark ? 'bg-slate-700/30' : 'bg-gray-50'
              } rounded-lg shadow-2xl shadow-black/20 transition-colors duration-300`}
            >
              <div
                ref={adContainerRef}
                className="w-full flex items-center justify-center p-1"
              >
                {/* NavbarAd with full display - no cropping - UNCHANGED */}
                <div className="w-full max-h-[140px] flex items-center justify-center">
                  <NavbarAd position="navbar-top" />
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Add custom CSS - Added color-flow animation */}
      <style jsx>{`
        @keyframes borderFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        /* New animation for multi-color top border */
        @keyframes colorFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .animate-border-flow {
          animation: borderFlow 3s ease-in-out infinite;
        }
        
        .animate-color-flow {
          animation: colorFlow 4s linear infinite;
        }
        
        /* Ensure ads display fully without cropping - UNCHANGED */
        .navbar-ad-container img,
        .navbar-ad-container .ad-image {
          max-height: 140px;
          width: 100%;
          height: auto;
          object-fit: contain !important;
        }
        
        /* Slider container - full width - UNCHANGED */
        .navbar-ad-container .slider-container {
          width: 100%;
          overflow: hidden;
        }
        
        /* Each slide takes full width - UNCHANGED */
        .navbar-ad-container .slide-item {
          min-width: 100%;
          flex-shrink: 0;
        }
        
        /* Transition for smooth sliding - UNCHANGED */
        .navbar-ad-container .slide-transition {
          transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}

export default Nav;