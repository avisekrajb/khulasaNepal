import React, { useState, useEffect } from 'react';
import {
  ScrollText, Search, Trash2, RefreshCw,
  FilePlus2, FileEdit, FileMinus2, LogIn, ChevronLeft, ChevronRight
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

const AdminLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  const isSuperAdmin = user?.role === 'superadmin';

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 20);
      if (actionFilter !== 'all') params.append('action', actionFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const response = await axiosInstance.get(`/api/admin-logs?${params.toString()}`);
      if (response.data.success) {
        setLogs(response.data.data.logs);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalLogs(response.data.data.pagination.total);
        setCurrentPage(page);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/api/admin-logs/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load log stats:', err);
    }
  };

  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      fetchLogs(1);
    }
  };

  const handlePurge = async () => {
    if (!window.confirm('Delete log entries older than 90 days? This cannot be undone.')) return;
    try {
      await axiosInstance.delete('/api/admin-logs/purge?days=90');
      fetchLogs(1);
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to purge logs');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⛔</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only superadmins can view admin activity logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ScrollText className="w-8 h-8 text-purple-600" />
              Admin Activity Logs
            </h1>
            <p className="text-gray-600 mt-1">Track all changes made by admins across the system</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchLogs(1)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              onClick={handlePurge}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
            >
              <Trash2 size={16} /> Purge Old Logs
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalLogs?.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-gray-500 font-medium">Today</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.todayLogs?.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-green-600 font-medium">Creates</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.createLogs?.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-blue-600 font-medium">Updates</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.updateLogs?.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-red-600 font-medium">Deletes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.deleteLogs?.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <p className="text-xs text-purple-600 font-medium">Active Admins</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.activeAdmins ?? '-'}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email, description, or entity ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading logs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <ScrollText size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No activity logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.map((log) => {
                      const style = ACTION_STYLES[log.action] || 'bg-gray-100 text-gray-700 border-gray-200';
                      const icon = ACTION_ICONS[log.action] || <ScrollText size={14} />;
                      let details = null;
                      if (log.details) {
                        try { details = JSON.parse(log.details); } catch { details = null; }
                      }
                      return (
                        <React.Fragment key={log.id}>
                          <tr
                            className="hover:bg-gray-50 transition cursor-pointer"
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-medium text-sm">
                                  {log.adminEmail?.[0]?.toUpperCase() || 'A'}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{log.adminEmail}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${style}`}>
                                {icon}
                                {log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-700">
                                {log.entityType}{log.entityId ? ` #${log.entityId}` : ''}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-700 line-clamp-2 max-w-md">{log.description || '-'}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-500">{formatDate(log.createdAt)}</span>
                            </td>
                          </tr>
                          {expandedId === log.id && details && (
                            <tr className="bg-gray-50">
                              <td colSpan="5" className="px-6 py-4">
                                <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-white border border-gray-200 rounded-lg p-3">
                                  {JSON.stringify(details, null, 2)}
                                </pre>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, totalLogs)} of {totalLogs}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchLogs(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => fetchLogs(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;
