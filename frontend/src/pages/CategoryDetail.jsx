import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, Eye, ArrowLeft, Share2 } from 'lucide-react';
import axiosInstance from '../api/axios';
import { CategoryBannerAd, SidebarAd, ArticleInlineAd } from '../components/ads/AdComponents'; 
import CommentSystem from '../components/comments/CommentSystem'; // ADDED

const API_URL = import.meta.env.VITE_API_URL;

function CategoryDetail() {
  const { category, id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [mixedNews, setMixedNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadedAds, setLoadedAds] = useState({
    top: false,
    middle: false,
    bottom: false
  });

  // Handler for when an ad loads - FIXED VERSION
  const handleAdLoaded = (position) => {
    setLoadedAds(prev => {
      const newState = {
        ...prev,
        [position]: true
      };
      console.log(`✅ Ad loaded: ${position}`, newState);
      return newState;
    });
  };

  // Check if all 3 ads are loaded
  const allAdsLoaded = loadedAds.top && loadedAds.middle && loadedAds.bottom;

  // Track ad loading status changes
  useEffect(() => {
    console.log('📊 Ad Loading Status:', loadedAds);
    console.log('✅ All Ads Loaded?', allAdsLoaded);
  }, [loadedAds, allAdsLoaded]);

  useEffect(() => {
    console.log('🔍 CategoryDetail Page Load:', {
      category: category,
      articleId: id,
      urlPath: window.location.pathname
    });
    
    fetchArticle();
    fetchRelatedArticles();
    fetchMixedNews();
    
    // Reset ad tracking when article changes
    setLoadedAds({ top: false, middle: false, bottom: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, category]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/news/${id}`);
      
      if (response.data.success) {
        setArticle(response.data.data);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching article:', err);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedArticles = async () => {
    try {
      const response = await axiosInstance.get(`/news/category/${category}?limit=6&excludeIds=${id}`);
      
      if (response.data.success) {
        setRelatedArticles(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching related articles:', err);
    }
  };

  const fetchMixedNews = async () => {
    try {
      const response = await axiosInstance.get(`/news/mixed-feed/${id}?limit=28`);
      
      if (response.data.success) {
        setMixedNews(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching mixed news:', err);
    }
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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.subtitle,
        url: window.location.href,
      }).catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const navigateToArticle = (item) => {
    navigate(`/${item.category}/${item.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error || 'Article not found'}</p>
          <button 
            onClick={() => navigate(`/${category}`)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to {category}
          </button>
        </div>
      </div>
    );
  }

  const imageUrl = article.image?.startsWith('http') 
    ? article.image 
    : `${API_URL}${article.image}`;
    
  const journalistImageUrl = article.journalistImage?.startsWith('http')
    ? article.journalistImage
    : article.journalistImage 
      ? `${API_URL}${article.journalistImage}`
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Banner Ad - Uses dynamic category */}
        <CategoryBannerAd 
          position="category-banner" 
          page="article"
          category={category} 
        />
        
        {/* Back Button */}
        <button
          onClick={() => navigate(`/${category}`)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition"
        >
          <ArrowLeft size={20} />
          <span>Back to {article.categoryMeta?.label || category}</span>
        </button>

        {/* Article Card */}
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Featured Image */}
          <div className="relative h-64 sm:h-96 md:h-[500px] overflow-hidden">
            <img
              src={imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            {article.categoryMeta && (
              <div className={`absolute top-4 left-4 px-4 py-2 bg-${article.categoryMeta.color}-600 text-white rounded-lg font-semibold`}>
                {article.categoryMeta.label}
              </div>
            )}
          </div>

          {/* Article Content */}
          <div className="p-6 sm:p-8 md:p-12">
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              {article.title}
            </h1>

            {/* Subtitle */}
            {article.subtitle && (
              <p className="text-xl sm:text-2xl text-gray-600 mb-6 leading-relaxed">
                {article.subtitle}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-gray-600 mb-8 pb-6 border-b">
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                <span>
                  {new Date(article.publishedDate).toLocaleDateString('ne-NP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock size={18} />
                <span>{getTimeAgo(article.publishedDate)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Eye size={18} />
                <span>{article.views || 0} views</span>
              </div>

              <button
                onClick={handleShare}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
              >
                <Share2 size={18} />
                Share
              </button>
            </div>

            {/* Journalist Info */}
            {article.journalistName && (
              <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-xl">
                {journalistImageUrl ? (
                  <img
                    src={journalistImageUrl}
                    alt={article.journalistName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {article.journalistName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Written by</p>
                  <p className="text-lg text-gray-900">{article.journalistName}</p>
                </div>
              </div>
            )}

            {/* Article Body */}
            <div 
              className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: article.paragraph }}
            />

            {/* ============================================ */}
            {/* COMMENT SYSTEM - ADDED HERE */}
            {/* ============================================ */}
            <div className="mt-12 pt-8 border-t-2 border-gray-200">
              <CommentSystem newsId={id} />
            </div>
            {/* ============================================ */}

          </div>
        </article>

        {/* Mixed News from All Categories */}
        {mixedNews.length > 0 && (
          <div className="mt-16">
            <section className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <div className="flex gap-8">
                {/* Main Content */}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-8 pb-3 border-b-2 border-blue-600">
                    More from {article.categoryMeta?.label || category}
                  </h2>
                  
                  {/* Desktop - Regular Grid */}
                  <div className="hidden xl:grid grid-cols-3 gap-6">
                    {mixedNews.slice(0, 21).map((item) => (
                      <div
                        key={`${item.category}-${item.id}`}
                        onClick={() => navigateToArticle(item)}
                        className="group cursor-pointer bg-gray-50 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300"
                      >
                        <div className="relative overflow-hidden h-48">
                          <img
                            src={item.image?.startsWith('http') ? item.image : `${API_URL}${item.image}`}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition line-clamp-3 mb-2">
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {item.subtitle}
                            </p>
                          )}
                          <span className="text-xs text-gray-500">{getTimeAgo(item.publishedDate)}</span>
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
                        className="group cursor-pointer bg-gray-50 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300"
                      >
                        <div className="relative overflow-hidden h-48">
                          <img
                            src={item.image?.startsWith('http') ? item.image : `${API_URL}${item.image}`}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition line-clamp-3 mb-2">
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {item.subtitle}
                            </p>
                          )}
                          <span className="text-xs text-gray-500">{getTimeAgo(item.publishedDate)}</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* First Ad - Dynamic page targeting */}
                    <div className="md:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-top" 
                        page="article"
                        category={category}
                        onLoad={() => handleAdLoaded('top')}
                      />
                    </div>

                    {mixedNews.slice(2, 4).map((item) => (
                      <div
                        key={`${item.category}-${item.id}`}
                        onClick={() => navigateToArticle(item)}
                        className="group cursor-pointer bg-gray-50 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300"
                      >
                        <div className="relative overflow-hidden h-48">
                          <img
                            src={item.image?.startsWith('http') ? item.image : `${API_URL}${item.image}`}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition line-clamp-3 mb-2">
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {item.subtitle}
                            </p>
                          )}
                          <span className="text-xs text-gray-500">{getTimeAgo(item.publishedDate)}</span>
                        </div>
                      </div>
                    ))}

                    {/* Second Ad - Dynamic page targeting */}
                    <div className="md:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-middle" 
                        page="article"
                        category={category}
                        onLoad={() => handleAdLoaded('middle')}
                      />
                    </div>

                    {mixedNews.slice(4, 21).map((item) => (
                      <div
                        key={`${item.category}-${item.id}`}
                        onClick={() => navigateToArticle(item)}
                        className="group cursor-pointer bg-gray-50 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300"
                      >
                        <div className="relative overflow-hidden h-48">
                          <img
                            src={item.image?.startsWith('http') ? item.image : `${API_URL}${item.image}`}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition line-clamp-3 mb-2">
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {item.subtitle}
                            </p>
                          )}
                          <span className="text-xs text-gray-500">{getTimeAgo(item.publishedDate)}</span>
                        </div>
                      </div>
                    ))}

                    {/* Third Ad - Dynamic page targeting */}
                    <div className="md:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-bottom" 
                        page="article"
                        category={category}
                        onLoad={() => handleAdLoaded('bottom')}
                      />
                    </div>
                  </div>
                </div>

                {/* Sticky Sidebar - Ads & Extra News */}
                <aside className="hidden xl:block w-72 sidebar-ads">
                  <div className="sticky top-28 space-y-4">
                    {/* Ad Slots - Dynamic page targeting */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-top" 
                        page="article"
                        category={category}
                        onLoad={() => handleAdLoaded('top')}
                      />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-middle" 
                        page="article"
                        category={category}
                        onLoad={() => handleAdLoaded('middle')}
                      />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-bottom" 
                        page="article"
                        category={category}
                        onLoad={() => handleAdLoaded('bottom')}
                      />
                    </div>

                    {/* Extra News - Show when mixedNews > 21 AND ads not loaded */}
                    {mixedNews.length > 21 && !allAdsLoaded && (
                      <div className="bg-white rounded-lg shadow-lg p-4">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 pb-2 border-b border-gray-200">
                          अन्य समाचार
                        </h3>
                        <div className="space-y-3">
                          {mixedNews.slice(21, 28).map((item) => (
                            <div
                              key={item.id}
                              onClick={() => navigateToArticle(item)}
                              className="cursor-pointer group hover:bg-gray-50 p-2 rounded-lg transition"
                            >
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition line-clamp-3 leading-relaxed">
                                {item.title}
                              </p>
                              <span className="text-xs text-gray-500 mt-1 block">
                                {getTimeAgo(item.publishedDate)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Related Articles - Show as fallback when no extra news */}
                    {relatedArticles.length > 0 && mixedNews.length <= 21 && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-4">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 pb-2 border-b border-blue-200">
                          सम्बन्धित समाचार
                        </h3>
                        <div className="space-y-3">
                          {relatedArticles.slice(0, 7).map((item, idx) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                navigate(`/${category}/${item.id}`);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="cursor-pointer group hover:bg-white p-2 rounded-lg transition"
                            >
                              <div className="flex gap-2">
                                <span className="text-blue-600 font-bold text-sm flex-shrink-0">{idx + 1}.</span>
                                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition line-clamp-2">
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
}

export default CategoryDetail;