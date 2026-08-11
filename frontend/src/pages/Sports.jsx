import React, { useState } from 'react';
import { useCache } from '../utils/useCache';
import { useNavigate } from 'react-router-dom';
import { Play, Clock, Calendar, User, ArrowRight, ChevronLeft, ChevronRight, TrendingUp, Flame } from 'lucide-react';
import khulashaLogo from '../assets/image/khulashalogo.png';
import NepaliDate from 'nepali-date-converter';

import { CategoryBannerAd, SidebarAd } from '../components/ads/AdComponents';
const API_URL = import.meta.env.VITE_API_URL 
const Sports = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);

const { data: sportsList, loading, error } = useCache(
  'sports-list',
  async () => {
    const response = await fetch(`${API_URL}/api/news/category/sports`);
    if (!response.ok) throw new Error('Failed to fetch sports articles');
    const data = await response.json();
    
    const articles = data.success && Array.isArray(data.data) 
      ? data.data 
      : Array.isArray(data) 
        ? data 
        : [];
    
    return articles;
  },
  5 * 60 * 1000 // 5 minutes cache
);

const safeSportsList = sportsList || [];
  const itemsPerPage = 9;




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

  // After 1 day, show the Nepali date with day and time
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

  // Get the time in 12-hour format
  let hours12 = published.getHours();
  const mins = published.getMinutes();
  const ampm = hours12 >= 12 ? 'अपराह्न' : 'पूर्वाह्न';
  hours12 = hours12 % 12;
  hours12 = hours12 ? hours12 : 12; // Convert 0 to 12

  const formattedTime = `${toNepaliNumber(hours12)}:${toNepaliNumber(mins.toString().padStart(2, '0'))} ${ampm}`;

  return `${month} ${day} ${dayOfWeek}, ${formattedTime}`;
};

  const handleArticleClick = (id) => {
    navigate(`/sports/${id}`);
  };

  // Pagination
