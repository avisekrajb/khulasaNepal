import React, { useState, useEffect } from 'react';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import khulashaLogo from '../assets/image/khulashalogo.png';
import NepaliDate from 'nepali-date-converter';
import { BannerAd, SidebarAd } from '../components/ads/AdComponents'; 
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL 

function MainHome({ news = [] }) {
  
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sidebarAds, setSidebarAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(true);
  
  // ============================================
  // FETCH ALL SIDEBAR ADS ONCE
  // ============================================
  useEffect(() => {
    const fetchSidebarAds = async () => {
      try {
        setAdsLoading(true);
        const positions = ['sidebar-top', 'sidebar-middle', 'sidebar-bottom'];
        const allAds = [];

        for (const position of positions) {
          const response = await fetch(`${API_URL}/api/ads/position/${position}?page=home`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.ads && data.ads.length > 0) {
              data.ads.forEach(ad => {
                allAds.push({
                  ...ad,
                  _position: position
                });
              });
            }
          }
        }

        const shuffled = allAds.sort(() => Math.random() - 0.5);
        setSidebarAds(shuffled);
        setAdsLoading(false);
      } catch (err) {
        console.error('Error fetching sidebar ads:', err);
        setAdsLoading(false);
      }
    };

    fetchSidebarAds();
  }, []);

  const navigateToArticle = (newsItem) => {
    const category = newsItem.category || 'news';
    navigate(`/${category}/${newsItem.id}`);
  };

  const getImageUrl = (image) => {
    if (!image) return 'https://images.unsplash.com/photo-1504711434969-e338f2762819?w=600';
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

  const nextSlide = () => {
    if (carouselNews.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % carouselNews.length);
    }
  };

  const prevSlide = () => {
    if (carouselNews.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + carouselNews.length) % carouselNews.length);
    }
  };

  const mainNewsData = news;

  const heroNews = mainNewsData.slice(0, 3);
  const trendingNews = mainNewsData.slice(3, 5);
  const cultureNews = mainNewsData[5];
  const sidebarNews = mainNewsData.slice(6, 11);
  const carouselNews = mainNewsData.slice(11);
  
  const hasAds = sidebarAds.length > 0 && !adsLoading;
  const totalAdsLoaded = sidebarAds.length;
  
  if (mainNewsData.length === 0) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-[1100px] mx-auto px-6 py-8">
          <div className="text-center py-20">
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-xl`}>कुनै मुख्य समाचार उपलब्ध छैन</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.8s ease-out forwards; }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Banner Ad - Full width with proper sizing */}
        <div className="mb-8">
          <BannerAd position="homepage-banner" page="home" />
        </div>

        {/* Main Content Grid - Professional Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-8">
            {/* Hero News Section */}
            {heroNews.length > 0 && (
              <div className="space-y-12 md:space-y-16 lg:space-y-20 mb-12">
                {heroNews.map((newsItem) => (
                  <article key={newsItem.id} className="w-full">
                    <div 
                      onClick={() => navigateToArticle(newsItem)}
                      className="cursor-pointer group"
                    >
                      {/* Title and Meta Above Photo */}
                      <div className="mb-6 text-center max-w-4xl mx-auto">
                        <h2 className={`text-4xl font-bold leading-normal mb-4 ${isDark ? 'text-gray-100' : 'text-gray-900'} group-hover:text-blue-600 transition-colors`}>
                          {newsItem.title}
                        </h2>
                        
                        <div className="flex flex-wrap items-center justify-center gap-4">
                          <div className="flex items-center gap-2">
                            <img
                              src={newsItem.journalistImage ? getImageUrl(newsItem.journalistImage) : khulashaLogo}
                              alt={newsItem.journalistName || "Khulasha Nepal"}
                              className="w-8 h-8 rounded-full object-cover border-2 border-blue-500 transition-all duration-300 hover:border-blue-600 hover:scale-105"
                            />
                            <span className={`text-base md:text-lg ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                              {newsItem.journalistName || "खुलासा नेपाल"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock size={18} className={`${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                            <span className={`text-base md:text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {getTimeAgo(newsItem.publishedDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Photo */}
                      <div className="relative rounded-xl overflow-hidden shadow-xl h-[350px] md:h-[450px] lg:h-[500px] mb-6">
                        <img 
                          src={getImageUrl(newsItem.image)} 
                          alt={newsItem.title} 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                        />
                      </div>
                      
                      {/* Subtitle and Excerpt */}
                      <div className="space-y-3 max-w-4xl mx-auto">
                        {newsItem.subtitle && (
                          <h3 className={`text-xl md:text-2xl font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'} leading-normal line-clamp-2`}>
                            {newsItem.subtitle}
                          </h3>
                        )}
                        {newsItem.paragraph && (
                          <p className={`text-lg md:text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-3 leading-normal`}>
                            {newsItem.paragraph
                              .replace(/<[^>]*>/g, '')
                              .replace(/&nbsp;/g, ' ')
                              .trim()
                              .split('\n')[0]
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Trending News */}
            {trendingNews.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {trendingNews.map((trending) => (
                  <article
                    key={trending.id} 
                    onClick={() => navigateToArticle(trending)}
                    className="group cursor-pointer"
                  >
                    <div className="relative rounded-xl overflow-hidden shadow-lg h-80 hover:shadow-2xl transition-all duration-300">
                      <img 
                        src={getImageUrl(trending.image)} 
                        alt={trending.title} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-lg md:text-xl font-semibold text-white line-clamp-3 group-hover:text-blue-300 transition-colors leading-tight">
                          {trending.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-sm text-gray-300">
                            {getTimeAgo(trending.publishedDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Culture / Featured */}
            {cultureNews && (
              <div className="mb-0">
                <article
                  onClick={() => navigateToArticle(cultureNews)}
                  className="relative rounded-xl overflow-hidden shadow-lg h-[450px] group cursor-pointer hover:shadow-2xl transition-all duration-300"
                >
                  <img 
                    src={getImageUrl(cultureNews.image)} 
                    alt={cultureNews.title} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <h2 className="text-2xl md:text-3xl font-bold leading-normal line-clamp-3 text-white group-hover:text-blue-300 transition-colors mb-4">
                      {cultureNews.title}
                    </h2>
                    
                    <div className="flex items-center gap-3">
                      {cultureNews.journalistImage && (
                        <img 
                          src={getImageUrl(cultureNews.journalistImage)} 
                          alt={cultureNews.journalistName}
                          className="w-10 h-10 rounded-full border-2 border-white object-cover"
                        />
                      )}
                      <span className="text-sm text-gray-200">
                        {getTimeAgo(cultureNews.publishedDate)}
                      </span>
                    </div>
                  </div>
                </article>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar with Ads and News */}
          <aside className="lg:col-span-4">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden sticky top-20 shadow-lg`}>
              <div className="p-5 space-y-5">
                {(!hasAds || totalAdsLoaded === 0) && (
                  <h3 className={`text-3xl font-bold leading-normal ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>थप समाचार</h3>
                )}

                {/* Sidebar Ad - Top */}
                <div className="w-full">
                  <SidebarAd 
                    position="sidebar-top" 
                    page="home" 
                    index={0} 
                  />
                </div>

                {/* News Items */}
                {sidebarNews.map((newsItem) => (
                  <article
                    key={newsItem.id}
                    onClick={() => navigateToArticle(newsItem)}
                    className={`group cursor-pointer ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} p-3 rounded-lg transition-all duration-200`}
                  >
                    <div className="flex gap-3">
                      <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                        <img
                          src={getImageUrl(newsItem.image)}
                          alt={newsItem.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'} line-clamp-3 group-hover:text-blue-600 transition-colors text-sm leading-normal mb-2`}>
                          {newsItem.title}
                        </h4>
                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} flex items-center gap-1`}>
                          <Clock size={12} />
                          {getTimeAgo(newsItem.publishedDate)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}

                {/* Sidebar Ad - Middle */}
                <div className="w-full my-4">
                  <SidebarAd 
                    position="sidebar-middle" 
                    page="home" 
                    index={0} 
                  />
                </div>

                {/* Sidebar Ad - Bottom */}
                <div className="w-full mt-4">
                  <SidebarAd 
                    position="sidebar-bottom" 
                    page="home" 
                    index={0} 
                  />
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Carousel Section */}
        {carouselNews.length > 0 && (
          <div className="mb-20">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl overflow-hidden shadow-2xl`}>
              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="relative">
                  <div className="overflow-hidden rounded-2xl">
                    {/* Mobile view - show 1 item at a time */}
                    <div className="md:hidden">
                      <div className="flex transition-transform duration-600 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                        {carouselNews.map((item) => (
                          <div key={item.id} className="w-full flex-shrink-0 px-3">
                            <div 
                              onClick={() => navigateToArticle(item)}
                              className="h-72 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer group relative"
                            >
                              <img src={getImageUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-xl flex items-end p-6">
                                <div>
                                  <p className="text-white font-bold text-lg line-clamp-3 leading-normal">{item.title}</p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <p className="text-xs text-gray-300">{getTimeAgo(item.publishedDate)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Desktop view - show 3 items at a time */}
                    <div className="hidden md:block">
                      <div className="flex transition-transform duration-600 ease-in-out" style={{ transform: `translateX(-${currentSlide * 33.333}%)` }}>
                        {carouselNews.map((item) => (
                          <div key={item.id} className="flex-shrink-0 px-3" style={{ width: "33.333%" }}>
                            <div 
                              onClick={() => navigateToArticle(item)}
                              className="h-72 rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer group relative"
                            >
                              <img src={getImageUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-xl flex items-end p-6">
                                <div>
                                  <p className="text-white font-bold text-s line-clamp-3">{item.title}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Navigation buttons */}
                  {carouselNews.length > 3 && (
                    <>
                      <button 
                        onClick={prevSlide} 
                        disabled={currentSlide === 0}
                        className="absolute left-5 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-90 transition-transform z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="text-gray-800" />
                      </button>
                      <button 
                        onClick={nextSlide} 
                        disabled={currentSlide >= carouselNews.length - 3}
                        className="absolute right-5 top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-90 transition-transform z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="text-gray-800" />
                      </button>
                    </>
                  )}

                  {/* Dot indicators */}
                  {carouselNews.length > 3 && (
                    <div className="flex justify-center gap-2 mt-6 mb-6">
                      {Array.from({ length: Math.max(0, carouselNews.length - 2) }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            currentSlide === index ? 'bg-gray-800 w-8' : 'bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MainHome;