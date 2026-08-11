// Main.jsx 
import React, { useState, useEffect } from 'react';
import NewsHome from './NewsHome';
import MoreHome from './MoreHome';
import SocietyHome from './SocietyHome';
import LocalHome from './LocalHome';
import SportsHome from './SportsHome';
import MainHome from './MainHome';
import axiosInstance from '../api/axios';

const CACHE_KEY = 'homepage_news_cache';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

function Main() {
  // Initialize state with cached data if available
  const [sections, setSections] = useState(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid
        if (now - timestamp < CACHE_DURATION) {
          console.log('✅ Loaded from sessionStorage cache');
          return data;
        } else {
          // Cache expired, remove it
          sessionStorage.removeItem(CACHE_KEY);
          console.log('🗑️ Cache expired, removed');
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error);
      sessionStorage.removeItem(CACHE_KEY);
    }
    return null;
  });

  const [loading, setLoading] = useState(!sections);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If we already have data from cache, no need to fetch
    if (sections) {
      setLoading(false);
      return;
    }

    const fetchHomepage = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Fetching fresh data from API');
        const response = await axiosInstance.get('api/news/homepage');
        
        // Save to sessionStorage
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            data: response.data,
            timestamp: Date.now()
          }));
          console.log('💾 Data cached to sessionStorage');
        } catch (storageError) {
          console.warn('Failed to cache data:', storageError);
          // Continue even if caching fails
        }
        
        setSections(response.data);
      } catch (err) {
        console.error('Error fetching homepage:', err);
        setError('Failed to load news. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHomepage();
  }, [sections]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading news...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-white px-4">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
            <svg 
              className="w-12 h-12 text-red-500 mx-auto mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <p className="text-red-700 font-medium mb-2">Oops! Something went wrong</p>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-2">
      <MainHome news={sections?.main || []} />
      <NewsHome news={sections?.news || []} />
      <SocietyHome news={sections?.society || []} />
      <LocalHome news={sections?.local || []} />
      <SportsHome news={sections?.sports || []} />
      <MoreHome news={sections?.more || []} />
    </div>
  );
}

export default Main;