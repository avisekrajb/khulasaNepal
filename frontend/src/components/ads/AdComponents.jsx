// components/ads/AdComponents.jsx - COMPLETE - ONE AD AT A TIME WITH SLIDING (FIXED)
import React, { useState, useEffect, useRef } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

// ============================================
// HELPER: Normalize URL for opening in new tab
// ============================================
const normalizeUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('www.')) {
    return `https://${url}`;
  }
  return `https://${url}`;
};

// ============================================
// HOOK: Get all ads for a specific position
// ============================================
const usePositionAds = (position, context = {}) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (context.page) params.append('page', context.page);
        if (context.category) params.append('category', context.category);

        const url = `${API_URL}/api/ads/position/${position}${params.toString() ? `?${params.toString()}` : ''}`;
        console.log(`📢 Fetching ads for position: ${position}`, url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.ads && data.ads.length > 0) {
          console.log(`✅ Found ${data.ads.length} ads for position: ${position}`);
          setAds(data.ads);
        } else {
          console.log(`ℹ️ No ads found for position: ${position}`);
          setAds([]);
        }
      } catch (err) {
        console.error(`❌ Error fetching ads for ${position}:`, err);
        setError(err.message);
        setAds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, [position, context.page, context.category]);

  // Record impression for each ad
  useEffect(() => {
    if (ads.length > 0) {
      ads.forEach(ad => {
        fetch(`${API_URL}/api/ads/${ad.id}/impression`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(err => console.error('Error recording impression:', err));
      });
    }
  }, [ads]);

  const handleClick = async (ad, linkUrl, openInNewTab) => {
    if (!linkUrl || !ad) return;

    const normalizedUrl = normalizeUrl(linkUrl);

    try {
      await fetch(`${API_URL}/api/ads/${ad.id}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (openInNewTab) {
        window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = normalizedUrl;
      }
    } catch (err) {
      console.error('Error recording ad click:', err);
      if (openInNewTab) {
        window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = normalizedUrl;
      }
    }
  };

  return { ads, loading, error, handleClick };
};

// ============================================
// SLIDER COMPONENT - ONE AD AT A TIME (NO DOTS)
// ============================================
const AdSlider = ({ ads, renderAd, autoSlideInterval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoSlideRef = useRef(null);

  // Auto slide every 5 seconds
  useEffect(() => {
    if (ads.length <= 1) return;

    const startAutoSlide = () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
      autoSlideRef.current = setInterval(() => {
        if (!isPaused && !isTransitioning) {
          setCurrentIndex((prev) => (prev + 1) % ads.length);
        }
      }, autoSlideInterval);
    };

    startAutoSlide();

    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    };
  }, [ads.length, autoSlideInterval, isPaused, isTransitioning]);

  // Touch handlers
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setIsDragging(true);
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      setIsTransitioning(true);
      if (diff > 0) {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      } else {
        setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
      }
      setTimeout(() => setIsTransitioning(false), 700);
    }

    setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  };

  // Mouse drag handlers
  const handleMouseDown = (e) => {
    setTouchStartX(e.clientX);
    setIsDragging(true);
    setIsPaused(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setTouchEndX(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      setIsTransitioning(true);
      if (diff > 0) {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      } else {
        setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
      }
      setTimeout(() => setIsTransitioning(false), 700);
    }

    setTimeout(() => {
      setIsPaused(false);
    }, 3000);
  };

  if (ads.length === 0) return null;

  if (ads.length === 1) {
    return renderAd(ads[0], 0);
  }

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="relative w-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ touchAction: 'pan-y' }}
      >
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ 
            transform: `translateX(-${currentIndex * 100}%)`
          }}
        >
          {ads.map((ad, index) => (
            <div
              key={`ad-slide-${ad.id || index}`}
              className="w-full flex-shrink-0"
            >
              {renderAd(ad, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SIDEBAR AD COMPONENT - FITTED SIZE
// ============================================
export const SidebarAd = ({ position, page, category, index = 0, onLoad }) => {
  const { ads, loading, handleClick } = usePositionAds(position, { page, category });
  const hasNotifiedRef = useRef(false);
  const [shouldShow] = useState(() => Math.random() < 0.65);

  const adIndex = Math.min(index, ads.length - 1);
  const singleAd = ads.length > 0 ? ads[adIndex] || ads[0] : null;

  useEffect(() => {
    if (!loading && singleAd && onLoad && typeof onLoad === 'function' && !hasNotifiedRef.current && shouldShow) {
      onLoad();
      hasNotifiedRef.current = true;
    }
  }, [loading, singleAd, onLoad, shouldShow]);

  const renderAd = (ad) => {
    if (!ad) return null;
    
    return (
      <div
        key={ad.id}
        className={`relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ${
          ad.linkUrl ? 'cursor-pointer group' : ''
        }`}
        onClick={() => ad.linkUrl && handleClick(ad, ad.linkUrl, ad.openInNewTab)}
        role="complementary"
        aria-label="Advertisement"
      >
        <div className="relative w-full">
          <img
            src={`${API_URL}${ad.imageUrl}`}
            alt={ad.title || "Advertisement"}
            className="w-full h-auto object-cover transition-transform duration-700"
            style={{ maxHeight: '280px', minHeight: '150px' }}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100%25" height="200"%3E%3Crect width="100%25" height="100%25" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="14"%3EAd unavailable%3C/text%3E%3C/svg%3E';
            }}
            loading="lazy"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-3 py-1.5 rounded-full tracking-wider uppercase border border-white/20 z-10 shadow-lg">
            Sponsored
          </span>

          {ad.linkUrl && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-pink-500/10 transition-all duration-500 pointer-events-none" />
          )}
        </div>
      </div>
    );
  };

  if (shouldShow === false) return null;
  if (shouldShow === null) return null;

  if (loading) {
    return (
      <div className="mb-4">
        <div className="w-full h-[200px] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-2xl shadow-sm" />
      </div>
    );
  }

  if (ads.length === 0) return null;

  // If multiple ads, use slider (NO DOTS)
  if (ads.length > 1) {
    return (
      <div className="mb-6">
        <AdSlider 
          ads={ads} 
          renderAd={renderAd}
          autoSlideInterval={5000}
        />
      </div>
    );
  }

  return <div className="mb-6">{renderAd(ads[0], 0)}</div>;
};

// ============================================
// BANNER AD COMPONENT - FITTED SIZE
// ============================================
export const BannerAd = ({ position = 'homepage-banner', page, category }) => {
  const { ads, loading, handleClick } = usePositionAds(position, { page, category });

  const renderAd = (ad) => {
    if (!ad) return null;
    
    return (
      <div
        key={ad.id}
        className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 ${
          ad.linkUrl ? 'cursor-pointer group' : ''
        }`}
        onClick={() => ad.linkUrl && handleClick(ad, ad.linkUrl, ad.openInNewTab)}
        role="complementary"
        aria-label="Advertisement"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-xl blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-700" />
        
        <div className="relative w-full">
          <img
            src={`${API_URL}${ad.imageUrl}`}
            alt={ad.title || "Advertisement"}
            className="w-full h-auto object-cover relative z-10 transition-transform duration-700"
            style={{ maxHeight: '180px', minHeight: '100px' }}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100%25" height="140"%3E%3Crect width="100%25" height="100%25" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="18"%3EAd unavailable%3C/text%3E%3C/svg%3E';
            }}
            loading="lazy"
          />
          
          <span className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur-md text-white text-[8px] md:text-[10px] font-semibold px-2.5 py-1 md:px-3 md:py-1.5 rounded-full tracking-wider uppercase border border-white/20 shadow-lg">
            Sponsored
          </span>

          {ad.linkUrl && (
            <div className="absolute inset-0 z-10 bg-gradient-to-r from-blue-600/0 via-purple-600/0 to-pink-600/0 group-hover:from-blue-600/5 group-hover:via-purple-600/5 group-hover:to-pink-600/5 transition-all duration-500 pointer-events-none" />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="my-6 max-w-7xl mx-auto px-4">
        <div className="w-full h-[140px] md:h-[180px] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (ads.length === 0) return null;

  // If multiple ads, use slider (NO DOTS)
  if (ads.length > 1) {
    return (
      <div className="my-6 max-w-7xl mx-auto px-4 group">
        <AdSlider 
          ads={ads} 
          renderAd={renderAd}
          autoSlideInterval={5000}
        />
      </div>
    );
  }

  return (
    <div className="my-6 max-w-7xl mx-auto px-4 group">
      {renderAd(ads[0], 0)}
    </div>
  );
};

// ============================================
// NAVBAR AD COMPONENT - FITTED SIZE
// ============================================
export const NavbarAd = ({ position = 'navbar-top', page, category }) => {
  const { ads, loading, handleClick } = usePositionAds(position, { page, category });

  const renderAd = (ad) => {
    if (!ad) return null;
    
    return (
      <div
        key={ad.id}
        className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 ${
          ad.linkUrl ? 'cursor-pointer group' : ''
        }`}
        onClick={() => ad.linkUrl && handleClick(ad, ad.linkUrl, ad.openInNewTab)}
        role="complementary"
        aria-label="Advertisement"
      >
        <div className="relative w-full">
          <img
            src={`${API_URL}${ad.imageUrl}`}
            alt={ad.title || "Advertisement"}
            className="w-full h-auto object-cover transition-transform duration-700"
            style={{ maxHeight: '140px', minHeight: '80px' }}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100%25" height="100"%3E%3Crect width="100%25" height="100%25" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="16"%3EAd unavailable%3C/text%3E%3C/svg%3E';
            }}
            loading="eager"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <span className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[8px] md:text-[10px] font-semibold px-2 py-1 md:px-3 md:py-1.5 rounded-full tracking-wider uppercase border border-white/20 z-10 shadow-lg">
            Sponsored
          </span>

          {ad.linkUrl && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500 pointer-events-none" />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="w-full h-[100px] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (ads.length === 0) return null;

  // If multiple ads, use slider (NO DOTS)
  if (ads.length > 1) {
    return (
      <div className="w-full">
        <AdSlider 
          ads={ads} 
          renderAd={renderAd}
          autoSlideInterval={5000}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {renderAd(ads[0], 0)}
    </div>
  );
};

// ============================================
// ARTICLE INLINE AD COMPONENT - FITTED SIZE
// ============================================
export const ArticleInlineAd = ({ position = 'article-middle', page, category, onLoad }) => {
  const { ads, loading, handleClick } = usePositionAds(position, { page, category });
  const hasNotifiedRef = useRef(false);

  const singleAd = ads.length > 0 ? ads[0] : null;

  useEffect(() => {
    if (!loading && singleAd && onLoad && typeof onLoad === 'function' && !hasNotifiedRef.current) {
      onLoad();
      hasNotifiedRef.current = true;
    }
  }, [loading, singleAd, onLoad]);

  const renderAd = (ad) => {
    if (!ad) return null;
    
    return (
      <div
        key={ad.id}
        className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-500 ${
          ad.linkUrl ? 'cursor-pointer group' : ''
        }`}
        onClick={() => ad.linkUrl && handleClick(ad, ad.linkUrl, ad.openInNewTab)}
        role="complementary"
        aria-label="Advertisement"
      >
        <div className="relative w-full">
          <img
            src={`${API_URL}${ad.imageUrl}`}
            alt={ad.title || "Advertisement"}
            className="w-full h-auto object-cover transition-transform duration-700"
            style={{ maxHeight: '200px', minHeight: '120px' }}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100%25" height="150"%3E%3Crect width="100%25" height="100%25" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="16"%3EAd unavailable%3C/text%3E%3C/svg%3E';
            }}
            loading="lazy"
          />
          
          <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-3 py-1.5 rounded-full tracking-wider uppercase border border-white/20 z-10 shadow-lg">
            Sponsored
          </span>

          {ad.linkUrl && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-blue-500/5 group-hover:via-purple-500/5 group-hover:to-pink-500/5 transition-all duration-500 pointer-events-none" />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="my-8">
        <div className="text-xs text-gray-400 text-center mb-2">Advertisement</div>
        <div className="w-full h-[150px] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-xl" />
      </div>
    );
  }

  if (ads.length === 0) return null;

  // If multiple ads, use slider (NO DOTS)
  if (ads.length > 1) {
    return (
      <div className="mt-5 mb-8">
        <AdSlider 
          ads={ads} 
          renderAd={renderAd}
          autoSlideInterval={5000}
        />
      </div>
    );
  }

  return <div className="mt-5 mb-8">{renderAd(ads[0], 0)}</div>;
};

