import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, ArrowLeft, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import axiosInstance from '../api/axios';
import khulashaLogo from '../assets/image/khulashalogo.png';
import CommentSystem from '../components/comments/CommentSystem';
import { useTheme } from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL;

const MainDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [mixedNews, setMixedNews] = useState([]);

  useEffect(() => {
    fetchNewsDetail();
    window.scrollTo(0, 0);  
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchNewsDetail = async () => {
    try {
      setLoading(true);
      // Fetch main news detail
      const response = await axiosInstance.get(`/main/${id}`);
      setNews(response.data);
      
      // Fetch all main news for related articles
      const allMainResponse = await axiosInstance.get('/main');
      const related = allMainResponse.data
        .filter(item => item.id !== parseInt(id))
        .slice(0, 8);
      setRelatedNews(related);

      // Fetch all category news
      const [newsRes, societyRes, localRes, sportsRes, moreRes] = await Promise.all([
        axiosInstance.get('/news'),
        axiosInstance.get('/society'),
        axiosInstance.get('/local'),
        axiosInstance.get('/sports'),
        axiosInstance.get('/more')
      ]);

      // Tag each news with its category and combine all
      const taggedNews = [
        ...newsRes.data.map(item => ({ ...item, category: 'news', categoryNepali: 'समाचार' })),
        ...societyRes.data.map(item => ({ ...item, category: 'society', categoryNepali: 'समाज' })),
        ...localRes.data.map(item => ({ ...item, category: 'local', categoryNepali: 'स्थानीय' })),
        ...sportsRes.data.map(item => ({ ...item, category: 'sports', categoryNepali: 'खेलकुद' })),
        ...moreRes.data.map(item => ({ ...item, category: 'more', categoryNepali: 'थप' }))
      ];

      // Shuffle and get random 18 articles from all categories
      const shuffled = shuffleArray(taggedNews).slice(0, 18);
      setMixedNews(shuffled);
      
      setError(null);
    } catch (err) {
      setError('मुख्य समाचार विवरण लोड गर्न असफल भयो');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Shuffle array helper function
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const publishedDate = new Date(date);
    const diffInMs = now - publishedDate;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInDays === 0) {
      if (diffInHours === 0) return 'भर्खरै';
      return `${diffInHours} घण्टा अघि`;
    }
    if (diffInDays === 1) return '१ दिन अघि';
    if (diffInDays < 7) return `${diffInDays} दिन अघि`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} हप्ता अघि`;
    return `${Math.floor(diffInDays / 30)} महिना अघि`;
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = news?.title || '';
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    };
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const navigateToArticle = (item) => {
    navigate(`/${item.category}/${item.id}`);
  };

  const getImageUrl = (image) => {
    if (!image) return 'https://images.unsplash.com/photo-1504711434969-e338f2762819?w=600';
    return image.startsWith('http') ? image : `${API_URL}${image}`;
  };

  const getCategoryColor = (category) => {
    const colors = {
      news: 'bg-blue-600',
      society: 'bg-green-600',
      local: 'bg-purple-600',
      sports: 'bg-red-600',
      more: 'bg-orange-600'
    };
    return colors[category] || 'bg-gray-600';
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>समाचार विवरण लोड हुँदैछ...</p>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error || 'समाचार फेला परेन'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <article className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
              {/* Featured Image */}
              {news.image && (
                <img
                  src={getImageUrl(news.image)}
                  alt={news.title}
                  className="w-full h-96 object-cover"
                />
              )}

              <div className="p-8">
                {/* Title */}
                <h1 className={`text-4xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-4 leading-tight`}>
                  {news.title}
                </h1>

                {/* Subtitle */}
                {news.subtitle && (
                  <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6 leading-relaxed`}>
                    {news.subtitle}
                  </p>
                )}

                {/* Meta Information */}
                <div className={`flex flex-wrap items-center gap-6 pb-6 mb-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  {/* Author Info */}
                  <div className="flex items-center gap-3">
                    <img
                      src={news.journalistImage 
                        ? getImageUrl(news.journalistImage)
                        : khulashaLogo
                      }
                      alt={news.journalistName || "Khulasha Nepal"}
                      className={news.journalistImage 
                        ? `w-8 h-8 rounded-full object-cover border-2 ${isDark ? 'border-gray-600' : 'border-gray-200'}` 
                        : "w-9 h-9 object-contain"
                      }
                    />
                    <div>
                      <p className={`${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{news.journalistName || 'खुलासा नेपाल'}</p>
                    </div>
                  </div>

                  {/* Time Ago */}
                  <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    <Clock size={18} />
                    <span>{getTimeAgo(news.publishedDate)}</span>
                  </div>
                </div>

                {/* Share Buttons */}
                <div className="flex items-center gap-4 mb-8">
                  <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} font-medium`}>साझेदारी गर्नुहोस्:</span>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    title="फेसबुकमा साझेदारी गर्नुहोस्"
                  >
                    <Facebook size={20} />
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
                    title="ट्विटरमा साझेदारी गर्नुहोस्"
                  >
                    <Twitter size={20} />
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="p-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition"
                    title="लिंकडइनमा साझेदारी गर्नुहोस्"
                  >
                    <Linkedin size={20} />
                  </button>
                </div>

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
            <div className="sticky top-8 space-y-6">
              {/* Related News */}
              {relatedNews.length > 0 && (
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                  <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>सम्बन्धित समाचार</h3>
                  <div className="space-y-6">
                    {relatedNews.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/main/${item.id}`)}
                        className="flex gap-4 cursor-pointer group"
                      >
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.title}
                          className="w-24 h-20 object-cover rounded-lg group-hover:opacity-80 transition"
                        />
                        <div className="flex-1">
                          <p className={`font-semibold ${isDark ? 'text-gray-200' : 'text-gray-900'} group-hover:text-blue-600 transition line-clamp-2`}>
                            {item.title}
                          </p>
                          <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-1 block`}>
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

        {/* Mixed News from All Categories - Single Section */}
        {mixedNews.length > 0 && (
          <div className="mt-16">
            <section className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg p-8`}>
              <div className="mb-8">
                <h2 className={`text-3xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'} mb-2`}>थप समाचारहरू</h2>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>सबै श्रेणीबाट छनोट गरिएका समाचारहरू</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mixedNews.map((item) => (
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
                      {/* Category Badge */}
                      <div className={`absolute top-3 left-3 ${getCategoryColor(item.category)} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
                        {item.categoryNepali}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'} group-hover:text-blue-600 transition line-clamp-2 mb-2 text-lg`}>
                        {item.title}
                      </h3>
                      
                      {item.subtitle && (
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2 mb-3`}>
                          {item.subtitle}
                        </p>
                      )}
                      
                      <div className={`flex items-center justify-between text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        <div className="flex items-center gap-2">
                          {item.journalistImage && (
                            <img 
                              src={getImageUrl(item.journalistImage)} 
                              alt={item.journalistName}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          )}
                          <span className={`truncate ${isDark ? 'text-gray-400' : ''}`}>{item.journalistName}</span>
                        </div>
                        <span>{getTimeAgo(item.publishedDate)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainDetail;