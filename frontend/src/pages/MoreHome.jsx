import React, { useState, useCallback } from 'react';
import { Calendar, Clock, Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NepaliDate from 'nepali-date-converter';
import { CategoryBannerAd, SidebarAd } from '../components/ads/AdComponents'; 
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL 

const MoreHome = ({ news = [] }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [viewMode, setViewMode] = useState('list');
  const [displayCount] = useState(12);
  
  const articles = news;
  const [loadedAdsCount, setLoadedAdsCount] = useState(0);
  const handleAdLoad = useCallback(() => setLoadedAdsCount(prev => prev + 1), []);
  
  const getImageUrl = (image) => {
    if (!image) return 'https://risingnepaldaily.com/storage/media/73522/HoR.jpeg';
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
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  // Get displayed articles based on displayCount
  const displayedArticles = articles.slice(0, displayCount);

  // Trending and popular posts (from remaining articles not in main display)
  const trendingPosts = articles.slice(0, 3);

  // Empty state
  if (articles.length === 0) {
    return (
      <div className={`mb-20 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-gray-900' : ''}`}>
        <div className="max-w-7xl mx-auto text-center py-12">
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>कुनै समाचार उपलब्ध छैन</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-20 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-gray-900' : ''}`}>
      <div className="max-w-7xl mx-auto">
        <CategoryBannerAd position="category-banner" page="category" category="more" />
        
        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Left: Latest News */}
          <main className="w-full lg:w-3/4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
              <h3 className={`text-4xl font-bold leading-normal ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>थप समाचार</h3>
              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg p-1`}>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 sm:p-3 rounded-lg transition ${
                    viewMode === 'list' 
                      ? isDark ? 'bg-gray-600 shadow-md' : 'bg-white shadow-md'
                      : isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-300'
                  }`}
                  aria-label="List view"
                >
                  <List size={20} className={`sm:w-6 sm:h-6 ${isDark ? 'text-gray-300' : ''}`} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 sm:p-3 rounded-lg transition ${
                    viewMode === 'grid' 
                      ? isDark ? 'bg-gray-600 shadow-md' : 'bg-white shadow-md'
                      : isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-300'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid size={20} className={`sm:w-6 sm:h-6 ${isDark ? 'text-gray-300' : ''}`} />
                </button>
              </div>
            </div>

            {/* Posts Grid/List - Fully Responsive */}
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8' 
                : 'space-y-6 sm:space-y-10'
            }>
              {displayedArticles.map((post) => (
                <article
                  key={post.id}
                  onClick={() => navigate(`/more/${post.id}`)}
                  className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group ${
                    viewMode === 'list' 
                      ? 'flex flex-row gap-3 sm:gap-6 lg:gap-8' 
                      : 'flex flex-col'
                  }`}
                >
                  {/* Image */}
                  <div className={`relative overflow-hidden flex-shrink-0 ${
                    viewMode === 'list'
                      ? 'w-32 h-32 xs:w-40 xs:h-40 sm:w-64 sm:h-56 md:w-80 md:h-64 lg:w-96'
                      : 'w-full h-48 sm:h-56 md:h-64'
                  }`}>
                    <img
                      src={getImageUrl(post.image)}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Content */}
                  <div className={`flex-1 flex flex-col justify-between min-w-0 ${
                    viewMode === 'list' 
                      ? 'p-3 sm:p-6 lg:p-8' 
                      : 'p-4 sm:p-6'
                  }`}>
                    <div>
                      <h4 className={`font-bold mb-2 sm:mb-3 lg:mb-4 leading-normal hover:text-blue-600 transition overflow-hidden ${
                        viewMode === 'list' 
                          ? 'text-base sm:text-l lg:text-xl line-clamp-3' 
                          : 'text-lg sm:text-xl line-clamp-3'
                      } ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                        {post.title}
                      </h4>
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} leading-normal overflow-hidden ${
                        viewMode === 'list' 
                          ? 'text-xs sm:text-base lg:text-lg mb-2 sm:mb-4 lg:mb-6 mt-2 sm:mt-3 lg:mt-4 line-clamp-2' 
                          : 'text-sm sm:text-base mb-3 sm:mb-4 mt-2 sm:mt-3 line-clamp-2'
                      }`}>
                        {post.subtitle || stripHtml(post.paragraph)?.substring(0, viewMode === 'list' ? 200 : 120) + '...' || ''}
                      </p>
                    </div>
                    
                    <div className={`flex flex-row sm:flex-row sm:items-center ${isDark ? 'text-gray-500' : 'text-gray-500'} gap-1 sm:gap-2 lg:gap-6 mt-auto ${
                      viewMode === 'list' 
                        ? 'text-xs sm:text-sm' 
                        : 'text-xs sm:text-sm'
                    }`}>
                      <span className="flex items-center gap-1 sm:gap-2">
                        <Clock size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">{getTimeAgo(post.publishedDate)}</span>
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </main>

          {/* Right Sidebar - Responsive */}
          <aside className="w-full lg:w-1/4">
            <div className="lg:sticky lg:top-24 space-y-6 sm:space-y-8">
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8`}>
                {/* Only show heading if NO ads have loaded */}
                {loadedAdsCount === 0 && (
                  <h3 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>थप समाचार</h3>
                )}

                <div className="space-y-4">
                  {/* 3 ads directly — no wrapper divs */}
                  <SidebarAd position="sidebar-top" page="category" category="more" index={0} onLoad={handleAdLoad} />
                  <SidebarAd position="sidebar-middle" page="category" category="more" index={0} onLoad={handleAdLoad} />
                  <SidebarAd position="sidebar-bottom" page="category" category="more" index={0} onLoad={handleAdLoad} />

                  {/* News items */}
                  {[...trendingPosts, ...articles.slice(3, 8)].map((post) => (
                    <div
                      key={post.id}
                      onClick={() => navigate(`/more/${post.id}`)}
                      className={`py-3 ${isDark ? 'border-gray-700' : 'border-gray-200'} border-b last:border-0 cursor-pointer group`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-base font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'} leading-normal group-hover:text-blue-600 transition-colors line-clamp-2 mb-2`}>
                            {post.title}
                          </h4>
                          <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            <Clock size={12} />
                            <span>{getTimeAgo(post.publishedDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* View All Button */}
        <div className="mt-8 sm:mt-12 text-center">
          <button
            onClick={() => navigate('/more')}
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white font-semibold text-base sm:text-lg rounded-full hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto justify-center"
          >
            सबै समाचार हेर्नुहोस्
            <ChevronRight size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoreHome;