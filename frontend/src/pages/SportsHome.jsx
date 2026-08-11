import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Clock } from 'lucide-react';
import NepaliDate from 'nepali-date-converter';
import { BannerAd, SidebarAd } from '../components/ads/AdComponents'; 
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL;

const SportsHome = ({ news = [] }) => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [displayCount] = useState(9); 
  
  const sportsList = news;

  const getImageUrl = (image) => {
    if (!image) return 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=1200';
    return image.startsWith('http') ? image : `${API_URL}${image}`;
  };

  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getCleanText = (text, maxLength = 150) => {
    const cleaned = stripHtml(text);
    if (cleaned.length > maxLength) {
      return cleaned.substring(0, maxLength) + '...';
    }
    return cleaned;
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

  // Get displayed items based on displayCount
  const displayedSports = sportsList.slice(0, displayCount);

  // Data slicing
  const featuredArticle = displayedSports[0];
  const gridArticles = displayedSports.slice(1, 5);
  const sidebarArticles = displayedSports.slice(5, 9);

  const handleNavigate = (id) => {
    if (id === 'all') {
      navigate('/sports');
    } else {
      navigate(`/sports/${id}`);
    }
  };

  if (sportsList.length === 0) {
    return (
      <div className={`w-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="mb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center py-12">
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>कुनै खेलकुद समाचार उपलब्ध छैन</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="mb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-8">
          <BannerAd position="homepage-banner" page="sports" />
          
          <div className="flex items-center justify-between mb-12">
            <h1 className={`text-4xl font-bold leading-normal ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
              खेलखबर
              <div className="h-1 w-32 bg-blue-600 rounded-full mt-4"></div>
            </h1>
            <button 
              onClick={() => handleNavigate('all')}
              className="text-blue-600 font-medium flex items-center gap-2 hover:gap-4 transition-all text-sm md:text-base"
            >
              थप हेर्नुहोस् <ChevronRight size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {featuredArticle && (
                <div 
                  onClick={() => handleNavigate(featuredArticle.id)}
                  className="group relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer h-[450px] md:h-[550px]"
                >
                  <img
                    src={getImageUrl(featuredArticle.image)}
                    alt={featuredArticle.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-y-0 right-0 w-2/5 bg-gradient-to-l from-black/80 via-black/50 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10 text-white">
                    <h2 className="text-2xl md:text-4xl lg:text-2xl font-bold leading-normal mb-4 drop-shadow-2xl group-hover:text-blue-300 transition-colors">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-sm md:text-xl text-gray-100 line-clamp-1 mb-4 drop-shadow-lg">
                      {getCleanText(featuredArticle.subtitle || featuredArticle.paragraph, 150)}
                    </p>
                    <div className="absolute flex items-center gap-2 text-sm text-gray-100 bg-black bg-opacity-50 px-2 py-1 rounded z-10">
                      <Clock size={16} />
                      <span>{getTimeAgo(featuredArticle.publishedDate)}</span>
                    </div>
                  </div>
                </div>
              )}

              {gridArticles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {gridArticles.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleNavigate(item.id)}
                      className={`group ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer`}
                    >
                      <div className="relative h-56 overflow-hidden">
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute bottom-2 left-2 flex items-center gap-2 text-sm text-gray-100 bg-black bg-opacity-50 px-2 py-1 rounded z-10">
                          <Clock size={14} />
                          <span>{getTimeAgo(item.publishedDate)}</span>
                        </div>
                      </div>

                      <div className="p-5">
                        <h3 className={`text-lg font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'} mb-2 line-clamp-2 leading-normal group-hover:text-blue-600 transition-colors`}>
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
         
            <div className="space-y-6">
              {sidebarArticles.length > 0 && sidebarArticles.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`group ${isDark ? 'bg-gray-800' : 'bg-white'} cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300`}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-2 left-2 flex items-center gap-2 text-sm text-gray-100 bg-black bg-opacity-50 px-2 py-1 rounded z-10">
                      <Clock size={12} />
                      <span>{getTimeAgo(item.publishedDate)}</span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className={`font-bold text-base ${isDark ? 'text-gray-200' : 'text-gray-900'} line-clamp-3 leading-normal group-hover:text-blue-600 transition-colors`}>
                      {item.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SportsHome;