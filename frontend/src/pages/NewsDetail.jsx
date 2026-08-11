import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Facebook, Twitter, MessageCircle, Share } from 'lucide-react';
import axiosInstance from '../api/axios';
import khulashaLogo from '../assets/image/khulashalogo.png';
import { FaTiktok } from 'react-icons/fa';
import NepaliDate from 'nepali-date-converter';
import { CategoryBannerAd, ArticleInlineAd } from '../components/ads/AdComponents';
import CommentSystem from '../components/comments/CommentSystem';
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL;

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  // State management
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [mixedNews, setMixedNews] = useState([]);
  const [trendingNews, setTrendingNews] = useState([]);
  const [loadedAds, setLoadedAds] = useState({
    top: false,
    middle: false,
    bottom: false
  });

  // Fetch data on mount and when ID changes
  useEffect(() => {
    fetchNewsDetail();
    fetchTrendingNews();
    window.scrollTo(0, 0);
    
    // Reset ad tracking when article changes
    setLoadedAds({ top: false, middle: false, bottom: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handler for when an ad loads
  const handleAdLoaded = (position) => {
    setLoadedAds(prev => ({
      ...prev,
      [position]: true
    }));
    console.log(`✅ Ad loaded: ${position}`, loadedAds);
  };

  // Check if all 3 ads are loaded
  const allAdsLoaded = loadedAds.top && loadedAds.middle && loadedAds.bottom;

  const fetchNewsDetail = async () => {
    try {
      setLoading(true);
      
      const response = await axiosInstance.get(`/api/news/${id}`);
      const newsData = response.data.success && response.data.data 
        ? response.data.data 
        : response.data;
      setNews(newsData);
      
      const [allNewsResponse, mixedRes] = await Promise.all([
        axiosInstance.get('/api/news/category/news'),
        axiosInstance.get(`/api/news/mixed-feed/${id}?limit=28`)
      ]);
      
      const allNewsData = allNewsResponse.data.success && Array.isArray(allNewsResponse.data.data)
        ? allNewsResponse.data.data
        : Array.isArray(allNewsResponse.data) ? allNewsResponse.data : [];
      
      const related = allNewsData
        .filter(item => item.id !== parseInt(id))
        .slice(0, 8);
      setRelatedNews(related);
      
      const mixedData = mixedRes.data.success && Array.isArray(mixedRes.data.data)
        ? mixedRes.data.data
        : Array.isArray(mixedRes.data) ? mixedRes.data : [];
      
      setMixedNews(mixedData);
      setError(null);
    } catch (err) {
      setError('समाचार लोड गर्न असफल भयो');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingNews = async () => {
    try {
      const response = await axiosInstance.get('/api/news/trending?limit=7');
      const trendingData = response.data.success && Array.isArray(response.data.data)
        ? response.data.data
        : Array.isArray(response.data) ? response.data : [];
      setTrendingNews(trendingData);
    } catch (err) {
      console.error('Failed to fetch trending news:', err);
      try {
        const fallbackResponse = await axiosInstance.get('/api/news?limit=7');
        const fallbackData = fallbackResponse.data.success && Array.isArray(fallbackResponse.data.data)
          ? fallbackResponse.data.data
          : Array.isArray(fallbackResponse.data) ? fallbackResponse.data : [];
        setTrendingNews(fallbackData);
      } catch (fallbackErr) {
        console.error('Fallback fetch also failed:', fallbackErr);
      }
    }
  };

  const toNepaliNumber = (num) => {
    const nepaliDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
    return num.toString().split('').map(digit => nepaliDigits[digit] || digit).join('');
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const published = new Date(dateString);
    const seconds = Math.floor((now - published) / 1000);

    if (seconds < 45) return "भर्खरै";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${toNepaliNumber(minutes)} मिनेट अघि`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${toNepaliNumber(hours)} घण्टा अघि`;
    }

    const nepaliMonths = ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत'];
    const nepaliDays = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'];

    const nepaliDate = new NepaliDate(published);
    const month = nepaliMonths[nepaliDate.getMonth()];
    const day = toNepaliNumber(nepaliDate.getDate());
    const dayOfWeek = nepaliDays[published.getDay()];

    let hours12 = published.getHours();
    const mins = published.getMinutes();
    const ampm = hours12 >= 12 ? 'अपराह्न' : 'पूर्वाह्न';
    hours12 = hours12 % 12 || 12;

    const formattedTime = `${toNepaliNumber(hours12)}:${toNepaliNumber(mins.toString().padStart(2, '0'))} ${ampm}`;
    return `${month} ${day} ${dayOfWeek}, ${formattedTime}`;
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = news?.title || 'Khulasha Nepal - समाचार';

    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(title + '\n\n' + url)}`,
      viber: `viber://forward?text=${encodeURIComponent(title + '\n\n' + url)}`,
      tiktok: `https://www.tiktok.com/share?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
    };

    if (platform === 'share') {
      navigator.clipboard.writeText(url)
        .then(() => {
          alert('लिङ्क क्लिपबोर्डमा कपी गरियो!');
          if (navigator.share) {
            navigator.share({ title, text: title, url }).catch(err => console.log('Web Share failed:', err));
          }
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          alert('लिङ्क कपी गर्न सकिएन।');
        });
    } else if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=500,noreferrer');
    }
  };

  const navigateToArticle = (item) => {
    navigate(`/${item.category}/${item.id}`);
  };

  const getImageUrl = (image) => {
    if (!image) return 'https://images.unsplash.com/photo-504711434969-e338f2762819?w=600';
    return image.startsWith('http') ? image : `${API_URL}${image}`;
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>समाचार लोड हुँदैछ...</p>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error || 'समाचार भेटिएन'}</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            गृहपृष्ठमा फर्कनुहोस्
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CategoryBannerAd position="category-banner" page="article" category="news" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <article className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
              {/* Share Buttons - Top */}
              <div className={`flex items-center justify-center gap-3 py-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium text-sm`}>सेयर गर्नुहोस्:</span>
                <button onClick={() => handleShare('facebook')} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition" title="Facebook">
                  <Facebook size={18} />
                </button>
                <button onClick={() => handleShare('twitter')} className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition" title="Twitter">
                  <Twitter size={18} />
                </button>
                <button onClick={() => handleShare('whatsapp')} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition" title="WhatsApp">
                  <MessageCircle size={18} />
                </button>
                <button onClick={() => handleShare('viber')} className="p-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition" title="Viber">
                  <MessageCircle size={18} />
                </button>
                <button onClick={() => handleShare('tiktok')} className="p-2 bg-gray-900 text-white rounded-lg hover:bg-black transition" title="TikTok">
                  <FaTiktok size={18} />
                </button>
                <button onClick={() => handleShare('share')} className={`p-2 ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded-lg transition`} title="Copy Link">
                  <Share size={18} />
                </button>
              </div>

              <div className="p-6 md:p-8 max-w-4xl mx-auto">
                {/* Title */}
                <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4 leading-tight`}>
                  {news.title}
                </h1>

                {/* Subtitle */}
                {news.subtitle && (
                  <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6 leading-relaxed`}>
                    {news.subtitle}
                  </p>
                )}

                {/* Meta Information */}
                <div className={`flex flex-wrap items-center gap-6 py-6 mb-6 border-y ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <img
                      src={news.journalistImage ? getImageUrl(news.journalistImage) : khulashaLogo}
                      alt={news.journalistName || "Khulasha Nepal"}
                      className={news.journalistImage 
                        ? "w-8 h-8 rounded-full object-cover ring-2 ring-blue-500" 
                        : "w-9 h-9 rounded-full object-contain ring-2 ring-blue-500"}
                    />
                    <div>
                      <p className={`${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{news.journalistName || 'खुलासा नेपाल'}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>पत्रकार</p>
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Clock size={18} />
                    <span className="text-sm">{getTimeAgo(news.publishedDate)}</span>
                  </div>
                </div>

                {/* Featured Image */}
                {news.image && (
                  <div className="mb-8 rounded-xl overflow-hidden">
                    <img
                      src={getImageUrl(news.image)}
                      alt={news.title}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                {news.paragraph && (
                  <div 
                    className={`prose prose-lg max-w-none ${isDark ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}
                    dangerouslySetInnerHTML={{ __html: news.paragraph }}
                  />
                )}

                {/* ============================================ */}
                {/* COMMENT SYSTEM - ADDED HERE */}
                {/* ============================================ */}
                <div className={`mt-12 pt-8 border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <CommentSystem newsId={id} />
                </div>
                {/* ============================================ */}

              </div>
            </article>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              {/* Related News */}
              {relatedNews.length > 0 && (
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                  <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-gray-200' : 'text-gray-900'} pb-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>सम्बन्धित समाचार</h3>
                  <div className="space-y-4">
                    {relatedNews.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/news/${item.id}`)}
                        className="flex gap-4 cursor-pointer group"
                      >
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.title}
                          className="w-24 h-20 object-cover rounded-lg group-hover:opacity-80 transition flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'} group-hover:text-blue-600 transition line-clamp-3`}>
                            {item.title}
                          </p>
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1 block`}>
                            {getTimeAgo(item.publishedDate)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* More News Section */}
        {mixedNews.length > 0 && (
          <div className="mt-16">
            <section className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6 md:p-8`}>
              <div className="flex gap-8">
                {/* Main Content */}
                <div className="flex-1">
                  <h2 className={`text-3xl font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'} mb-8 pb-3 border-b-2 border-blue-600`}>थप समाचारहरू</h2>
                  
                  {/* Desktop - Regular Grid */}
                  <div className="hidden xl:grid grid-cols-3 gap-6">
                    {mixedNews.slice(0, 21).map((item) => (
                      <div
                        key={`${item.category}-${item.id}`}
                        onClick={() => navigateToArticle(item)}
                        className={`group cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300`}
                      >
                        <div className="relative overflow-hidden h-48">
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'} group-hover:text-blue-600 transition line-clamp-3 mb-2`}>
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2 mb-3`}>
                              {item.subtitle}
                            </p>
                          )}
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{getTimeAgo(item.publishedDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Mobile/Tablet - Grid with Ads interspersed */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 xl:hidden">
                    {mixedNews.slice(0, 2).map((item) => (
                      <div
                        key={`${item.category}-${item.id}`}
                        onClick={() => navigateToArticle(item)}
                        className={`group cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300`}
                      >
                        <div className="relative overflow-hidden h-48">
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'} group-hover:text-blue-600 transition line-clamp-3 mb-2`}>
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2 mb-3`}>
                              {item.subtitle}
                            </p>
                          )}
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{getTimeAgo(item.publishedDate)}</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* First Ad */}
                    <div className="md:col-span-2 rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-top" 
                        page="article" 
                        category="news"
                        onLoad={() => handleAdLoaded('top')}
                      />
                    </div>

                    {mixedNews.slice(2, 4).map((item) => (
                      <div
                        key={`${item.category}-${item.id}`}
                        onClick={() => navigateToArticle(item)}
                        className={`group cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300`}
                      >
                        <div className="relative overflow-hidden h-48">
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'} group-hover:text-blue-600 transition line-clamp-3 mb-2`}>
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2 mb-3`}>
                              {item.subtitle}
                            </p>
                          )}
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{getTimeAgo(item.publishedDate)}</span>
                        </div>
                      </div>
                    ))}

                    {/* Second Ad */}
                    <div className="md:col-span-2 rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-middle" 
                        page="article" 
                        category="news"
                        onLoad={() => handleAdLoaded('middle')}
                      />
                    </div>

                    {mixedNews.slice(4, 21).map((item) => (
                      <div
                        key={`${item.category}-${item.id}`}
                        onClick={() => navigateToArticle(item)}
                        className={`group cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300`}
                      >
                        <div className="relative overflow-hidden h-48">
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'} group-hover:text-blue-600 transition line-clamp-3 mb-2`}>
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2 mb-3`}>
                              {item.subtitle}
                            </p>
                          )}
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{getTimeAgo(item.publishedDate)}</span>
                        </div>
                      </div>
                    ))}

                    {/* Third Ad at bottom */}
                    <div className="md:col-span-2 rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-bottom" 
                        page="article" 
                        category="news"
                        onLoad={() => handleAdLoaded('bottom')}
                      />
                    </div>
                  </div>
                </div>

                {/* Sticky Sidebar - Ads & Trending */}
                <aside className="hidden xl:block w-72 sidebar-ads">
                  <div className="sticky top-28 space-y-4">
                    {/* Ad Slots */}
                    <div className="rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-top" 
                        page="article" 
                        category="news"
                        onLoad={() => handleAdLoaded('top')}
                      />
                    </div>

                    <div className="rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-middle" 
                        page="article" 
                        category="news"
                        onLoad={() => handleAdLoaded('middle')}
                      />
                    </div>

                    <div className="rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-bottom" 
                        page="article" 
                        category="news"
                        onLoad={() => handleAdLoaded('bottom')}
                      />
                    </div>

                    {/* Extra News - Hide only when ALL 3 ads are loaded */}
                    {mixedNews.length > 21 && !allAdsLoaded && (
                      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-4`}>
                        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-900'} pb-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          अन्य समाचार
                        </h3>
                        <div className="space-y-3">
                          {mixedNews.slice(21, 28).map((item) => (
                            <div
                              key={item.id}
                              onClick={() => navigateToArticle(item)}
                              className={`cursor-pointer group ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} p-2 rounded-lg transition`}
                            >
                              <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'} group-hover:text-blue-600 transition line-clamp-3 leading-relaxed`}>
                                {item.title}
                              </p>
                              <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1 block`}>
                                {getTimeAgo(item.publishedDate)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trending - Only show if no extra news */}
                    {trendingNews.length > 0 && mixedNews.length <= 21 && (
                      <div className={`${isDark ? 'bg-gradient-to-br from-gray-800 to-gray-700' : 'bg-gradient-to-br from-blue-50 to-indigo-50'} rounded-lg shadow-lg p-4`}>
                        <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-gray-200' : 'text-gray-900'} pb-2 border-b ${isDark ? 'border-blue-800' : 'border-blue-200'}`}>
                          ट्रेन्डिङ समाचार
                        </h3>
                        <div className="space-y-3">
                          {trendingNews.map((item, idx) => (
                            <div
                              key={item.id}
                              onClick={() => navigate(`/news/${item.id}`)}
                              className={`cursor-pointer group ${isDark ? 'hover:bg-gray-700' : 'hover:bg-white'} p-2 rounded-lg transition`}
                            >
                              <div className="flex gap-2">
                                <span className="text-blue-600 font-bold text-sm flex-shrink-0">{idx + 1}.</span>
                                <p className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'} group-hover:text-blue-600 transition line-clamp-2`}>
                                  {item.title}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </aside>
                
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsDetail;