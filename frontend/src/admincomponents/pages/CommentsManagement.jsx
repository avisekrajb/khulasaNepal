import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Trash2, Eye, Search, X, Play, Mic, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import axiosInstance from '../../api/axios';

const API_URL = import.meta.env.VITE_API_URL;

const CommentsManagement = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComment, setSelectedComment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);
  const [filterType, setFilterType] = useState('all');

  const navigate = useNavigate();

  // Fetch comments
  const fetchComments = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/comments/admin/all?page=${page}&limit=20&type=${filterType}`);
      
      if (response.data.success) {
        setComments(response.data.data.comments);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotalComments(response.data.data.pagination.total);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  // Delete comment
  const deleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await axiosInstance.delete(`/api/comments/admin/${commentId}`);
      if (response.data.success) {
        // Refresh list
        fetchComments(currentPage);
        setShowDetailModal(false);
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    }
  };

  // View comment details
  const viewCommentDetails = (comment) => {
    setSelectedComment(comment);
    setShowDetailModal(true);
  };

  // Navigate to news article
  const navigateToNews = (newsId) => {
    if (newsId) {
      navigate(`/admin/local/edit/${newsId}`);
    }
  };

  // Filter comments by search
  const filteredComments = comments.filter(comment => {
    const search = searchTerm.toLowerCase();
    return (
      comment.userName?.toLowerCase().includes(search) ||
      comment.text?.toLowerCase().includes(search) ||
      comment.news?.title?.toLowerCase().includes(search)
    );
  });

  // Get comment type icon
  const getCommentTypeIcon = (type) => {
    switch (type) {
      case 'voice':
        return <Mic size={16} className="text-purple-500" />;
      case 'video':
        return <Play size={16} className="text-red-500" />;
      default:
        return <FileText size={16} className="text-blue-500" />;
    }
  };

  // Get comment type label
  const getCommentTypeLabel = (type) => {
    switch (type) {
      case 'voice':
        return 'Voice';
      case 'video':
        return 'Video';
      default:
        return 'Text';
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchComments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Comments Management</h1>
            <p className="text-gray-600 mt-1">Manage all comments across your website</p>
          </div>
          <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm">
            Total: {totalComments} comments
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, comment, or news title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="all">All Types</option>
                <option value="text">Text</option>
                <option value="voice">Voice</option>
                <option value="video">Video</option>
              </select>
            </div>
          </div>
        </div>

        {/* Comments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading comments...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No comments found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">News</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredComments.map((comment) => (
                      <tr key={comment.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-sm">
                              {comment.userName?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{comment.userName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-700 line-clamp-2 max-w-xs">
                            {comment.text || (comment.commentType === 'voice' ? '🎤 Voice message' : '🎥 Video message')}
                          </p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {getCommentTypeIcon(comment.commentType)}
                            {getCommentTypeLabel(comment.commentType)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => navigateToNews(comment.newsId)}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-left max-w-xs truncate block"
                          >
                            {comment.news?.title || `News #${comment.newsId}`}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">❤️ {comment.likes || 0}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {new Date(comment.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => viewCommentDetails(comment)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => deleteComment(comment.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * 20) + 1} - {Math.min(currentPage * 20, totalComments)} of {totalComments}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchComments(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="px-3 py-1 text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => fetchComments(currentPage + 1)}
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

      {/* Detail Modal */}
      {showDetailModal && selectedComment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Comment Details</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                  {selectedComment.userName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedComment.userName}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedComment.createdAt).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>

              {/* Comment Type */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Type:</span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                  {getCommentTypeIcon(selectedComment.commentType)}
                  {getCommentTypeLabel(selectedComment.commentType)}
                </span>
              </div>

              {/* Text Content */}
              {selectedComment.text && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-700">{selectedComment.text}</p>
                </div>
              )}

              {/* Voice Content */}
              {selectedComment.voiceUrl && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 mb-2">Voice Message:</p>
                  <audio controls className="w-full">
                    <source src={`${API_URL}${selectedComment.voiceUrl}`} />
                  </audio>
                </div>
              )}

              {/* Video Content */}
              {selectedComment.videoUrl && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-600 mb-2">Video Message:</p>
                  <video controls className="w-full rounded-lg max-h-64">
                    <source src={`${API_URL}${selectedComment.videoUrl}`} />
                  </video>
                </div>
              )}

              {/* News Info */}
              <div className="p-4 bg-blue-50 rounded-xl">
                <p className="text-sm font-medium text-gray-600">Related News:</p>
                <button
                  onClick={() => navigateToNews(selectedComment.newsId)}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium mt-1"
                >
                  {selectedComment.news?.title || `News #${selectedComment.newsId}`}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Category: {selectedComment.news?.category || 'N/A'}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-red-500">❤️</p>
                  <p className="text-sm text-gray-600">{selectedComment.likes || 0} Likes</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-blue-500">💬</p>
                  <p className="text-sm text-gray-600">{selectedComment.replyCount || 0} Replies</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-2xl font-bold text-green-500">📊</p>
                  <p className="text-sm text-gray-600">{selectedComment.commentType}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => deleteComment(selectedComment.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                >
                  <Trash2 size={18} className="inline mr-2" />
                  Delete Comment
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentsManagement;