import { Calendar, Clock, Grid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { useCache } from '../utils/useCache';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import NepaliDate from 'nepali-date-converter';
import { CategoryBannerAd, SidebarAd } from '../components/ads/AdComponents'; 
const API_URL = import.meta.env.VITE_API_URL 
function CategoryPage() {
  const { category } = useParams(); // Get category from URL
  const navigate = useNavigate();
const [viewMode, setViewMode] = useState('list');
const [currentPage, setCurrentPage] = useState(1);

const { data: newsData, loading, error, refresh } = useCache(
  `category-${category}`,
  async () => {
    const response = await axiosInstance.get(`/api/news/category/${category}`);
    
    if (response.data.success) {
      return {
        articles: Array.isArray(response.data.data) ? response.data.data : [],
        categoryMeta: response.data.category
      };
    } else {
      throw new Error('No articles found for this category');
    }
  },
  5 * 60 * 1000 // 5 minutes cache
);

const newsList = newsData?.articles || [];
  const postsPerPage = 12;

  const categoryMeta = newsData?.categoryMeta || null;



  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
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

  // Prepare featured slides
  const featuredSlides = newsList.slice(0, 4).map(news => ({
    id: news.id,
    title: news.title,
    excerpt: news.subtitle || stripHtml(news.paragraph)?.substring(0, 100) + '' || '',
    image: news.image?.startsWith('http') ? news.image : `${API_URL}${news.image}`
  }));

  const trendingPosts = newsList.slice(0, 3);
  const popularPosts = newsList.slice(3, 6);
  
  // Pagination
  const totalPages = Math.ceil(newsList.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = newsList.slice(indexOfFirstPost, indexOfLastPost);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">Loading {category}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 text-lg sm:text-xl mb-4">{error}</p>
          <button 
  onClick={refresh}
  className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
>
  Retry
</button>
          <button 
            onClick={() => navigate('/')}
            className="ml-3 px-4 sm:px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm sm:text-base"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">


        {/* Featured Slider - Only show if there are articles */}
        {featuredSlides.length > 0 && (
          <section className="my-6 sm:my-8 md:my-12">
            <div className="relative rounded-xl sm:rounded-2xl overflow-hidden shadow-xl sm:shadow-2xl h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
              <Swiper
                modules={[Navigation, Pagination, Autoplay]}
                spaceBetween={0}
                slidesPerView={1}
                navigation={{
                  prevEl: '.swiper-button-prev-custom',
                  nextEl: '.swiper-button-next-custom',
                }}
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                loop={true}
                className="h-full w-full"
              >
                {featuredSlides.map((slide) => (
                  <SwiperSlide key={slide.id} onClick={() => navigate(`/${category}/${slide.id}`)}>
                    <div className="relative h-full w-full cursor-pointer">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-12 text-white">
                        <h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 leading-tight">
                          {slide.title}
                        </h2>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl opacity-90 max-w-3xl hidden sm:block line-clamp-2 md:line-clamp-none">
                          {slide.excerpt}
                        </p>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              <button
                className="swiper-button-prev-custom absolute left-2 sm:left-4 md:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white rounded-full p-2 sm:p-3 md:p-4 shadow-xl transition"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-800" />
              </button>
              <button
                className="swiper-button-next-custom absolute right-2 sm:right-4 md:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white rounded-full p-2 sm:p-3 md:p-4 shadow-xl transition"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-800" />
              </button>
            </div>
          </section>
        )}
 <CategoryBannerAd position="category-banner" page="category" category={category} />
        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:gap-10 pb-12 md:pb-16">
          <main className="lg:w-3/4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                नवीनतम {categoryMeta?.label || category}
              </h3>
              <div className="flex bg-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 sm:p-3 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow-md' : 'hover:bg-gray-300'}`}
                >
                  <List size={20} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 sm:p-3 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow-md' : 'hover:bg-gray-300'}`}
                >
                  <Grid size={20} />
                </button>
              </div>
            </div>

            {currentPosts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <p className="text-gray-500 text-lg">No articles found in this category yet.</p>
              </div>
            ) : (
              <>
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8' 
                    : 'space-y-6 sm:space-y-10'
                }>
                  {currentPosts.map((post) => (
                    <article
                      key={post.id}
                      onClick={() => navigate(`/${category}/${post.id}`)}
                      className={`bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group ${
                        viewMode === 'list' 
                          ? 'flex flex-row gap-3 sm:gap-6 lg:gap-8' 
                          : 'flex flex-col'
                      }`}
                    >
                      <div className={`relative overflow-hidden flex-shrink-0 ${
                        viewMode === 'list'
                          ? 'w-32 h-32 xs:w-40 xs:h-40 sm:w-64 sm:h-56 md:w-80 md:h-64 lg:w-96'
                          : 'w-full h-48 sm:h-56 md:h-64'
                      }`}>
                        <img
                          src={post.image?.startsWith('http') ? post.image : `${API_URL}${post.image}`}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      <div className={`flex-1 flex flex-col justify-between min-w-0 ${
                        viewMode === 'list' 
                          ? 'p-3 sm:p-6 lg:p-8' 
                          : 'p-4 sm:p-6'
                      }`}>
                        <div>
                          <h4 className={`font-bold mb-2 sm:mb-3 lg:mb-4 hover:text-blue-900 transition ${
                            viewMode === 'list' 
                              ? 'text-base sm:text-2xl lg:text-3xl line-clamp-2' 
                              : 'text-lg sm:text-xl line-clamp-2'
                          }`}>
                            {post.title}
                          </h4>
                          <p className={`text-gray-600 leading-relaxed ${
                            viewMode === 'list' 
                              ? 'text-xs sm:text-base lg:text-lg mb-2 sm:mb-4 lg:mb-6 line-clamp-2 sm:line-clamp-3' 
                              : 'text-sm sm:text-base mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3'
                          }`}>
                            {post.subtitle || stripHtml(post.paragraph)?.substring(0, viewMode === 'list' ? 200 : 120) + '...' || ''}
                          </p>
                        </div>
                        
                        <div className="flex flex-row items-center text-gray-500 gap-2 sm:gap-4 mt-auto text-xs sm:text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            <span className="truncate">
                              {new Date(post.publishedDate).toLocaleDateString('ne-NP', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {getTimeAgo(post.publishedDate)}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
                    <button
                      onClick={handlePrev}
                      disabled={currentPage === 1}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                    >
                      <ChevronLeft size={18} />
                      अघिल्लो
                    </button>

                    <div className="flex gap-2 flex-wrap justify-center">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg transition ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleNext}
                      disabled={currentPage === totalPages}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                    >
                      अर्को
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </main>

          {/* Sidebar */}
          <aside className="lg:w-1/4">
            <div className="lg:sticky lg:top-text-2xl sm:text-3xl md:text-4xl font-bold text-black space-y-6 md:space-y-8">
              {trendingPosts.length > 0 && (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-red-700">ट्रेन्डिङ</h3>
                  <ol className="space-y-4 sm:space-y-6">
                    {trendingPosts.map((post, index) => (
                      <li key={post.id} className="flex gap-3 sm:gap-4">
                        <span className="text-2xl sm:text-3xl font-extrabold text-gray-200">{index + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p 
                            className="font-semibold text-base sm:text-lg hover:text-blue-900 cursor-pointer transition line-clamp-2"
                            onClick={() => navigate(`/${category}/${post.id}`)}
                          >
                            {post.title}
                          </p>
                          <span className="text-xs sm:text-sm text-gray-500 mt-1 block">{getTimeAgo(post.publishedDate)}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {popularPosts.length > 0 && (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-red-700">लोकप्रिय</h3>
                  <div className="space-y-4 sm:space-y-6">
                    {popularPosts.map((post) => (
                      <div 
                        key={post.id} 
                        className="flex gap-3 sm:gap-4 cursor-pointer group"
                        onClick={() => navigate(`/${category}/${post.id}`)}
                      >
                        <img
                          src={post.image?.startsWith('http') ? post.image : `${API_URL}${post.image}`}
                          alt={post.title}
                          className="w-20 h-16 sm:w-24 sm:h-20 object-cover rounded-lg sm:rounded-xl flex-shrink-0"
                        />
                        <p className="font-medium text-sm sm:text-base group-hover:text-blue-900 transition line-clamp-3 flex-1 min-w-0">
                          {post.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default CategoryPage;