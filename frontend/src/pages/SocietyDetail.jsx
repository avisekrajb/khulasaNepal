import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, ArrowLeft, Share2, Facebook, Twitter, Linkedin, MessageCircle, Share, } from 'lucide-react';
import axiosInstance from '../api/axios';
import khulashaLogo from '../assets/image/khulashalogo.png';
import { FaTiktok } from 'react-icons/fa';
import NepaliDate from 'nepali-date-converter';
import { CategoryBannerAd, SidebarAd, ArticleInlineAd } from '../components/ads/AdComponents';
import CommentSystem from '../components/comments/CommentSystem'; // ADDED

const API_URL = import.meta.env.VITE_API_URL;

const SocietyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [relatedArticles, setRelatedArticles] = useState([]);
  const [mixedNews, setMixedNews] = useState([]);
  const [loadedAds, setLoadedAds] = useState({
    top: false,
    middle: false,
    bottom: false
  });

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

  useEffect(() => {
    fetchArticleDetail();
    window.scrollTo(0, 0);
    
    // Reset ad tracking when article changes
    setLoadedAds({ top: false, middle: false, bottom: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchArticleDetail = async () => {
    try {
      setLoading(true);
      
      // Fetch society article detail
      const response = await axiosInstance.get(`/api/news/${id}`);
      // Extract article from response
      const articleData = response.data.success && response.data.data 
        ? response.data.data 
        : response.data;
      setArticle(articleData);
      
      // Fetch related articles and mixed news in parallel
      const [allArticlesResponse, mixedRes] = await Promise.all([
        axiosInstance.get('/api/news/category/society'),
        axiosInstance.get(`/api/news/mixed-feed/${id}?limit=28`)
      ]);
      
      // Extract array from allArticlesResponse
      const allArticlesData = allArticlesResponse.data.success && Array.isArray(allArticlesResponse.data.data)
        ? allArticlesResponse.data.data
        : Array.isArray(allArticlesResponse.data)
          ? allArticlesResponse.data
          : [];
      
      // Related articles (same category only)
      const related = allArticlesData
        .filter(item => item.id !== parseInt(id))
        .slice(0, 8);
      setRelatedArticles(related);
      
      // Extract array from mixedRes
      const mixedData = mixedRes.data.success && Array.isArray(mixedRes.data.data)
        ? mixedRes.data.data
        : Array.isArray(mixedRes.data)
          ? mixedRes.data
          : [];
      
      setMixedNews(mixedData);
      
      setError(null);
    } catch (err) {
      setError('Failed to load article details');
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  const handleShare = (platform) => {
    const url = window.location.href;
    const title = article?.title || '';
    
    let shareUrl = '';
    let useClipboard = false;

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + '\n\n' + url)}`;
        break;
      case 'viber':
        shareUrl = `viber://forward?text=${encodeURIComponent(title + '\n\n' + url)}`;
        break;
      case 'tiktok':
        shareUrl = `https://www.tiktok.com/share?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
        break;
      case 'share': 
        useClipboard = true;
        break;
      default:
        return;
    }

    if (useClipboard) {
      // Copy to clipboard
      navigator.clipboard.writeText(url)
        .then(() => {
          alert('लिङ्क क्लिपबोर्डमा कपी गरियो!'); 
          // Optional: You can also try Web Share API first
          if (navigator.share) {
            navigator.share({
              title: title,
              text: title,
              url: url
            }).catch(err => {
              console.log('Web Share failed:', err);
            });
          }
        })
        .catch(err => {
          console.error('Failed to copy:', err);
          alert('लिङ्क कपी गर्न सकिएन। कृपया म्यानुअल रूपमा कपी गर्नुहोस्।');
        });
    } else if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=500,noreferrer');
    }
  };

  const navigateToArticle = (item) => {
    navigate(`/${item.category}/${item.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading article details...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error || 'Article not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CategoryBannerAd position="category-banner" page="article" category="society" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Share Buttons */}
              <div className="flex items-center gap-4 mb-5 mt-5 mx-auto w-fit">
                <span className="text-gray-600 font-medium">सेयर:</span>
                <button
                  onClick={() => handleShare('facebook')}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  title="Share on Facebook"
                >
                  <Facebook size={20} />
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition"
                  title="Share on Twitter"
                >
                  <Twitter size={20} />
                </button>
                <button
                  onClick={() => handleShare('whatsapp')}
                  className="p-2 text-white bg-green-500 rounded-lg hover:bg-green-800 transition"
                  title="share on Whatsapp"
                >
                  <MessageCircle size={20}/>
                </button>
                <button
                  onClick={() => handleShare('viber')}
                  className="p-2 text-white bg-purple-500 rounded-lg hover:bg-purple-800 transition"
                  title="share on viber"
                >
                  <MessageCircle size={20}/>
                </button>
                <button
                  onClick={() => handleShare('tiktok')}
                  className="p-2 bg-gray-900 text-white rounded-lg"
                  title="share on tiktok"
                >
                  <FaTiktok size={20}/>
                </button>
                <button
                  onClick={() => handleShare('share')}
                  className="p-2 bg-gray-300 text-black-950 hover:bg-gray-600 transition rounded-lg"
                  title="share"
                >
                  <Share size={20}/>
                </button>
              </div>

              <div className="p-8">
                {/* Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-normal md:text-4xl">
                  {article.title}
                </h1>

                {/* Subtitle */}
                {article.subtitle && (
                  <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                    {article.subtitle}
                  </p>
                )}

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-6 pb-6 mb-6 border-b border-gray-200 mx-auto w-fit">
                  {/* Author Info */}
                  <div className="flex items-center gap-3">
                    <img
                      src={article.journalistImage 
                        ? getImageUrl(article.journalistImage)
                        : khulashaLogo
                      }
                      alt={article.journalistName || "Khulasha Nepal"}
                      className={article.journalistImage 
                        ? "w-8 h-8 rounded-full object-cover border border-blue-600 border-3" 
                        : "w-9 h-9 object-contain rounded-full object-contain border border-blue-600 border-3"
                      }
                    />
                    <div>
                      <p className="text-gray-900">{article.journalistName || 'खुलासा नेपाल'}</p>
                    </div>
                  </div>

                  {/* Time Ago */}
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={18} />
                    <span>{getTimeAgo(article.publishedDate)}</span>
                  </div>
                </div>

                {/* Featured Image */}
                {article.image && (
                  <img
                    src={getImageUrl(article.image)}
                    alt={article.title}
                    className="w-full h-96 object-cover"
                  />
                )}

                {/* Content */}
                {article.paragraph && (
                  <div 
                    className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: article.paragraph }}
                  />
                )}

                {/* ============================================ */}
                {/* COMMENT SYSTEM - ADDED HERE */}
                {/* ============================================ */}
                <div className="mt-12 pt-8 border-t-2 border-gray-200">
                  <CommentSystem newsId={id} />
                </div>
                {/* ============================================ */}

              </div>
            </article>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky lg:top-24 space-y-6">
              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">सम्बन्धित लेखहरू</h3>
                  <div className="space-y-6">
                    {relatedArticles.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => navigate(`/society/${item.id}`)}
                        className="flex gap-4 cursor-pointer group"
                      >
                        <img
                          src={getImageUrl(item.image)}
                          alt={item.title}
                          className="w-24 h-20 object-cover rounded-lg group-hover:opacity-80 transition"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition line-clamp-2">
                            {item.title}
                          </p>
                          <span className="text-sm text-gray-500 mt-1 block">
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

        {/* Mixed News from All Categories */}
        {mixedNews.length > 0 && (
          <div className="mt-16">
            <section className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
              <div className="flex gap-8">
                {/* Main Content */}
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 mb-8 pb-3 border-b-2 border-blue-600">थप समाचारहरू</h2>
                  
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
                            src={getImageUrl(item.image)}
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
                            src={getImageUrl(item.image)}
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
                    
                    {/* First Ad */}
                    <div className="md:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-top" 
                        page="article" 
                        category="society"
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
                            src={getImageUrl(item.image)}
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

                    {/* Second Ad */}
                    <div className="md:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-middle" 
                        page="article" 
                        category="society"
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
                            src={getImageUrl(item.image)}
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

                    {/* Third Ad at bottom */}
                    <div className="md:col-span-2 bg-white rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-bottom" 
                        page="article" 
                        category="society"
                        onLoad={() => handleAdLoaded('bottom')}
                      />
                    </div>
                  </div>
                </div>

                {/* Sticky Sidebar - Ads & Extra News */}
                <aside className="hidden xl:block w-72 sidebar-ads">
                  <div className="sticky top-28 space-y-4">
                    {/* Ad Slots */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-top" 
                        page="article" 
                        category="society"
                        onLoad={() => handleAdLoaded('top')}
                      />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-middle" 
                        page="article" 
                        category="society"
                        onLoad={() => handleAdLoaded('middle')}
                      />
                    </div>

                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <ArticleInlineAd 
                        position="article-bottom" 
                        page="article" 
                        category="society"
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

                    {/* Related Society Articles - Show as fallback */}
                    {relatedArticles.length > 0 && mixedNews.length <= 21 && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-4">
                        <h3 className="text-lg font-bold mb-4 text-gray-900 pb-2 border-b border-blue-200">
                          सम्बन्धित लेखहरू
                        </h3>
                        <div className="space-y-3">
                          {relatedArticles.slice(0, 7).map((item, idx) => (
                            <div
                              key={item.id}
                              onClick={() => navigate(`/society/${item.id}`)}
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
};

export default SocietyDetail;