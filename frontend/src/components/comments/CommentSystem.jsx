import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Mic, Video, Send, X, ChevronDown, ChevronUp, User, Reply, Check, AlertCircle } from 'lucide-react';
import axiosInstance from '../../api/axios';

const API_URL = import.meta.env.VITE_API_URL;

// Mini Toast Component - Right Side
const MiniToast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === 'error';
  const bgColor = isError ? 'bg-red-500' : 'bg-blue-500';
  const icon = isError ? <AlertCircle size={14} /> : <Check size={14} />;

  return (
    <div className="fixed top-20 right-4 z-50 animate-slide-right">
      <div className={`${bgColor} text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 min-w-[180px] max-w-xs`}>
        <div className="flex-shrink-0">{icon}</div>
        <p className="text-xs font-medium flex-1">{message}</p>
        <button onClick={onClose} className="flex-shrink-0 hover:opacity-70 transition">
          <X size={12} />
        </button>
      </div>
    </div>
  );
};

const CommentSystem = ({ newsId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [commentText, setCommentText] = useState('');
  const [userName, setUserName] = useState('');
  const [commentType, setCommentType] = useState('text');
  const [voiceFile, setVoiceFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState(null);
  const [videoURL, setVideoURL] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [visibleReplies, setVisibleReplies] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [likedComments, setLikedComments] = useState({});
  const [toast, setToast] = useState(null);
  const [commentCount, setCommentCount] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const videoChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Load user name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('comment_user_name');
    if (savedName) {
      setUserName(savedName);
    }
  }, []);

  // Save user name to localStorage
  const saveUserName = (name) => {
    localStorage.setItem('comment_user_name', name);
    setUserName(name);
  };

  // Load liked comments from localStorage
  useEffect(() => {
    const savedLikes = localStorage.getItem(`liked_comments_${newsId}`);
    if (savedLikes) {
      try {
        setLikedComments(JSON.parse(savedLikes));
      } catch {
        setLikedComments({});
      }
    }
  }, [newsId]);

  // Show mini toast notification
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  // Get avatar color based on name
  const getAvatarColor = (name) => {
    if (!name) return '#6B7280';
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#73C6B6'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Fetch comments
  const fetchComments = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/comments/news/${newsId}`, {
        params: { page: pageNum, limit: 15 }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        if (pageNum === 1) {
          setComments(data.comments);
        } else {
          setComments(prev => [...prev, ...data.comments]);
        }
        setTotalPages(data.pagination.totalPages);
        setCommentCount(data.pagination.total);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      showToast('Failed to load comments', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load more comments
  const loadMoreComments = () => {
    if (page < totalPages) {
      fetchComments(page + 1);
    }
  };

  // Load replies for a comment
  const loadReplies = async (commentId) => {
    try {
      const response = await axiosInstance.get(`/api/comments/${commentId}/replies`, {
        params: { page: 1, limit: 8 }
      });
      
      if (response.data.success) {
        setVisibleReplies(prev => ({
          ...prev,
          [commentId]: {
            visible: true,
            replies: response.data.data.replies,
            total: response.data.data.pagination.total,
            page: 1
          }
        }));
      }
    } catch (error) {
      console.error('Error loading replies:', error);
      showToast('Failed to load replies', 'error');
    }
  };

  // Load more replies
  const loadMoreReplies = async (commentId) => {
    const current = visibleReplies[commentId];
    if (!current) return;

    try {
      const response = await axiosInstance.get(`/api/comments/${commentId}/replies`, {
        params: { page: current.page + 1, limit: 8 }
      });
      
      if (response.data.success) {
        setVisibleReplies(prev => ({
          ...prev,
          [commentId]: {
            ...current,
            replies: [...current.replies, ...response.data.data.replies],
            page: current.page + 1
          }
        }));
      }
    } catch (error) {
      console.error('Error loading more replies:', error);
      showToast('Failed to load more replies', 'error');
    }
  };

  // Toggle replies visibility
  const toggleReplies = (commentId) => {
    if (visibleReplies[commentId]?.visible) {
      setVisibleReplies(prev => ({
        ...prev,
        [commentId]: { ...prev[commentId], visible: false }
      }));
    } else {
      loadReplies(commentId);
    }
  };

  // Submit comment
  const submitComment = async (e) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }

    if (commentType === 'text' && !commentText.trim()) {
      showToast('Please write a comment', 'error');
      return;
    }

    if (commentType === 'voice' && !voiceFile && !audioURL) {
      showToast('Please record or upload a voice message', 'error');
      return;
    }

    if (commentType === 'video' && !videoFile && !videoURL) {
      showToast('Please record or upload a video', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('newsId', newsId);
      formData.append('userName', userName.trim());
      formData.append('commentType', commentType);

      if (replyingTo) {
        formData.append('parentId', replyingTo);
      }

      if (commentType === 'text') {
        formData.append('text', commentText.trim());
      } else if (commentType === 'voice' && voiceFile) {
        formData.append('voice', voiceFile);
      } else if (commentType === 'video' && videoFile) {
        formData.append('video', videoFile);
      }

      const response = await axiosInstance.post('/api/comments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        showToast(replyingTo ? 'Reply posted!' : 'Comment posted!', 'success');
        
        // Reset form
        setCommentText('');
        setVoiceFile(null);
        setVideoFile(null);
        setAudioURL(null);
        setVideoURL(null);
        setCommentType('text');
        setReplyingTo(null);
        
        // Refresh comments
        fetchComments(1);
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      showToast(error.response?.data?.message || 'Failed to post comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Like comment - one time per user
  const likeComment = async (commentId) => {
    if (likedComments[commentId]) {
      return;
    }

    try {
      const response = await axiosInstance.post(`/api/comments/${commentId}/like`);
      if (response.data.success) {
        // Update local state
        setComments(prev => prev.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, likes: comment.likes + 1 };
          }
          return comment;
        }));
        
        // Save liked status
        const updatedLikes = { ...likedComments, [commentId]: true };
        setLikedComments(updatedLikes);
        localStorage.setItem(`liked_comments_${newsId}`, JSON.stringify(updatedLikes));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      showToast('Failed to like comment', 'error');
    }
  };

  // Start voice recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setVoiceFile(audioFile);
        setAudioURL(URL.createObjectURL(audioBlob));
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      const timer = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 20) {
            clearInterval(timer);
            stopVoiceRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting voice recording:', error);
      showToast('Microphone access denied', 'error');
    }
  };

  // Stop voice recording
  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  // Start video recording
  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        videoChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const videoFile = new File([videoBlob], `video-${Date.now()}.webm`, { type: 'video/webm' });
        setVideoFile(videoFile);
        setVideoURL(URL.createObjectURL(videoBlob));
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      const timer = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 15) {
            clearInterval(timer);
            stopVideoRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting video recording:', error);
      showToast('Camera access denied', 'error');
    }
  };

  // Stop video recording
  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  // Handle file upload
  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'voice') {
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be < 10MB', 'error');
        return;
      }
      setVoiceFile(file);
      setAudioURL(URL.createObjectURL(file));
    } else if (type === 'video') {
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be < 10MB', 'error');
        return;
      }
      setVideoFile(file);
      setVideoURL(URL.createObjectURL(file));
    }
  };

  // Remove uploaded media
  const removeMedia = (type) => {
    if (type === 'voice') {
      setVoiceFile(null);
      setAudioURL(null);
      setCommentType('text');
    } else if (type === 'video') {
      setVideoFile(null);
      setVideoURL(null);
      setCommentType('text');
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reply to comment - only if not own comment
  const replyToComment = (commentId, userName) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment && comment.userName === userName) {
      showToast('Cannot reply to your own comment', 'error');
      return;
    }
    setReplyingTo(commentId);
    setCommentText(`@${userName} `);
    setTimeout(() => {
      document.querySelector('.comment-textarea')?.focus();
    }, 100);
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
    setCommentText(commentText.replace(/^@\w+\s/, ''));
  };

  // Initial fetch
  useEffect(() => {
    fetchComments(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsId]);

  return (
    <div className="comment-system w-full max-w-full">
      {/* Mini Toast Notifications - Right Side */}
      {toast && (
        <MiniToast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Comment Count Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Comments {commentCount > 0 && <span className="text-sm font-normal text-gray-500">({commentCount})</span>}
        </h3>
      </div>

      {/* Comment Box - Always Visible */}
      <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-800">
            {replyingTo ? 'Reply to Comment' : 'Add a Comment'}
          </h3>
          {replyingTo && (
            <button onClick={cancelReply} className="text-red-500 hover:text-red-600 font-medium text-xs">
              Cancel Reply
            </button>
          )}
        </div>

        <div className="p-4">
          <form onSubmit={submitComment} className="space-y-3">
            {/* Name Input - Show only if no name saved */}
            {!userName && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={userName}
                  onChange={(e) => saveUserName(e.target.value)}
                  maxLength={50}
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50 hover:bg-white"
                />
              </div>
            )}

            {/* Comment Input with Icons */}
            <div className="relative">
              <textarea
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setCommentText(e.target.value);
                  }
                }}
                maxLength={200}
                rows={2}
                className="comment-textarea w-full px-3 pr-36 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none bg-gray-50 hover:bg-white min-h-[56px] max-h-[100px]"
              />
              
              {/* Action Icons */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                <div className="flex items-center gap-0.5 bg-white rounded-lg border border-gray-200 px-1 py-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCommentType('text');
                      setVideoFile(null);
                      setVideoURL(null);
                      setVoiceFile(null);
                      setAudioURL(null);
                    }}
                    className={`p-1.5 rounded-md transition ${
                      commentType === 'text' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Text"
                  >
                    <MessageCircle size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCommentType('voice');
                      setVideoFile(null);
                      setVideoURL(null);
                    }}
                    className={`p-1.5 rounded-md transition ${
                      commentType === 'voice' 
                        ? 'bg-purple-100 text-purple-600' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Voice"
                  >
                    <Mic size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCommentType('video');
                      setVoiceFile(null);
                      setAudioURL(null);
                    }}
                    className={`p-1.5 rounded-md transition ${
                      commentType === 'video' 
                        ? 'bg-red-100 text-red-600' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                    title="Video"
                  >
                    <Video size={16} />
                  </button>
                </div>
                
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>

            {/* Character Count */}
            {commentType === 'text' && (
              <div className="text-right text-xs text-gray-400 -mt-1">
                {commentText.length}/200
              </div>
            )}

            {/* Voice/Video Recording Section */}
            {(commentType === 'voice' || commentType === 'video') && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                {commentType === 'voice' && !audioURL && !isRecording && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition"
                    >
                      <Mic size={16} />
                      <span>Record</span>
                    </button>
                    <span className="text-xs text-gray-400">or</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition"
                    >
                      Upload
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleFileUpload(e, 'voice')}
                      className="hidden"
                    />
                  </div>
                )}

                {commentType === 'video' && !videoURL && !isRecording && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={startVideoRecording}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 text-white text-sm font-medium rounded-lg hover:bg-purple-600 transition"
                    >
                      <Video size={16} />
                      <span>Record</span>
                    </button>
                    <span className="text-xs text-gray-400">or</span>
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition"
                    >
                      Upload
                    </button>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e, 'video')}
                      className="hidden"
                    />
                  </div>
                )}

                {isRecording && (
                  <div className="flex items-center gap-3 bg-red-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-red-600">{formatTime(recordingTime)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={commentType === 'voice' ? stopVoiceRecording : stopVideoRecording}
                      className="ml-auto p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {(audioURL || videoURL) && (
                  <div className="relative bg-white rounded-lg p-2 border border-gray-200">
                    {audioURL && (
                      <audio controls src={audioURL} className="w-full max-w-[200px] h-8" />
                    )}
                    {videoURL && (
                      <video controls src={videoURL} className="w-full max-w-[200px] rounded-lg max-h-[150px]" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(commentType)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Comments List */}
      <div className="comments-list space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle size={32} className="mx-auto text-blue-200 mb-2" />
            <p className="text-sm text-gray-400">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <>
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div 
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                    style={{ backgroundColor: getAvatarColor(comment.userName) }}
                  >
                    {getInitials(comment.userName)}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-800">{comment.userName}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Content */}
                    {comment.commentType === 'text' && comment.text && (
                      <p className="text-sm text-gray-700 mt-1 leading-relaxed">{comment.text}</p>
                    )}

                    {comment.commentType === 'voice' && comment.voiceUrl && (
                      <div className="mt-2">
                        <audio controls src={`${API_URL}${comment.voiceUrl}`} className="w-full max-w-[200px] h-8" />
                      </div>
                    )}

                    {comment.commentType === 'video' && comment.videoUrl && (
                      <div className="mt-2">
                        <video controls src={`${API_URL}${comment.videoUrl}`} className="w-full max-w-[250px] rounded-lg max-h-[180px]" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-2">
                      <button 
                        onClick={() => likeComment(comment.id)}
                        disabled={likedComments[comment.id]}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium transition ${
                          likedComments[comment.id] 
                            ? 'text-red-500' 
                            : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                        } px-2 py-1 rounded-lg`}
                      >
                        <Heart size={14} className={likedComments[comment.id] ? 'fill-red-500' : ''} />
                        <span>{comment.likes || 0}</span>
                      </button>
                      
                      <button 
                        onClick={() => replyToComment(comment.id, comment.userName)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition"
                      >
                        <Reply size={14} />
                        <span>Reply</span>
                      </button>
                    </div>

                    {/* Replies */}
                    {comment.totalReplies > 0 && (
                      <div className="mt-3 border-l-2 border-blue-400 pl-3">
                        <button 
                          onClick={() => toggleReplies(comment.id)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-lg transition"
                        >
                          {visibleReplies[comment.id]?.visible ? (
                            <><ChevronUp size={14} /> Hide replies ({comment.totalReplies})</>
                          ) : (
                            <><ChevronDown size={14} /> Show replies ({comment.totalReplies})</>
                          )}
                        </button>

                        {visibleReplies[comment.id]?.visible && (
                          <div className="mt-2 space-y-2">
                            {visibleReplies[comment.id].replies.map((reply) => (
                              <div key={reply.id} className="flex gap-2 bg-gray-50 rounded-lg p-3">
                                <div 
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
                                  style={{ backgroundColor: getAvatarColor(reply.userName) }}
                                >
                                  {getInitials(reply.userName)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-xs text-gray-700">{reply.userName}</span>
                                    <span className="text-[10px] text-gray-400">
                                      {new Date(reply.createdAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                  {reply.commentType === 'text' && reply.text && (
                                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{reply.text}</p>
                                  )}
                                  {reply.commentType === 'voice' && reply.voiceUrl && (
                                    <audio controls src={`${API_URL}${reply.voiceUrl}`} className="w-full max-w-[150px] h-6 mt-1" />
                                  )}
                                  {reply.commentType === 'video' && reply.videoUrl && (
                                    <video controls src={`${API_URL}${reply.videoUrl}`} className="w-full max-w-[150px] rounded-lg max-h-[100px] mt-1" />
                                  )}
                                </div>
                              </div>
                            ))}

                            {visibleReplies[comment.id].total > visibleReplies[comment.id].replies.length && (
                              <button 
                                onClick={() => loadMoreReplies(comment.id)}
                                className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-1 hover:bg-blue-50 rounded-lg transition"
                              >
                                Load more replies...
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Comments */}
            {page < totalPages && (
              <button 
                onClick={loadMoreComments}
                disabled={loading}
                className="w-full py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Load more comments'}
              </button>
            )}
          </>
        )}
      </div>

      {/* Animation Styles */}
      <style>{`
        @keyframes slide-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-right {
          animation: slide-right 0.3s ease;
        }
        .comment-textarea {
          transition: all 0.2s ease;
        }
        .comment-textarea:focus {
          background-color: white;
        }
      `}</style>
    </div>
  );
};

export default CommentSystem;