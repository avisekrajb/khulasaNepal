// LocalHome.jsx - Fixed with Pagination and Props
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NepaliDate from 'nepali-date-converter';
import { BannerAd, SidebarAd } from '../components/ads/AdComponents'; 
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL 

const LocalHome = ({ news = [] }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [displayCount] = useState(18); // 6 featured + 6 most viewed + 6 additional
  
  const localNews = news;
  const [loadedAdsCount, setLoadedAdsCount] = useState(0);
  const handleAdLoad = useCallback(() => setLoadedAdsCount(prev => prev + 1), []);
  
  const getImageUrl = (image) => {
    if (!image) return 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=1200&q=80';
    return image.startsWith('http') ? image : `${API_URL}${image}`;
  };

  const toNepaliNumber = (num) => {
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(digit => nepaliDigits[digit]).join('');
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const published = new Date(dateString);
    const seconds = Math.floor((now - published) / 1000);

    if (seconds < 45) return "भर्खरै";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${toNepaliNumber(minutes)} ${minutes === 1 ? 'मिनेट' : 'मिनेट'} अघि`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${toNepaliNumber(hours)} ${hours === 1 ? 'घण्टा' : 'घण्टा'} अघि`;
    }

    const nepaliMonths = [
      'बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज',
      'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत'
    ];

    const nepaliDays = [
      'आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'
    ];

    const nepaliDate = new NepaliDate(published);
    const month = nepaliMonths[nepaliDate.getMonth()];
    const day = toNepaliNumber(nepaliDate.getDate());
    const dayOfWeek = nepaliDays[published.getDay()];

    let hours12 = published.getHours();
    const mins = published.getMinutes();
    const ampm = hours12 >= 12 ? 'अपराह्न' : 'पूर्वाह्न';
    hours12 = hours12 % 12;
    hours12 = hours12 ? hours12 : 12;

    const formattedTime = `${toNepaliNumber(hours12)}:${toNepaliNumber(mins.toString().padStart(2, '0'))} ${ampm}`;

    return `${month} ${day} ${dayOfWeek}, ${formattedTime}`;
  };

  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getExcerpt = (item) => {
    const content = item.subtitle || item.paragraph || '';
    const plainText = stripHtml(content);
    return plainText.length > 80 ? plainText.substring(0, 80) + '...' : plainText;
  };

  // Get displayed items based on displayCount
  const displayedNews = localNews.slice(0, displayCount);

  // Featured news section (first 6 articles → 2 rows × 3 columns)
  const featuredNews = displayedNews.slice(0, 6);

  // Most viewed section (next 6 articles) - for sticky sidebar
  const mostViewedNews = displayedNews.slice(6, 12);

  // Additional cards section (next 6 articles) - for 2 rows × 2 columns
  const additionalCards = displayedNews.slice(12, 18);

  // Empty state
  if (localNews.length === 0) {
    return (
      <div className={`mb-20 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-gray-900' : ''}`}>
        <div className="max-w-7xl mx-auto text-center py-12">
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>कुनै स्थानीय समाचार उपलब्ध छैन</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-20 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-gray-900' : ''}`}>
      <div className="max-w-7xl mx-auto">
        <BannerAd position="homepage-banner" page="local" />
  
        {/* Main Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <h1 className={`text-4xl font-bold leading-normal ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                स्थानीय
                <div className="h-1 w-32 bg-blue-600 rounded-full mt-4"></div>
              </h1>
              <button 
                onClick={() => navigate('/local')}
                className="text-blue-600 font-medium flex items-center gap-2 hover:gap-4 transition-all leading-normal"
              >
                थप समाचार हेर्नुहोस्
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Featured News - 2 rows × 3 columns */}
            {featuredNews.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
                {featuredNews.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/local/${item.id}`)}
                    className="group relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer aspect-[4/3] lg:aspect-[4/3.2]"
                  >
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                    {item.hasVideo && (
                      <div className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <h3 className="text-xl font-semibold leading-normal mb-2 group-hover:text-blue-400 transition-colors">
                        {item.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Additional Cards - 2 columns */}
            {additionalCards.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {additionalCards.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/local/${item.id}`)}
                    className={`group cursor-pointer ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300`}
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute bottom-2 left-2 flex items-center gap-2 text-sm text-gray-100 bg-black bg-opacity-50 px-2 py-1 rounded z-10">
                        <span>{getTimeAgo(item.publishedDate)}</span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className={`text-lg font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'} leading-normal group-hover:text-blue-600 transition-colors line-clamp-2 mb-2`}>
                        {item.title}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} leading-normal line-clamp-2 mb-3`}>
                        {getExcerpt(item)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg p-6 border`}>
                <div className="flex items-center justify-between mb-6">
                  {loadedAdsCount === 0 && (
                    <h2 className={`text-2xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>थप समाचार</h2>
                  )}
                </div>

                <div className="space-y-4">
                  {/* 3 ads directly — no wrapper divs */}
                  <SidebarAd position="sidebar-top" page="category" category="local" index={0} onLoad={handleAdLoad} />
                  <SidebarAd position="sidebar-middle" page="category" category="local" index={0} onLoad={handleAdLoad} />
                  <SidebarAd position="sidebar-bottom" page="category" category="local" index={0} onLoad={handleAdLoad} />

                  {/* News items */}
                  {mostViewedNews.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/local/${item.id}`)}
                      className={`py-3 ${isDark ? 'border-gray-700' : 'border-gray-200'} border-b last:border-0 cursor-pointer group`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-base font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'} leading-normal group-hover:text-blue-600 transition-colors line-clamp-2 mb-2`}>
                            {item.title}
                          </h4>
                          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{getTimeAgo(item.publishedDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalHome;