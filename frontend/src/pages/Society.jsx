import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import NepaliDate from 'nepali-date-converter';
import khulashaLogo from '../assets/image/khulashalogo.png';

import { CategoryBannerAd, SidebarAd } from '../components/ads/AdComponents';
const API_URL = import.meta.env.VITE_API_URL 
// Helper function to convert numbers to Nepali
const toNepaliNumber = (num) => {
  const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return num.toString().split('').map(digit => nepaliDigits[digit]).join('');
};

// Helper function to strip HTML tags
const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// Pagination Controls Component
const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-12 mb-8">
      <button
        onClick={() => {
          if (currentPage > 1) {
            onPageChange(currentPage - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        className="w-10 h-10 bg-white shadow-md rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
        <button
          key={pageNum}
          onClick={() => {
            onPageChange(pageNum);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`w-10 h-10 rounded-lg font-semibold transition ${
            pageNum === currentPage
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 shadow-sm'
          }`}
          aria-label={`Go to page ${pageNum}`}
        >
          {pageNum}
        </button>
      ))}
      
      <button
        onClick={() => {
          if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        className="w-10 h-10 bg-white shadow-md rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

function Society() {
  const navigate = useNavigate();
  const [societyData, setSocietyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(3);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 19; // 1 hero + 3 featured + 5 small + 5 politics + 5 carousel

  // Get time ago in Nepali
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

  useEffect(() => {
    fetchSocietyData();
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleResize = () => {
    setSlidesToShow(window.innerWidth < 768 ? 1 : 3);
  };

  const fetchSocietyData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/news/category/society');
      
      const articles = response.data.success && Array.isArray(response.data.data) 
        ? response.data.data 
        : Array.isArray(response.data) 
          ? response.data 
          : [];
      
      // Sort by date (newest first)
      const sortedArticles = articles.sort((a, b) => 
        new Date(b.publishedDate) - new Date(a.publishedDate)
      );
      
      setSocietyData(sortedArticles);
      setError(null);
    } catch (err) {
      setError('Failed to load society articles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (image) => {
    if (!image) return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80';
    return image.startsWith('http') ? image : `${API_URL}${image}`;
  };

  const prevSlide = () => {
    const maxIndex = Math.max(0, carouselImages.length - slidesToShow);
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1));
  };

  const nextSlide = () => {
    const maxIndex = Math.max(0, carouselImages.length - slidesToShow);
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const handleCardClick = (id) => {
    navigate(`/society/${id}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setCurrentIndex(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading society articles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-red-600 text-lg md:text-xl mb-4">{error}</p>
          <button 
            onClick={fetchSocietyData}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-transform"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate pagination
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = societyData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const totalPages = Math.ceil(societyData.length / ITEMS_PER_PAGE);

  // Divide data into sections without repeating
  const heroStory = paginatedData.length > 0 ? paginatedData[0] : null;
  const featuredStories = paginatedData.slice(1, 4); // Articles 1-3
  const smallCards = paginatedData.slice(4, 10); // Articles 4-8
  const politicsStories = paginatedData.slice(10, 15); // Articles 9-13
  const carouselImages = paginatedData.slice(15); // Articles 14+

  return (
    <div className="bg-white min-h-screen">
      
       
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-20 pb-12">
         <CategoryBannerAd position="category-banner" page="category" category="society" />
        {/* Hero Section */}
        {heroStory && (
          <div className="mb-12 md:mb-20">
            <div className="w-full">
              <div 
                onClick={() => handleCardClick(heroStory.id)}
                className="cursor-pointer"
              >
                <div className="mb-4 md:mb-6 text-center max-w-4xl mx-auto">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-normal line-clamp-2 mb-3 text-gray-900 hover:text-blue-900 transition-colors">
                    {stripHtml(heroStory.title)}
                  </h2>
                  
                  <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-gray-600">
  {heroStory.journalistName ? (
    <div className="flex items-center gap-2">
      {heroStory.journalistImage ? (
        <img
          src={getImageUrl(heroStory.journalistImage)}
          alt={heroStory.journalistName}
          className="w-8 h-8 rounded-full object-cover border border-blue-600 border-3"
          onError={(e) => {
            e.currentTarget.src = khulashaLogo;           // fallback to logo if image fails to load
            e.currentTarget.className = "w-8 h-8 rounded-full object-contain bg-white border border-blue-600 border-3";
          }}
        />
      ) : (
        <img
          src={khulashaLogo}
          alt="Khulasha Logo"
          className="w-8 h-8 rounded-full object-contain bg-white border border-blue-600 border-3"
        />
      )}
      <span className="text-sm md:text-base">{heroStory.journalistName}</span>
    </div>
  ) : (
    // Fallback when there is NO journalist name at all
    <div className="flex items-center gap-2">
      <img
        src={khulashaLogo}
        alt="Khulasha Logo"
        className="w-8 h-8 rounded-full object-contain bg-white border border-blue-600 border-3"
      />
      <span className="text-sm md:text-base">खुलासा नेपाल</span>
      {/* or: "Staff" / "Editor" / "" — choose whatever fits your brand */}
    </div>
  )}

  {heroStory.publishedDate && (
    <div className="flex items-center gap-2">
      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth="2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
      </svg>
      <span className="text-sm font-bold md:text-base">
        {getTimeAgo(heroStory.publishedDate)}
      </span>
    </div>
  )}
</div>
                </div>
                
                <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[400px] md:h-[500px] lg:h-[550px] group mb-4 md:mb-6">
                  <img 
                    src={getImageUrl(heroStory.image)} 
                    alt={stripHtml(heroStory.title)} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>
                
                <div className="space-y-3">
                  {heroStory.subtitle && (
                    <h3 className="text-2xl font-semibold text-gray-800">
                      {stripHtml(heroStory.subtitle)}
                    </h3>
                  )}
                  
                  {heroStory.paragraph && (
                    <p className="text-xl text-gray-700 line-clamp-2 leading-relaxed">
                      {stripHtml(heroStory.paragraph).split('\n')[0]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Featured Stories */}
        {featuredStories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
            {featuredStories.map(story => (
              <div
                key={story.id}
                onClick={() => handleCardClick(story.id)}
                className="group cursor-pointer transition-all duration-300 hover:shadow-xl rounded-lg"
              >

                <div className="relative overflow-hidden rounded-lg mb-3">
                  <img
                    src={getImageUrl(story.image)}
                    alt={stripHtml(story.title)}
                    className="w-full h-56 md:h-72 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <h3 className="text-l md:text-xl font-bold text-gray-900 mb-3 leading-normal transition-colors group-hover:text-blue-600 line-clamp-3 ">
                  {stripHtml(story.title)}
                </h3>

              </div>
            ))}
          </div>
        )}

        {/* Diverse Small Cards */}
        {smallCards.length > 0 && (
          <div className="mb-12 md:mb-16">

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {smallCards.map(card => (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className="group cursor-pointer transition-all duration-300 hover:shadow-lg rounded-lg active:scale-95"
                >
                  <div className="relative overflow-hidden rounded-lg mb-3">
                    <img
                      src={getImageUrl(card.image)}
                      alt={stripHtml(card.title)}
                      className="w-full h-44 md:h-56 object-cover transition-transform duration-500 group-hover:scale-110 p-2"
                    />
                  </div>
                  <h4 className="text-sm md:text-base font-bold text-gray-900 leading-normal mb-1 transition-colors group-hover:text-blue-900 p-2">
                    {stripHtml(card.title)}
                  </h4>

                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Stories Section */}
        {politicsStories.length > 0 && (
          <div className="mb-12 md:mb-20">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 md:mb-6 pb-3 border-b border-gray-300">
             
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
              <div 
                className="md:col-span-2 group cursor-pointer"
                onClick={() => handleCardClick(politicsStories[0].id)}
              >
                <h2 className="text-2xl md:text-4xl font-serif font-bold text-gray-900 mb-3 leading-tight transition-colors group-hover:text-blue-900">
                  {stripHtml(politicsStories[0].title)}
                </h2>
                {politicsStories[0].publishedDate && (
                  <p className="text-sm text-gray-500 mb-4 md:mb-6">
                    {getTimeAgo(politicsStories[0].publishedDate)}
                  </p>
                )}
                <div className="overflow-hidden rounded-xl mb-4 md:mb-6">
                  <img
                    src={getImageUrl(politicsStories[0].image)}
                    alt={stripHtml(politicsStories[0].title)}
                    className="w-full h-64 md:h-[500px] object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <p className="text-base md:text-2xl text-gray-600 line-clamp-2 md:line-clamp-2 leading-normal">
                  {stripHtml(politicsStories[0].subtitle || politicsStories[0].paragraph || '').substring(0, 300)}
                </p>
              </div>

              <div className="space-y-6 md:space-y-8 ">
                {politicsStories.slice(1).map(story => (
                  <div 
                    key={story.id} 
                    onClick={() => handleCardClick(story.id)}
                    className="group cursor-pointer flex gap-3  md:gap-4 border-b border-gray-200 pb-6 last:border-0 last:pb-0 transition-all hover:translate-x-1 active:scale-95"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base leading-normal md:text-l font-bold text-gray-900  transition-colors group-hover:text-blue-900  mb-2">
                        {stripHtml(story.title)}
                      </h4>
                      {(story.subtitle || story.paragraph) && (
                        <p className="text-sm text-gray-600 line-clamp-4 leading-normal">
                          {stripHtml(story.subtitle || story.paragraph || '')}
                        </p>
                      )}
                    </div>
                    <div className="overflow-hidden rounded-lg flex-shrink-0">
                      <img
                        src={getImageUrl(story.image)}
                        alt={stripHtml(story.title)}
                        className="w-24 h-24 md:w-32 md:h-32 object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Featured Gallery Carousel */}
        {carouselImages.length > 0 && (
          <div className="mb-12 md:mb-16">


            <div className="relative group">
              <div className="overflow-hidden rounded-xl shadow-lg">
                <div
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{
                    transform: `translateX(-${currentIndex * (100 / slidesToShow)}%)`
                  }}
                >
                  {carouselImages.map((image) => (
                    <div
                      key={image.id}
                      className={`flex-shrink-0 ${slidesToShow === 1 ? 'w-full' : 'w-1/3'} px-0 md:px-2`}
                      onClick={() => handleCardClick(image.id)}
                    >
                      <div className="relative overflow-hidden rounded-lg h-[300px] md:h-[450px] cursor-pointer bg-gray-900 group/item">
                        <img
                          src={getImageUrl(image.image)}
                          alt={stripHtml(image.title)}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                        />

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 md:p-8 pt-16 md:pt-20">
                          <h3 className="text-xl md:text-lg font-bold text-white leading-snug line-clamp-2 hover:text-blue-900 transition">

                            {stripHtml(image.title)}
                          </h3>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {carouselImages.length > slidesToShow && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                    className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-800 p-2 md:p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 z-10"
                    aria-label="Previous slide"
                  >
                    <svg className="w-5 h-5 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <button
                    onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                    className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-800 p-2 md:p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 z-10"
                    aria-label="Next slide"
                  >
                    <svg className="w-5 h-5 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}

              {carouselImages.length > slidesToShow && (
                <div className="flex justify-center mt-6 md:mt-10 space-x-2 md:space-x-3">
                  {Array.from({ length: Math.max(0, carouselImages.length - (slidesToShow - 1)) }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`transition-all duration-300 rounded-full ${
                        idx === currentIndex
                          ? 'bg-blue-600 w-8 md:w-12 h-2 md:h-3'
                          : 'bg-gray-300 w-2 md:w-3 h-2 md:h-3 hover:bg-gray-500'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        <PaginationControls 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        {/* Empty State */}
        {societyData.length === 0 && !loading && (
          <div className="text-center py-12 md:py-20 px-4">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 md:w-24 md:h-24 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-xl md:text-2xl font-semibold text-gray-600 mb-2">No society articles yet</h3>
            <p className="text-gray-500">Check back later for new content</p>
          </div>
        )}

      </div>
    </div>
  );
}

export default Society;