// ============================================
// CATEGORY BANNER AD COMPONENT - FITTED SIZE
// ============================================
export const CategoryBannerAd = ({ position = 'category-banner', page, category }) => {
  const { ads, loading, handleClick } = usePositionAds(position, { page, category });

  const renderAd = (ad) => {
    if (!ad) return null;
    
    return (
      <div
        key={ad.id}
        className={`relative overflow-hidden rounded-2xl shadow-xl hover:shadow-3xl transition-all duration-500 ${
          ad.linkUrl ? 'cursor-pointer group' : ''
        }`}
        onClick={() => ad.linkUrl && handleClick(ad, ad.linkUrl, ad.openInNewTab)}
        role="complementary"
        aria-label="Advertisement"
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-700" />
        
        <div className="relative w-full">
          <img
            src={`${API_URL}${ad.imageUrl}`}
            alt={ad.title || "Advertisement"}
            className="w-full h-auto object-cover relative z-10 transition-transform duration-700"
            style={{ maxHeight: '280px', minHeight: '150px' }}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100%25" height="200"%3E%3Crect width="100%25" height="100%25" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="20"%3EAd unavailable%3C/text%3E%3C/svg%3E';
            }}
            loading="lazy"
          />
          
          <span className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-3 py-1.5 rounded-full tracking-wider uppercase border border-white/20 shadow-lg">
            Sponsored
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="mb-8">
        <div className="w-full h-[200px] bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (ads.length === 0) return null;

  // If multiple ads, use slider (NO DOTS)
  if (ads.length > 1) {
    return (
      <div className="mb-8">
        <AdSlider 
          ads={ads} 
          renderAd={renderAd}
          autoSlideInterval={5000}
        />
      </div>
    );
  }

  return <div className="mb-8">{renderAd(ads[0], 0)}</div>;
};