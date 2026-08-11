import React, { useState, useEffect } from 'react';
import {
  Eye, Calendar, Clock, TrendingUp, RefreshCw, BarChart3, Globe
} from 'lucide-react';
import axiosInstance from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const VisitStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isSuperAdmin = user?.role === 'superadmin';

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/api/visits/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load visit statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) fetchStats();
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⛔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only superadmins can view visit statistics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading visit statistics...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Visits', value: stats?.totalVisits ?? 0, icon: Globe, color: 'from-emerald-500 to-teal-600' },
    { label: "Today's Visits", value: stats?.todayVisits ?? 0, icon: Calendar, color: 'from-blue-500 to-blue-700' },
    { label: "Yesterday's Visits", value: stats?.yesterdayVisits ?? 0, icon: Clock, color: 'from-amber-500 to-orange-600' },
    { label: 'This Week', value: stats?.thisWeek ?? 0, icon: TrendingUp, color: 'from-rose-500 to-pink-600' },
  ];

  const daily = stats?.daily || [];
  const maxDaily = daily.length > 0 ? Math.max(...daily.map(d => d.count)) : 1;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Eye className="w-8 h-8 text-purple-600" />
              Visitor Statistics
            </h1>
            <p className="text-gray-600 mt-1">Track website visitors and page views</p>
          </div>
          <button
            onClick={fetchStats}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-xl shadow-md p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white text-opacity-90 text-sm font-medium">visits</span>
                </div>
                <h3 className="text-white text-opacity-90 text-sm font-medium mb-1">{card.label}</h3>
                <p className="text-4xl font-bold">{card.value.toLocaleString()}</p>
              </div>
            );
          })}
        </div>

        {/* Daily Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Daily Visits (Last 7 Days)
          </h2>
          {daily.length > 0 ? (
            <div className="flex items-end justify-between gap-2 sm:gap-4 h-48">
              {daily.map((day) => {
                const height = day.count > 0 ? Math.max((day.count / maxDaily) * 100, 4) : 0;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-semibold text-gray-700">{day.count.toLocaleString()}</span>
                    <div
                      className="w-full max-w-14 bg-gradient-to-t from-purple-600 to-indigo-400 rounded-t-lg transition-all duration-500"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-xs text-gray-500">{formatDate(day.date)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No visit data yet</p>
              <p className="text-gray-400 text-sm mt-1">Visits will appear here as users browse the site</p>
            </div>
          )}
        </div>

        {/* Daily Breakdown Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Daily Breakdown
            </h2>
          </div>
          {daily.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {daily.slice().reverse().map((day) => (
                <div key={day.date} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(day.date)}</p>
                      <p className="text-xs text-gray-500">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{day.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">No visit data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitStats;
