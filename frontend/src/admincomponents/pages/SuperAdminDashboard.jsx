import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Users, Newspaper, MessageCircle, TrendingUp, Eye,
  ScrollText, RefreshCw, Calendar, Clock, Activity, FilePlus2,
  FileEdit, FileMinus2, LogIn, Megaphone, UserCheck, UserX
} from 'lucide-react';
import axiosInstance from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const ACTION_STYLES = {
  create: 'bg-green-100 text-green-700 border-green-200',
  update: 'bg-blue-100 text-blue-700 border-blue-200',
  delete: 'bg-red-100 text-red-700 border-red-200',
  login: 'bg-purple-100 text-purple-700 border-purple-200',
};

const ACTION_ICONS = {
  create: <FilePlus2 size={14} />,
  update: <FileEdit size={14} />,
  delete: <FileMinus2 size={14} />,
  login: <LogIn size={14} />,
};

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [userStats, setUserStats] = useState(null);
  const [logStats, setLogStats] = useState(null);
  const [visitStats, setVisitStats] = useState(null);
  const [articleStats, setArticleStats] = useState(null);
  const [commentStats, setCommentStats] = useState(null);
  const [adStats, setAdStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [roleBreakdown, setRoleBreakdown] = useState([]);

  const isSuperAdmin = user?.role === 'superadmin';

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, logsRes, visitsRes, commentsRes, adsRes] = await Promise.all([
        axiosInstance.get('/api/admin/stats'),
        axiosInstance.get('/api/admin-logs/stats'),
        axiosInstance.get('/api/visits/stats'),
        axiosInstance.get('/api/comments/admin/stats'),
        axiosInstance.get('/api/ads/stats/overview'),
      ]);

      if (usersRes.data.success) setUserStats(usersRes.data.stats);
      if (logsRes.data.success) setLogStats(logsRes.data.data);
      if (visitsRes.data.success) setVisitStats(visitsRes.data.data);
      if (commentsRes.data.success) setCommentStats(commentsRes.data.data);
      if (adsRes.data.success) setAdStats(adsRes.data.stats);

      // Articles
      const newsRes = await axiosInstance.get('/api/news');
      const articles = Array.isArray(newsRes.data.data)
        ? newsRes.data.data
        : Array.isArray(newsRes.data)
          ? newsRes.data
          : [];
      setArticleStats({
        totalArticles: articles.length,
        totalFeatured: articles.filter(a => a.isFeatured).length,
        published: articles.filter(a => a.status === 'published').length,
      });

      // Category distribution (bar chart)
      const categoryCounts = {};
      articles.forEach(a => {
        const cat = a.category || 'uncategorized';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      setCategoryBreakdown(
        Object.entries(categoryCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
      );

      // Role distribution (pie chart)
      if (usersRes.data.success) {
        const us = usersRes.data.stats;
        setRoleBreakdown([
          { name: 'Super Admins', value: Math.max(us.totalUsers - us.totalAdmins - us.totalJournalists, 0), color: '#ef4444' },
          { name: 'Admins', value: us.totalAdmins, color: '#8b5cf6' },
          { name: 'Journalists', value: us.totalJournalists, color: '#3b82f6' },
        ]);
      }

      // Recent activity
      const recentRes = await axiosInstance.get('/api/admin-logs?page=1&limit=8');
      if (recentRes.data.success) setRecentLogs(recentRes.data.data.logs || []);
    } catch (err) {
      console.error('Error loading superadmin dashboard:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) fetchAll();
  }, [isSuperAdmin]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⛔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only superadmins can access the superadmin dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading superadmin dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Users',
      value: userStats?.totalUsers ?? 0,
      sub: `${userStats?.activeUsers ?? 0} active`,
      icon: Users,
      color: 'from-blue-500 to-blue-700',
    },
    {
      label: 'Admins',
      value: userStats?.totalAdmins ?? 0,
      sub: 'administrators',
      icon: UserCheck,
      color: 'from-purple-500 to-purple-700',
    },
    {
      label: 'Journalists',
      value: userStats?.totalJournalists ?? 0,
      sub: 'contributors',
      icon: UserCheck,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Inactive Users',
      value: userStats?.inactiveUsers ?? 0,
      sub: 'deactivated',
      icon: UserX,
      color: 'from-rose-500 to-pink-600',
    },
    {
      label: 'Total Articles',
      value: articleStats?.totalArticles ?? 0,
      sub: `${articleStats?.totalFeatured ?? 0} featured`,
      icon: Newspaper,
      color: 'from-indigo-500 to-purple-600',
    },
    {
      label: 'Total Visits',
      value: visitStats?.totalVisits ?? 0,
      sub: `${visitStats?.todayVisits ?? 0} today`,
      icon: Eye,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Total Comments',
      value: commentStats?.totalComments ?? 0,
      sub: `${commentStats?.todayComments ?? 0} today`,
      icon: MessageCircle,
      color: 'from-amber-500 to-orange-600',
    },
    {
      label: 'Total Ads',
      value: adStats?.totalAds ?? 0,
      sub: `${adStats?.activeAds ?? 0} active`,
      icon: Megaphone,
      color: 'from-cyan-500 to-blue-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {error && (
        <div className="fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl bg-red-600 text-white font-medium">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <ShieldCheck className="w-8 h-8" />
                Super Admin Dashboard
              </h1>
              <p className="text-purple-200 mt-1">System-wide overview and activity monitoring</p>
            </div>
            <button
              onClick={fetchAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-purple-800 rounded-lg hover:bg-purple-100 transition-all font-medium shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-gray-500 text-sm font-medium">{card.sub}</span>
                </div>
                <h3 className="text-gray-600 text-sm font-medium mb-1">{card.label}</h3>
                <p className="text-4xl font-bold text-gray-900">
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Bar Chart: Articles per Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Newspaper className="w-5 h-5 text-indigo-600" />
              Articles by Category
            </h2>
            {categoryBreakdown.length === 0 ? (
              <p className="text-gray-500 text-sm">No article data available.</p>
            ) : (
              <div className="flex items-end justify-around gap-3 h-56 border-b border-gray-200 pb-2">
                {categoryBreakdown.map((cat) => {
                  const max = Math.max(...categoryBreakdown.map(c => c.count), 1);
                  const hPct = Math.max((cat.count / max) * 100, 4);
                  return (
                    <div key={cat.name} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                      <span className="text-sm font-bold text-gray-900">{cat.count}</span>
                      <div
                        className="w-full max-w-[3.5rem] bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-md transition-all duration-500"
                        style={{ height: `${hPct}%` }}
                        title={`${cat.name}: ${cat.count}`}
                      />
                      <span className="text-xs font-medium text-gray-600 capitalize truncate w-full text-center">{cat.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pie Chart: User Role Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-purple-600" />
              User Role Distribution
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <svg viewBox="0 0 42 42" className="w-48 h-48 -rotate-90" role="img" aria-label="User role distribution pie chart">
                {(() => {
                  const total = roleBreakdown.reduce((s, r) => s + r.value, 0);
                  if (total === 0) return <circle cx="21" cy="21" r="15.9" fill="#e5e7eb" />;
                  let cumulative = 0;
                  return roleBreakdown.filter(r => r.value > 0).map((r) => {
                    const start = (cumulative / total) * 360;
                    cumulative += r.value;
                    const end = (cumulative / total) * 360;
                    const x1 = 21 + 15.9 * Math.cos((start - 90) * Math.PI / 180);
                    const y1 = 21 + 15.9 * Math.sin((start - 90) * Math.PI / 180);
                    const x2 = 21 + 15.9 * Math.cos((end - 90) * Math.PI / 180);
                    const y2 = 21 + 15.9 * Math.sin((end - 90) * Math.PI / 180);
                    const large = (end - start) > 180 ? 1 : 0;
                    return (
                      <path
                        key={r.name}
                        d={`M21 21 L${x1} ${y1} A15.9 15.9 0 ${large} 1 ${x2} ${y2} Z`}
                        fill={r.color}
                        stroke="#fff"
                        strokeWidth="1"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="space-y-2">
                {roleBreakdown.map((r) => (
                  <div key={r.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-sm text-gray-700">{r.name}</span>
                    <span className="text-sm font-bold text-gray-900">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-purple-600" />
              Admin Activity
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span> Creates
                </span>
                <span className="text-2xl font-bold text-gray-900">{logStats?.createLogs ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span> Updates
                </span>
                <span className="text-2xl font-bold text-gray-900">{logStats?.updateLogs ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> Deletes
                </span>
                <span className="text-2xl font-bold text-gray-900">{logStats?.deleteLogs ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span> Logins
                </span>
                <span className="text-2xl font-bold text-gray-900">{logStats?.todayLogs ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Visit Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Eye className="w-5 h-5 text-emerald-600" />
              Visit Statistics
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" /> Today
                </span>
                <span className="text-2xl font-bold text-gray-900">{(visitStats?.todayVisits ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Clock className="w-4 h-4 text-gray-400" /> Yesterday
                </span>
                <span className="text-2xl font-bold text-gray-900">{(visitStats?.yesterdayVisits ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <TrendingUp className="w-4 h-4 text-gray-400" /> This Week
                </span>
                <span className="text-2xl font-bold text-gray-900">{(visitStats?.thisWeek ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <ScrollText className="w-4 h-4 text-gray-400" /> Total Logs
                </span>
                <span className="text-2xl font-bold text-gray-900">{logStats?.totalLogs ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Comments & Ads */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <MessageCircle className="w-5 h-5 text-amber-600" />
              Engagement
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <MessageCircle className="w-4 h-4 text-gray-400" /> Total Comments
                </span>
                <span className="text-2xl font-bold text-gray-900">{commentStats?.totalComments ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <Megaphone className="w-4 h-4 text-gray-400" /> Active Ads
                </span>
                <span className="text-2xl font-bold text-gray-900">{adStats?.activeAds ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <TrendingUp className="w-4 h-4 text-gray-400" /> Ad Impressions
                </span>
                <span className="text-2xl font-bold text-gray-900">{(adStats?.totalImpressions ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <ScrollText className="w-4 h-4 text-gray-400" /> Featured Articles
                </span>
                <span className="text-2xl font-bold text-gray-900">{articleStats?.totalFeatured ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Logs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-purple-600" />
              Recent Admin Activity
            </h2>
            <p className="text-sm text-gray-600 mt-1">Latest changes and logins across the system</p>
          </div>

          <div className="divide-y divide-gray-200">
            {recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-gray-700">
                        {log.adminEmail?.[0]?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            <span className="font-bold">{log.adminEmail}</span>{' '}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ml-2 ${ACTION_STYLES[log.action] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                            >
                              {ACTION_ICONS[log.action] || <Activity size={14} />}
                              {log.action}
                            </span>
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                          {log.entityType && (
                            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
                              {log.entityType}{log.entityId ? ` #${log.entityId}` : ''}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(log.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <ScrollText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">No activity logged yet</p>
                <p className="text-gray-400 text-sm mt-1">Admin actions will appear here once recorded</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
