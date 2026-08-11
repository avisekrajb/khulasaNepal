// utils/useCache.js
import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for caching API responses with timestamp-based invalidation
 * @param {string} key - Unique cache key
 * @param {Function} fetchFn - Function that fetches data (should return a Promise)
 * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
 */
export const useCache = (key, fetchFn, ttl = 5 * 60 * 1000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get cache key with prefix
  const getCacheKey = (k) => `news_cache_${k}`;

  // Check if cache is valid
  const isCacheValid = useCallback((cacheData) => {
    if (!cacheData || !cacheData.timestamp) return false;
    const now = Date.now();
    return (now - cacheData.timestamp) < ttl;
  }, [ttl]);

  // Get data from cache
  const getFromCache = useCallback(() => {
    try {
      const cached = sessionStorage.getItem(getCacheKey(key));
      if (cached) {
        const parsed = JSON.parse(cached);
        if (isCacheValid(parsed)) {
          console.log(`✅ Cache HIT for ${key}`);
          return parsed.data;
        } else {
          console.log(`🗑️ Cache EXPIRED for ${key}`);
          sessionStorage.removeItem(getCacheKey(key));
        }
      }
    } catch (err) {
      console.error(`❌ Cache read error for ${key}:`, err);
    }
    return null;
  }, [key, isCacheValid]);

  // Save data to cache
  const saveToCache = useCallback((data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      sessionStorage.setItem(getCacheKey(key), JSON.stringify(cacheData));
      console.log(`💾 Cached data for ${key}`);
    } catch (err) {
      console.error(`❌ Cache write error for ${key}:`, err);
    }
  }, [key]);

  // Fetch data with caching
  const fetchData = useCallback(async (force = false) => {
    try {
      // Check cache first (unless forced)
      if (!force) {
        const cachedData = getFromCache();
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return cachedData;
        }
      }

      // Fetch fresh data
      setLoading(true);
      setError(null);
      console.log(`🔄 Fetching fresh data for ${key}`);
      
      const freshData = await fetchFn();
      
      // Save to cache
      saveToCache(freshData);
      setData(freshData);
      
      return freshData;
    } catch (err) {
      console.error(`❌ Fetch error for ${key}:`, err);
      setError(err.message || 'Failed to fetch data');
      
      // Try to use stale cache on error
      const staleCache = getFromCache();
      if (staleCache) {
        console.log(`⚠️ Using stale cache for ${key} due to error`);
        setData(staleCache);
      }
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, getFromCache, saveToCache]);

  // Initialize on mount
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]); // Only re-run if key changes

  // Refresh function
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Clear cache function
  const clearCache = useCallback(() => {
    sessionStorage.removeItem(getCacheKey(key));
    console.log(`🗑️ Cache cleared for ${key}`);
  }, [key]);

  return {
    data,
    loading,
    error,
    refresh,
    clearCache
  };
};

// Optional: Clear all news caches
export const clearAllNewsCache = () => {
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith('news_cache_')) {
      sessionStorage.removeItem(key);
    }
  });
  console.log('🗑️ All news cache cleared');
};

// Example usage in your components:
/*
// In Local.jsx
import { useCache } from '../utils/useCache';

function Local() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Use cache hook instead of manual fetch
  const { data: localNews, loading, error, refresh } = useCache(
    'local-news', // unique key
    async () => {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      const articles = data.success && Array.isArray(data.data) 
        ? data.data 
        : Array.isArray(data) ? data : [];
      return articles.sort((a, b) => 
        new Date(b.publishedDate) - new Date(a.publishedDate)
      );
    },
    5 * 60 * 1000 // 5 minutes cache
  );

  // Rest of your component logic...
  // Use localNews instead of the state variable
}

// In News.jsx
const { data: newsList, loading, error } = useCache(
  'news-list',
  async () => {
    const response = await axiosInstance.get('/api/news/category/news');
    return response.data.success && Array.isArray(response.data.data) 
      ? response.data.data 
      : [];
  },
  5 * 60 * 1000
);

// In More.jsx
const { data: articles, loading, error } = useCache(
  'more-articles',
  async () => {
    const response = await axiosInstance.get('/api/news/category/more');
    const articles = response.data.success && Array.isArray(response.data.data) 
      ? response.data.data 
      : Array.isArray(response.data) ? response.data : [];
    return articles.sort((a, b) => 
      new Date(b.publishedDate) - new Date(a.publishedDate)
    );
  },
  5 * 60 * 1000
);

// In Sports.jsx
const { data: sportsList, loading, error, refresh } = useCache(
  'sports-list',
  async () => {
    const response = await fetch(`${API_URL}/api/news/category/sports`);
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    return data.success && Array.isArray(data.data) 
      ? data.data 
      : Array.isArray(data) ? data : [];
  },
  5 * 60 * 1000
);
*/