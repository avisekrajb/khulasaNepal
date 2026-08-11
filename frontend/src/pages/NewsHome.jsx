import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NepaliDate from 'nepali-date-converter';
import { BannerAd, SidebarAd } from '../components/ads/AdComponents';
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL;

const NewsHome = ({ news = [] }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [displayCount, setDisplayCount] = useState(12);
  
  const newsList = news;
  const hasMore = displayCount < newsList.length;

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
    const excerpt = item.excerpt || item.paragraph || '';
    const plainText = stripHtml(excerpt);
    return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
  };

  const displayedNews = newsList.slice(0, displayCount);

  if (newsList.length === 0) {
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
        <BannerAd position="homepage-banner" page="news" />
        
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6`}>
          <div className="flex items-center justify-between mb-8">
            <h2 className={`text-4xl font-bold leading-normal ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>समाचार</h2>
            
            <div className="flex items-center gap-3">
              {/* View All Button */}
              <button 
                onClick={() => navigate('/news')}
                className={`text-sm font-medium ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} transition-colors`}
              >
                सबै हेर्नुहोस् →
              </button>
            </div>
          </div>

          {/* News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedNews.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/news/${item.id}`)}
                className={`group ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'} rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border`}
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={item.image?.startsWith('http') ? item.image : `${API_URL}${item.image}`}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Timestamp overlay on image */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <span className="text-xs text-white font-medium">
                      {getTimeAgo(item.publishedDate)}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className={`text-lg font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'} mb-2 line-clamp-2 leading-normal group-hover:text-blue-600 transition-colors`}>
                    {item.title}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2 leading-normal`}>
                    {getExcerpt(item)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={() => setDisplayCount(prev => prev + 6)}
                className={`px-6 py-2.5 ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} rounded-lg font-medium transition-colors`}
              >
                थप लोड गर्नुहोस्
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsHome;