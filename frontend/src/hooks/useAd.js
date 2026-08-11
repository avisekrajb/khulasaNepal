// hooks/useAd.js - PRODUCTION-READY VERSION
import { useState, useEffect, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL;
/**
 * Enhanced hook for fetching and managing ads with context-aware targeting
 * @param {string} position - Ad position (e.g., 'sidebar-top', 'header')
 * @param {number} index - Index of ad to display (for multiple ads in same position)
 * @param {object} context - Context object with page and category information
 * @returns {object} Ad data, loading state, and click handler
 */
const useAd = (position, index = 0, context = {}) => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch ad based on position and context
const fetchAd = useCallback(async () => {
  if (!position) {
    setLoading(false);
    return;
  }

  try {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (context.page) params.append('page', context.page);
    if (context.category) params.append('category', context.category);

    const url = `${API_URL}/api/ads/position/${position}${params.toString() ? `?${params.toString()}` : ''}`;
    

    console.log('🔍 Fetching ad:', { position, url, context });
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // 🔍 ADD THIS DEBUG LOG
    console.log('📊 Ad response:', { position, data });

    if (data.success && data.ads && data.ads.length > 0) {
      const selectedAd = data.ads[index] || data.ads[0];
      setAd(selectedAd);
      await recordImpression(selectedAd.id);
    } else {
      console.log('⚠️ No ads found for:', { position, context });
      setAd(null);
    }
  } catch (err) {
    console.error('Error fetching ad:', err);
    setError(err.message);
    setAd(null);
  } finally {
    setLoading(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [position, index, context.page, context.category]);

  // Record impression
  const recordImpression = async (adId) => {
    try {
      await fetch(`${API_URL}/api/ads/${adId}/impression`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('Error recording impression:', err);
    }
  };

  // Handle ad click
  const handleClick = async (linkUrl, openInNewTab) => {
    if (!linkUrl || !ad) return;

    try {
      // Record click
      await fetch(`${API_URL}/api/ads/${ad.id}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      // Open link
      if (openInNewTab) {
        window.open(linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = linkUrl;
      }
    } catch (err) {
      console.error('Error recording ad click:', err);
      // Still open the link even if tracking fails
      if (openInNewTab) {
        window.open(linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = linkUrl;
      }
    }
  };

  // Fetch ad when dependencies change
  useEffect(() => {
    fetchAd();
  }, [fetchAd]);

  return {
    ad,
    loading,
    error,
    handleClick,
    refetch: fetchAd
  };
};

export default useAd;