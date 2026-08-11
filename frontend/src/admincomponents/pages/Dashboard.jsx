import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Newspaper, Users, Globe, MoreHorizontal, Trophy, MapPin, RefreshCw, TrendingUp, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const { getAuthHeaders } = useAuth();
  const [stats, setStats] = useState({
    news: 0,
    local: 0,
    society: 0,
    sports: 0,
    more: 0,
    totalArticles: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visitStats, setVisitStats] = useState(null);

  // Get auth headers from context (sessionStorage-backed)
  const headers = getAuthHeaders();

  const categories = [
    { name: 'News', key: 'news', color: 'blue', icon: Newspaper, label: 'समाचार' },
    { name: 'Local', key: 'local', color: 'emerald', icon: MapPin, label: 'स्थानीय' },
    { name: 'Society', key: 'society', color: 'purple', icon: Users, label: 'समाज' },
    { name: 'Sports', key: 'sports', color: 'orange', icon: Trophy, label: 'खेलखबर' },
    { name: 'More', key: 'more', color: 'pink', icon: MoreHorizontal, label: 'थप' }
  ];

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all news articles (they contain category field)
      const res = await fetch(`${API_URL}/api/news`, {
        headers: headers
      });

if (res.ok) {
  const response = await res.json();
  
  // ✅ Handle backend response format: { success: true, data: [...] } or just [...]
  const allArticles = Array.isArray(response.data) 
    ? response.data 
    : Array.isArray(response) 
      ? response 
      : [];
  
  console.log('✅ Dashboard loaded:', allArticles.length, 'articles');
  
  // Count articles by category
  const categoryCounts = {
    news: allArticles.filter(article => article.category === 'news').length,
    local: allArticles.filter(article => article.category === 'local').length,
    society: allArticles.filter(article => article.category === 'society').length,
    sports: allArticles.filter(article => article.category === 'sports').length,
    more: allArticles.filter(article => article.category === 'more').length,
    totalArticles: allArticles.length
  };

  setStats(categoryCounts);

  // Get recent activities - latest 6 articles
  const sortedArticles = allArticles
    .sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate))
    .slice(0, 6);
  
  setRecentActivities(sortedArticles);
} else {
  setError('Failed to fetch articles');
}
    } catch (err) {
      setError('Failed to load dashboard data. Please try refreshing.');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/visits/stats`, {
        headers: headers
      });
      if (res.ok) {
        const response = await res.json();
        if (response.success) {
          setVisitStats(response.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch visit stats:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchVisitStats();
    const interval = setInterval(fetchData, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTimeAgo = (date) => {
    const now = new Date();
    const published = new Date(date);
    const diffInMs = now - published;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return new Date(date).toLocaleDateString();
  };

  const getCategoryInfo = (categoryKey) => {
    return categories.find(cat => cat.key === categoryKey) || categories[0];
  };

  const getCategoryBadgeColor = (categoryKey) => {
    const colors = {
      news: 'bg-blue-100 text-blue-700 border-blue-200',
      local: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      society: 'bg-purple-100 text-purple-700 border-purple-200',
      sports: 'bg-orange-100 text-orange-700 border-orange-200',
      more: 'bg-pink-100 text-pink-700 border-pink-200'
    };
    return colors[categoryKey] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Error Message */}
      {error && (
        <div className="fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl bg-red-600 text-white font-medium animate-slide-in">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm hover:shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-${cat.color}-500 rounded-lg flex items-center justify-center shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-gray-500 text-sm font-medium">{cat.label}</span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{cat.name} Articles</h3>
                <p className="text-4xl font-bold text-gray-900">{stats[cat.key]}</p>
              </div>
            );
          })}

          {/* Total Articles Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-opacity-90 text-sm font-medium">Total</span>
            </div>
            <h3 className="text-white text-opacity-90 text-sm font-medium mb-1">Total Articles</h3>
            <p className="text-4xl font-bold">{stats.totalArticles}</p>
          </div>
        </div>

        {/* Visit Stats */}
        {visitStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-opacity-90 text-sm font-medium">All time</span>
              </div>
              <h3 className="text-white text-opacity-90 text-sm font-medium mb-1">Total Visits</h3>
              <p className="text-4xl font-bold">{visitStats.totalVisits.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-opacity-90 text-sm font-medium">Today</span>
              </div>
              <h3 className="text-white text-opacity-90 text-sm font-medium mb-1">Today's Visits</h3>
              <p className="text-4xl font-bold">{visitStats.todayVisits.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-opacity-90 text-sm font-medium">Yesterday</span>
              </div>
              <h3 className="text-white text-opacity-90 text-sm font-medium mb-1">Yesterday's Visits</h3>
              <p className="text-4xl font-bold">{visitStats.yesterdayVisits.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-opacity-90 text-sm font-medium">This week</span>
              </div>
              <h3 className="text-white text-opacity-90 text-sm font-medium mb-1">Weekly Visits</h3>
              <p className="text-4xl font-bold">{visitStats.thisWeek.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Recent Activities
            </h2>
            <p className="text-sm text-gray-600 mt-1">Latest published articles across all categories</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {recentActivities.length > 0 ? (
              recentActivities.map((article) => {
                const categoryInfo = getCategoryInfo(article.category);
                const CategoryIcon = categoryInfo.icon;
                
                return (
                  <div key={article.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Article Image */}
                      {article.image ? (
                        <img 
                          src={`${API_URL}${article.image}`} 
                          alt={article.title}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0 shadow-sm"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Newspaper className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Article Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                            {article.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getCategoryBadgeColor(article.category)}`}>
                            {categoryInfo.label}
                          </span>
                        </div>
                        
                        {article.subtitle && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{article.subtitle}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            {article.journalistImage ? (
                              <img 
                                src={`${API_URL}${article.journalistImage}`}
                                alt={article.journalistName}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                <Users className="w-3 h-3 text-gray-500" />
                              </div>
                            )}
                            <span className="font-medium text-gray-700">{article.journalistName || 'Unknown'}</span>
                          </div>
                          
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {getTimeAgo(article.publishedDate)}
                          </span>
                          
                          {article.isFeatured && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-medium">
                              ⭐ Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No recent activities</p>
                <p className="text-gray-400 text-sm mt-1">Articles will appear here once published</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Category Distribution</h2>
          <div className="space-y-4">
            {categories.map((cat) => {
              const percentage = stats.totalArticles > 0 
                ? Math.round((stats[cat.key] / stats.totalArticles) * 100) 
                : 0;
              
              return (
                <div key={cat.key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <cat.icon className={`w-4 h-4 text-${cat.color}-600`} />
                      <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats[cat.key]} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`bg-${cat.color}-500 h-2.5 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;