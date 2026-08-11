import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

const AdPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has already seen the popup today
    const lastShown = sessionStorage.getItem('adPopupShown');
    const today = new Date().toDateString();
    
    // Show only once per session (or once per day if you use localStorage)
    if (lastShown === today) {
      setLoading(false);
      return;
    }

    fetchHeaderAd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHeaderAd = async () => {
    try {
      const response = await fetch(`${API_URL}/api/ads/position/header`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch header ad');
      }

      const data = await response.json();

      if (data.success && data.ads && data.ads.length > 0) {
        const headerAd = data.ads[0]; // Get highest priority ad
        setAd(headerAd);
        
        // Show popup after a short delay (better UX)
        setTimeout(() => {
          setIsOpen(true);
          recordImpression(headerAd.id);
          
          // Mark as shown for this session
          sessionStorage.setItem('adPopupShown', new Date().toDateString());
        }, 1000); // 1 second delay
      }
    } catch (err) {
      console.error('Error fetching header ad:', err);
    } finally {
      setLoading(false);
    }
  };

  const recordImpression = async (adId) => {
    try {
      await fetch(`${API_URL}/api/ads/${adId}/impression`, { 
        method: 'POST' 
      });
    } catch (err) {
      console.error('Error recording impression:', err);
    }
  };

  const handleAdClick = async () => {
    if (!ad.linkUrl) return;

    try {
     
      await fetch(`${API_URL}/api/ads/${ad.id}/click`, { 
        method: 'POST' 
      });
      
      // Open the link
      if (ad.openInNewTab) {
        window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = ad.linkUrl;
      }
    } catch (err) {
      console.error('Error recording ad click:', err);
      // Still open the link even if tracking fails
      if (ad.openInNewTab) {
        window.open(ad.linkUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = ad.linkUrl;
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Don't render anything if loading or no ad
  if (loading || !ad || !isOpen) return null;

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998] animate-fadeIn"
        onClick={handleClose}
      />

      {/* Popup Container */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden pointer-events-auto animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 group"
            aria-label="Close advertisement"
          >
            <X size={24} className="text-gray-700 group-hover:text-red-600" />
          </button>

          {/* Ad Content */}
          <div 
            className={`relative w-full h-full ${ad.linkUrl ? 'cursor-pointer' : ''}`}
            onClick={() => ad.linkUrl && handleAdClick()}
          >
            <img
              src={`${API_URL}${ad.imageUrl}`}
              alt={ad.title}
              className="w-full h-full object-contain max-h-[85vh]"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<p class="text-gray-400 text-center p-8">Ad unavailable</p>';
              }}
            />

            {/* Optional: Ad Title Overlay */}
            {ad.title && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <h3 className="text-white text-xl font-bold">{ad.title}</h3>
              </div>
            )}
          </div>


        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0; 
            transform: scale(0.9);
          }
          to { 
            opacity: 1; 
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default AdPopup;