const totalPages = Math.ceil(safeSportsList.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const currentSports = safeSportsList.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
        

      {/* Hero Section - Only on Page 1 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
                <CategoryBannerAd position="category-banner" page="category" category="sports" />
        {currentPage === 1 && (
          <div className="max-w-7xl">
            {/* Title and Date Above */}




            {/* Meta Information Below Image */}
{!loading && safeSportsList.length > 0 && (
<div className="mb-6 cursor-pointer" onClick={() => navigate(`/sports/${safeSportsList[0].id}`)}>
    <div className="text-center mb-6">
      <h1 className="text-3xl md:text-3xl lg:text-4xl font-bold mb-2 text-gray-900 leading-snug">
        {sportsList[0].title}
      </h1>
    </div>
                   <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-gray-600 mb-6">
      <div className="flex items-center gap-2">
        <img
          src={sportsList[0].journalistImage 
            ? `${API_URL}${sportsList[0].journalistImage}`
            : khulashaLogo
          }
          alt={sportsList[0].journalistName || "खुलासा नेपाल"}
          className={
            sportsList[0].journalistImage 
              ? `w-10 h-10 rounded-full object-cover ring-4 ring-blue-500/70 ring-offset-2 ring-offset-white transition-all duration-250 hover:ring-blue-600 hover:ring-offset-blue-100 hover:scale-105`
              : `w-10 h-10 rounded-full object-contain ring-4 ring-blue-500/70 ring-offset-2 ring-offset-white transition-all duration-250 hover:ring-blue-600 hover:ring-offset-blue-100 hover:scale-105`
          }
        />
<span className="text-m md:text-base p-2">
  {sportsList[0].journalistName || "खुलासा नेपाल"}
</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span className="text-sm md:text-base">{getTimeAgo(sportsList[0].publishedDate)}</span>
      </div>
    </div>
                
                              {/* Image */}
            <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-2xl shadow-2xl mb-6">
              {loading || sportsList.length === 0 ? (
                
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat"  
                />
                
               
              ) : (
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat cursor-pointer"
                  style={{
                    backgroundImage: `url('${API_URL}${sportsList[0].image}')`,
                  }}
                  onClick={() => navigate(`/sports/${sportsList[0].id}`)}
                />
              )}
            </div>
                  <h3 
                    className="text-xl md:text-xl font-semibold mb-4 text-gray-900 text-center cursor-pointer hover:text-blue-900 transition-colors"
                    onClick={() => handleArticleClick(currentSports[0].id)}
                  >
                    {currentSports[0].subtitle}
                  </h3>
                  
                {/* Subtitle/Description */}
            {currentSports[0].paragraph && (
              
              <p className="text-lg text-gray-700 text-center max-w-8xl mx-auto line-clamp-3">
                {currentSports[0].paragraph
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ')
}
              </p>
            )}

                  {/* {sportsList[0].subtitle && (
                  <p className="text-lg text-gray-700 text-center max-w-3xl mx-auto line-clamp-1">
                    {sportsList[0].subtitle}
                  </p>
                  
                )} */}
              </div>
            )}

            {loading && (
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            )}

            {!loading && sportsList.length === 0 && (
              <p className="text-lg text-gray-600 text-center">कुनै समाचार उपलब्ध छैन</p>
            )}
          </div>
        )}
        
        {/* Main Content */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 font-medium">समाचार लोड गर्न असफल भयो: {error}</p>
          </div>
        )}

        {!loading && !error && sportsList.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">कुनै खेलकुद समाचार उपलब्ध छैन</p>
          </div>
        )}

        {!loading && !error && currentSports.length > 0 && (
          <>
            {/* Featured Article (Second Item) - Only on Page 1 */}
            {currentPage === 1 && currentSports[1] && (
  <div className="mb-16">
    {/* Title and Date Above */}
    <div className="text-center mb-6 cursor-pointer" onClick={() => navigate(`/sports/${sportsList[1].id}`)}>
      <h2 className="text-3xl leading-normal md:text-3xl lg:text-3xl font-bold mb-2 text-gray-900 pt-10">
        {currentSports[1].title}
      </h2>
    </div>

    {/* FIXED: Remove the conditional wrapper */}
    <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-gray-600 mb-6">
      <div className="flex items-center gap-2">
        <img
          src={currentSports[1].journalistImage 
            ? `${API_URL}${currentSports[1].journalistImage}`
            : khulashaLogo
          }
          alt={currentSports[1].journalistName || "खुलासा नेपाल"}
          className={currentSports[1].journalistImage 
            ? "w-10 h-10 rounded-full object-cover ring-4 ring-blue-500/70 ring-offset-2 ring-offset-white transition-all duration-250 hover:ring-blue-600 hover:ring-offset-blue-100 hover:scale-105" 
            : "w-10 h-10 rounded-full object-contain ring-4 ring-blue-500/70 ring-offset-2 ring-offset-white transition-all duration-250 hover:ring-blue-600 hover:ring-offset-blue-100 hover:scale-105"
          }
        />
        <span className="text-m p-2 md:text-base">
          {currentSports[1].journalistName || "खुलासा नेपाल"}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" />
        <span className="text-sm md:text-base">{getTimeAgo(currentSports[1].publishedDate)}</span>
      </div>
    </div>

    {/* Image */}
    <div
      className="relative cursor-pointer overflow-hidden rounded-2xl shadow-2xl h-96 mb-6"
      onClick={() => handleArticleClick(currentSports[1].id)}
    >
      {currentSports[1].image && (
        <img
          src={`${API_URL}${currentSports[1].image}`}
          alt={currentSports[1].title}
          className="w-full h-full object-cover"
        />
      )}
    </div>

    {/* Meta Information Below Image */}
    <div>
      <h3 
        className="text-xl md:text-xl font-bold mb-4 text-gray-900 text-center cursor-pointer hover:text-blue-900 transition-colors"
        onClick={() => handleArticleClick(currentSports[1].id)}
      >
        {currentSports[1].subtitle}
      </h3>

      {currentSports[1].paragraph && (
        <p className="text-lg text-gray-700 text-center max-w-8xl mx-auto line-clamp-3">
          {currentSports[1].paragraph.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')}
        </p>
      )}
    </div>
  </div>
)}

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentSports.slice(currentPage === 1 ? 2 : 0).map((sports) => (
                <article
                  key={sports.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow cursor-pointer group"
                  onClick={() => handleArticleClick(sports.id)}
                >
                  <div className="relative h-56 overflow-hidden">
                    {sports.image ? (
                      <img
                        src={`${API_URL}${sports.image}`}
                        alt={sports.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Play size={48} className="text-gray-400" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/70 px-2 py-1 rounded text-xs text-white">
                      <Clock className="w-3 h-3" />
                      <span>{getTimeAgo(sports.publishedDate)}</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-l font-semibold text-gray-900 group-hover:text-blue-900 transition">
                      {sports.title}
                    </h3>


                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-16">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition"
                >
                  <ChevronLeft size={20} />
                  अघिल्लो
                </button>

                <div className="flex gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-12 h-12 rounded-lg font-semibold transition ${
                        currentPage === page
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'border-2 border-gray-300 hover:bg-gray-100 text-gray-700 '
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition"
                >
                  पछिल्लो
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Sports;