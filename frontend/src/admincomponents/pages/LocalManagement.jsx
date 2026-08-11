import React, { useState, useEffect, useRef } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Image as ImageIcon, User, Eye, Plus, ChevronLeft, ChevronRight,
  Save, X, Edit, Trash2, Search, Filter, Check, FileText, Loader as LoaderIcon
} from 'lucide-react';
import axiosInstance from '../../api/axios';
 
const API_URL = import.meta.env.VITE_API_URL 

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && value && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className={`border rounded-md overflow-hidden transition-all ${isFocused ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-300'}`}>
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1 text-xs sm:text-sm">
        <button type="button" onClick={() => execCommand('bold')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Bold">
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => execCommand('italic')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Italic">
          <Italic size={16} />
        </button>
        <button type="button" onClick={() => execCommand('underline')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Underline">
          <Underline size={16} />
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Bullet List">
          <List size={16} />
        </button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Numbered List">
          <ListOrdered size={16} />
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Align Left">
          <AlignLeft size={16} />
        </button>
        <button type="button" onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Align Center">
          <AlignCenter size={16} />
        </button>
        <button type="button" onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-gray-200 rounded text-gray-700" title="Align Right">
          <AlignRight size={16} />
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <select onChange={(e) => execCommand('fontSize', e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-xs bg-white" defaultValue="3">
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Huge</option>
        </select>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="p-4 min-h-[300px] max-h-[500px] overflow-y-auto focus:outline-none bg-white text-gray-900 text-base"
        data-placeholder={placeholder}
      />
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

const UnifiedNewsManagement = () => {
  const [newsList, setNewsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [formData, setFormData] = useState({
    newsImageFile: null,
    newsImagePreview: '',
    journalistImageFile: null,
    journalistImagePreview: '',
    title: '',
    subtitle: '',
    content: '',
    publishedDate: '',
    journalistName: '',
    category: '',
    isFeatured: false
  });
  const [editingId, setEditingId] = useState(null);
  const [viewingNews, setViewingNews] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedItems, setSelectedItems] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const itemsPerPage = 10;

  const newsFileRef = useRef(null);
  const journalistFileRef = useRef(null);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // ✅ Define fetchNews OUTSIDE useEffect so it can be called from anywhere
  const fetchNews = async () => {
    try {
      setLoadingNews(true);
      const response = await axiosInstance.get('/api/news');
      const articles = response.data?.data || response.data?.news || response.data || [];
      setNewsList(articles);
    } catch (error) {
      console.error('Error fetching news:', error);
      showToast('Failed to load articles', 'error');
      setNewsList([]);
    } finally {
      setLoadingNews(false);
    }
  };

  // Fetch news articles on mount
  useEffect(() => {
    fetchNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch active categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await axiosInstance.get('/api/categories');
        const activeCategories = response.data.categories || [];
        setCategories(activeCategories);

        if (activeCategories.length > 0 && !formData.category) {
          setFormData(prev => ({ ...prev, category: activeCategories[0].value }));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        showToast('Failed to load categories', 'error');
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleContentChange = (content) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleFileSelect = (file, type) => {
    if (file && file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      if (type === 'news') {
        setFormData(prev => ({ ...prev, newsImageFile: file, newsImagePreview: preview }));
      } else {
        setFormData(prev => ({ ...prev, journalistImageFile: file, journalistImagePreview: preview }));
      }
    } else {
      showToast('Please select a valid image file', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category) {
      showToast('Please select a category', 'error');
      return;
    }

    if (!formData.title.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }

    setLoadingNews(true);

    try {
      const formDataToSend = new FormData();

      if (formData.newsImageFile) {
        formDataToSend.append('image', formData.newsImageFile);
      }
      if (formData.journalistImageFile) {
        formDataToSend.append('journalistImage', formData.journalistImageFile);
      }

      formDataToSend.append('title', formData.title);
      formDataToSend.append('subtitle', formData.subtitle || '');
      formDataToSend.append('paragraph', formData.content || '');
      formDataToSend.append('journalistName', formData.journalistName || '');
      formDataToSend.append('publishedDate', formData.publishedDate || new Date().toISOString());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('isFeatured', formData.isFeatured);

      let response;
      
      if (editingId) {
        response = await axiosInstance.put(`/api/news/${editingId}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log('✅ Article updated:', response.data);
        showToast('Article updated successfully!', 'success');
      } else {
        response = await axiosInstance.post('/news', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log('✅ Article created:', response.data);
        showToast('Article published successfully!', 'success');
      }

      // ✅ Refresh the list after successful save
      await fetchNews();
      
      resetForm();
      setShowForm(false);
      setEditingId(null);

    } catch (error) {
      console.error('❌ Error:', error);
      console.log('❌ Error response:', error.response?.data);
      const message = error.response?.data?.message || 'Failed to save article';
      showToast(message, 'error');
    } finally {
      setLoadingNews(false);
    }
  };

  const handleEdit = (news) => {
    setEditingId(news.id);
    setFormData({
      newsImageFile: null,
      newsImagePreview: news.image ? `${API_URL}${news.image}` : '',
      journalistImageFile: null,
      journalistImagePreview: news.journalistImage ? `${API_URL}${news.journalistImage}` : '',
      title: news.title || '',
      subtitle: news.subtitle || '',
      content: news.paragraph || '',
      publishedDate: news.publishedDate ? new Date(news.publishedDate).toISOString().slice(0, 16) : '',
      journalistName: news.journalistName || '',
      category: news.category || categories[0]?.value || '',
      isFeatured: news.isFeatured || false
    });
    setShowForm(true);
    setViewingNews(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleView = (news) => {
    setViewingNews(news);
    setShowForm(false);
    setSelectedItems([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    setSelectedItems([id]);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await Promise.all(selectedItems.map(id => axiosInstance.delete(`/api/news/${id}`)));
      await fetchNews(); // ✅ Refresh list after deletion
      showToast(`${selectedItems.length} article(s) deleted successfully!`);
    } catch (error) {
      console.error('Error deleting articles:', error);
      showToast('Failed to delete articles', 'error');
    }
    setSelectedItems([]);
    setShowDeleteConfirm(false);
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === currentNews.length && currentNews.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(currentNews.map(item => item.id));
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      newsImageFile: null,
      newsImagePreview: '',
      journalistImageFile: null,
      journalistImagePreview: '',
      title: '',
      subtitle: '',
      content: '',
      publishedDate: '',
      journalistName: '',
      category: categories[0]?.value || '',
      isFeatured: false
    });
    if (newsFileRef.current) newsFileRef.current.value = '';
    if (journalistFileRef.current) journalistFileRef.current.value = '';
  };

  const filteredNews = newsList.filter(news => {
    const matchesSearch = news.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          news.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || news.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredNews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentNews = filteredNews.slice(startIndex, startIndex + itemsPerPage);

  const getCategoryStyle = (categoryValue) => {
    const cat = categories.find(c => c.value === categoryValue);
    const colorMap = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200',
      pink: 'bg-pink-50 text-pink-700 border-pink-200',
      red: 'bg-red-50 text-red-700 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      teal: 'bg-teal-50 text-teal-700 border-teal-200',
      indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      gray: 'bg-gray-50 text-gray-700 border-gray-200',
      slate: 'bg-slate-50 text-slate-700 border-slate-200',
    };
    return colorMap[cat?.color] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getCategoryLabel = (categoryValue) => {
    const cat = categories.find(c => c.value === categoryValue);
    return cat ? cat.label : categoryValue || 'Uncategorized';
  };

  if (loadingNews && newsList.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toast.show && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-md shadow-lg ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white font-medium`}>
          {toast.message}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedItems.length} article(s)? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">
                Cancel
              </button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {viewingNews && (
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="border-b px-4 sm:px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Article Preview</h2>
              <button onClick={() => setViewingNews(null)} className="p-2 hover:bg-gray-100 rounded-md text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{viewingNews.title}</h1>
                    {viewingNews.subtitle && <p className="text-base sm:text-lg text-gray-600 mt-2">{viewingNews.subtitle}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 border-t border-b py-3">
                    <div className="flex items-center gap-2">
                      {viewingNews.journalistImage ? (
                        <img src={`${API_URL}${viewingNews.journalistImage}`} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <User size={16} className="text-gray-400" />
                        </div>
                      )}
                      <span className="font-medium">{viewingNews.journalistName || 'Unknown'}</span>
                    </div>
                    <span>•</span>
                    <span>{new Date(viewingNews.publishedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  {viewingNews.image && (
                    <img src={`${API_URL}${viewingNews.image}`} alt={viewingNews.title} className="w-full rounded-lg" />
                  )}
                  <div className="prose prose-sm sm:prose max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: viewingNews.paragraph }} />
                </div>
                <div className="space-y-4 mt-6 lg:mt-0">
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h3 className="font-semibold text-gray-900 mb-3">Actions</h3>
                    <div className="space-y-2">
                      <button onClick={() => handleEdit(viewingNews)} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center justify-center gap-2 text-sm">
                        <Edit size={16} /> Edit
                      </button>
                      <button onClick={() => handleDelete(viewingNews.id)} className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium flex items-center justify-center gap-2 text-sm">
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h3 className="font-semibold text-gray-900 mb-3">Article Info</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Category:</span><span className="font-medium">{getCategoryLabel(viewingNews.category)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Author:</span><span className="font-medium">{viewingNews.journalistName || 'N/A'}</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="border-b px-4 sm:px-6 py-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {editingId ? 'Edit Article' : 'Create New Article'}
              </h2>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image *</label>
                    <div onClick={() => newsFileRef.current?.click()} className={`border-2 border-dashed rounded-md p-4 cursor-pointer transition ${formData.newsImagePreview ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}>
                      {formData.newsImagePreview ? (
                        <img src={formData.newsImagePreview} alt="Preview" className="w-full h-48 object-cover rounded" />
                      ) : (
                        <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                          <ImageIcon size={36} className="mb-2" />
                          <p className="text-sm text-center">Click to upload cover image</p>
                        </div>
                      )}
                      <input ref={newsFileRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e.target.files[0], 'news')} className="hidden" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Author Photo</label>
                    <div onClick={() => journalistFileRef.current?.click()} className={`border-2 border-dashed rounded-md p-4 cursor-pointer transition ${formData.journalistImagePreview ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'}`}>
                      {formData.journalistImagePreview ? (
                        <img src={formData.journalistImagePreview} alt="Author" className="w-32 h-32 mx-auto rounded-full object-cover" />
                      ) : (
                        <div className="h-32 flex flex-col items-center justify-center text-gray-400">
                          <User size={36} className="mb-2" />
                          <p className="text-sm text-center">Click to upload author photo</p>
                        </div>
                      )}
                      <input ref={journalistFileRef} type="file" accept="image/*" onChange={(e) => handleFileSelect(e.target.files[0], 'journalist')} className="hidden" />
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Article Title <span className="text-red-500">*</span></label>
                    <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Enter article title..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subtitle</label>
                    <input type="text" name="subtitle" value={formData.subtitle} onChange={handleInputChange} placeholder="Brief description or summary..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                      {loadingCategories ? (
                        <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-500 flex items-center gap-2">
                          <LoaderIcon className="animate-spin" size={16} />
                          Loading...
                        </div>
                      ) : categories.length === 0 ? (
                        <div className="px-3 py-2 bg-red-100 text-red-700 rounded-md">
                          No categories available
                        </div>
                      ) : (
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                          required
                        >
                          {categories.map(cat => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Author Name</label>
                      <input type="text" name="journalistName" value={formData.journalistName} onChange={handleInputChange} placeholder="Author name..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Published Date</label>
                      <input type="datetime-local" name="publishedDate" value={formData.publishedDate} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Article Content</label>
                    <RichTextEditor value={formData.content} onChange={handleContentChange} placeholder="Write your article content here..." />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <button onClick={handleSubmit} disabled={loadingNews} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-md font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                      <Save size={18} />
                      {loadingNews ? 'Saving...' : editingId ? 'Update Article' : 'Publish Article'}
                    </button>
                    <button onClick={() => { resetForm(); setShowForm(false); }} className="px-6 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-md font-medium">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showForm && !viewingNews && (
          <>
            <div className="bg-white rounded-lg shadow-sm border mb-4">
              <div className="p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search by title or subtitle..."
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter size={18} className="text-gray-400" />
                      <select
                        value={filterCategory}
                        onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-3">
                      {selectedItems.length > 0 && (
                        <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium flex items-center gap-2 text-sm">
                          <Trash2 size={18} />
                          Delete ({selectedItems.length})
                        </button>
                      )}
                      <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center gap-2 text-sm"
                      >
                        <Plus size={18} />
                        New Article
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {currentNews.length > 0 ? (
              <>
                <div className="hidden lg:block bg-white rounded-lg shadow-sm border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input type="checkbox" checked={selectedItems.length === currentNews.length && currentNews.length > 0} onChange={toggleSelectAll} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {currentNews.map((news) => (
                        <tr key={news.id} className={`hover:bg-gray-50 transition-colors ${selectedItems.includes(news.id) ? 'bg-blue-50' : ''}`}>
                          <td className="px-4 py-4">
                            <input type="checkbox" checked={selectedItems.includes(news.id)} onChange={() => toggleSelectItem(news.id)} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {news.image ? (
                                <img src={`${API_URL}${news.image}`} alt="" className="w-16 h-16 object-cover rounded" />
                              ) : (
                                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                  <ImageIcon size={24} className="text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900 truncate max-w-xs">{news.title}</p>
                                {news.subtitle && <p className="text-sm text-gray-500 truncate max-w-xs">{news.subtitle}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-md text-xs font-medium border ${getCategoryStyle(news.category)}`}>
                              {getCategoryLabel(news.category)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {news.journalistImage ? (
                                <img src={`${API_URL}${news.journalistImage}`} alt="" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                  <User size={14} className="text-gray-400" />
                                </div>
                              )}
                              <span className="text-sm text-gray-700">{news.journalistName || 'Unknown'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(news.publishedDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleView(news)} className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors" title="View">
                                <Eye size={16} />
                              </button>
                              <button onClick={() => handleEdit(news)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => handleDelete(news.id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="lg:hidden space-y-4">
                  {currentNews.map((news) => (
                    <div key={news.id} className={`bg-white rounded-lg shadow-sm border p-4 ${selectedItems.includes(news.id) ? 'ring-2 ring-blue-500' : ''}`}>
                      <div className="flex items-start justify-between mb-3">
                        <input type="checkbox" checked={selectedItems.includes(news.id)} onChange={() => toggleSelectItem(news.id)} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mt-1" />
                        <div className="flex gap-2">
                          <button onClick={() => handleView(news)} className="p-2 text-gray-600 hover:bg-gray-100 rounded" title="View">
                            <Eye size={18} />
                          </button>
                          <button onClick={() => handleEdit(news)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Edit">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDelete(news.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        {news.image ? (
                          <img src={`${API_URL}${news.image}`} alt="" className="w-24 h-24 object-cover rounded flex-shrink-0" />
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            <ImageIcon size={32} className="text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base truncate">{news.title}</h3>
                          {news.subtitle && <p className="text-sm text-gray-500 truncate">{news.subtitle}</p>}
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                            <span className={`px-2 py-1 rounded border ${getCategoryStyle(news.category)}`}>
                              {getCategoryLabel(news.category)}
                            </span>
                            <span>{new Date(news.publishedDate).toLocaleDateString()}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            {news.journalistImage ? (
                              <img src={`${API_URL}${news.journalistImage}`} alt="" className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                                <User size={12} className="text-gray-400" />
                              </div>
                            )}
                            <span className="text-gray-700">{news.journalistName || 'Unknown'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-gray-700">
                      <ChevronLeft size={16} /> Previous
                    </button>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum = totalPages <= 5 ? i + 1 : currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i;
                        return (
                          <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-10 h-10 rounded-md font-medium transition-colors ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-gray-700">
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border p-8 sm:p-12 text-center">
                <FileText size={64} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No articles found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || filterCategory !== 'all' ? 'Try adjusting your search filters' : 'Start by creating your first article'}
                </p>
                {!searchTerm && filterCategory === 'all' && (
                  <button onClick={() => { setShowForm(true); resetForm(); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium inline-flex items-center gap-2">
                    <Plus size={20} /> Create First Article
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default UnifiedNewsManagement;