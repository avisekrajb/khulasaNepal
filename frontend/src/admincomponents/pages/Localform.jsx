import React, { useState, useEffect, useRef } from 'react';
import {
  Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Save, X, Image as ImageIcon, User, CheckCircle
} from 'lucide-react';
import axiosInstance from '../../api/axios';

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
    <div className={`border rounded-lg overflow-hidden transition-all ${isFocused ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1">
        <button type="button" onClick={() => execCommand('bold')} className="p-2 hover:bg-white rounded transition" title="Bold">
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => execCommand('italic')} className="p-2 hover:bg-white rounded transition" title="Italic">
          <Italic size={16} />
        </button>
        <button type="button" onClick={() => execCommand('underline')} className="p-2 hover:bg-white rounded transition" title="Underline">
          <Underline size={16} />
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-2 hover:bg-white rounded transition" title="Bullet List">
          <List size={16} />
        </button>
        <button type="button" onClick={() => execCommand('insertOrderedList')} className="p-2 hover:bg-white rounded transition" title="Numbered List">
          <ListOrdered size={16} />
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => execCommand('justifyLeft')} className="p-2 hover:bg-white rounded transition" title="Align Left">
          <AlignLeft size={16} />
        </button>
        <button type="button" onClick={() => execCommand('justifyCenter')} className="p-2 hover:bg-white rounded transition" title="Align Center">
          <AlignCenter size={16} />
        </button>
        <button type="button" onClick={() => execCommand('justifyRight')} className="p-2 hover:bg-white rounded transition" title="Align Right">
          <AlignRight size={16} />
        </button>
        <div className="w-px bg-gray-300 mx-1" />
        <select
          onChange={(e) => execCommand('fontSize', e.target.value)}
          className="px-2 py-1 border-0 rounded text-sm hover:bg-white transition bg-transparent"
          defaultValue="3"
        >
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Heading</option>
        </select>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="p-6 min-h-[300px] max-h-[500px] overflow-y-auto focus:outline-none bg-white prose prose-sm max-w-none"
        data-placeholder={placeholder}
      />
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .prose p {
          margin-bottom: 1em;
        }
        .prose ul, .prose ol {
          padding-left: 1.5em;
          margin: 1em 0;
        }
      `}</style>
    </div>
  );
};

const Localform = () => {
  const [formData, setFormData] = useState({
    newsImageFile: null,
    newsImagePreview: '',
    newsImageUrl: '',
    journalistImageFile: null,
    journalistImagePreview: '',
    journalistImageUrl: '',
    title: '',
    subtitle: '',
    content: '',
    publishedDate: '',
    journalistName: '',
    category: '',
    isFeatured: false
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const newsFileRef = useRef(null);
  const journalistFileRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await axiosInstance.get('/api/categories');
        const activeCategories = response.data.categories || [];
        setCategories(activeCategories);

        const localCat = activeCategories.find(cat => 
          cat.value.toLowerCase() === 'local'
        );

        setFormData(prev => ({
          ...prev,
          category: localCat ? localCat.value : (activeCategories[0]?.value || '')
        }));
      } catch (err) {
        console.error('Error fetching categories:', err);
        showToast('Failed to load categories', 'error');
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

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
        setFormData(prev => ({
          ...prev,
          newsImageFile: file,
          newsImagePreview: preview,
          newsImageUrl: ''
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          journalistImageFile: file,
          journalistImagePreview: preview,
          journalistImageUrl: ''
        }));
      }
    } else {
      showToast('Please select a valid image file', 'error');
    }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file, type);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.category) {
      showToast('Please select a category', 'error');
      return;
    }

    if (formData.category.length < 2) {
      showToast('Invalid category selected', 'error');
      return;
    }

    if (!formData.title.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }

    if (!formData.newsImageFile && !formData.newsImageUrl) {
      showToast('Please provide a news image', 'error');
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Add images if files selected
      if (formData.newsImageFile) {
        formDataToSend.append('image', formData.newsImageFile);
      } else if (formData.newsImageUrl) {
        formDataToSend.append('imageUrl', formData.newsImageUrl);
      }

      if (formData.journalistImageFile) {
        formDataToSend.append('journalistImage', formData.journalistImageFile);
      } else if (formData.journalistImageUrl) {
        formDataToSend.append('journalistImageUrl', formData.journalistImageUrl);
      }

      // Add text fields
      formDataToSend.append('title', formData.title);
      formDataToSend.append('subtitle', formData.subtitle || '');
      formDataToSend.append('paragraph', formData.content || '');
      formDataToSend.append('journalistName', formData.journalistName || '');
      formDataToSend.append('publishedDate', formData.publishedDate || new Date().toISOString());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('isFeatured', formData.isFeatured);

      const response = await axiosInstance.post('/api/news', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      console.log('✅ Article created:', response.data);
      showToast('Article published successfully!', 'success');

      setShowSuccessModal(true);
      
      // Auto-close success modal and reset form after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        resetForm();
      }, 3000);

    } catch (error) {
      console.error('❌ Error:', error);
      const message = error.response?.data?.message || 'Failed to save article';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      newsImageFile: null,
      newsImagePreview: '',
      newsImageUrl: '',
      journalistImageFile: null,
      journalistImagePreview: '',
      journalistImageUrl: '',
      title: '',
      subtitle: '',
      content: '',
      publishedDate: '',
      journalistName: '',
      category: categories.find(cat => cat.value === 'local')?.value || categories[0]?.value || '',
      isFeatured: false
    });
    if (newsFileRef.current) newsFileRef.current.value = '';
    if (journalistFileRef.current) journalistFileRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
    
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-xl transform transition-all duration-300 ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          } text-white font-medium flex items-center gap-3`}
        >
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.message}
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 text-center animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-emerald-600" size={36} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Article Published!</h3>
            <p className="text-gray-600 mb-6">
              Your article is now live on the news portal.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  resetForm();
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Write Another
              </button>
              <button
                onClick={() => {
                  window.location.href = '/admin/local';
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold transition"
              >
                View All
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-10 border border-gray-200">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Publish New Article
            </h2>
            <p className="text-gray-600">Create and publish your news story to the portal</p>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Category</label>
              {loadingCategories ? (
                <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-500 border border-gray-200">
                  Loading categories...
                </div>
              ) : categories.length === 0 ? (
                <div className="px-4 py-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                  No categories available. Please create one first.
                </div>
              ) : (
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition bg-white text-gray-900 font-medium"
                  required
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Article Cover Image
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                    formData.newsImagePreview ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                  }`}
                  onDrop={(e) => handleDrop(e, 'news')}
                  onDragOver={handleDragOver}
                  onClick={() => newsFileRef.current?.click()}
                >
                  {formData.newsImagePreview ? (
                    <img
                      src={formData.newsImagePreview}
                      alt="Cover preview"
                      className="w-full h-56 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="space-y-3">
                      <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-600 font-medium">Drop image or click to upload</p>
                      <p className="text-xs text-gray-500">Recommended: 1200x630px</p>
                    </div>
                  )}
                  <input
                    ref={newsFileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files[0], 'news')}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Author Photo
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                    formData.journalistImagePreview ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                  }`}
                  onDrop={(e) => handleDrop(e, 'journalist')}
                  onDragOver={handleDragOver}
                  onClick={() => journalistFileRef.current?.click()}
                >
                  {formData.journalistImagePreview ? (
                    <img
                      src={formData.journalistImagePreview}
                      alt="Author"
                      className="w-40 h-40 mx-auto rounded-full object-cover border-4 border-white shadow-md"
                    />
                  ) : (
                    <div className="space-y-3">
                      <User className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="text-sm text-gray-600 font-medium">Drop photo or click to upload</p>
                      <p className="text-xs text-gray-500">Square format recommended</p>
                    </div>
                  )}
                  <input
                    ref={journalistFileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files[0], 'journalist')}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Headline</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter article headline..."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Subheadline</label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  placeholder="Optional summary or tagline..."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Article Content</label>
              <RichTextEditor
                value={formData.content}
                onChange={handleContentChange}
                placeholder="Write your article content here..."
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Author Name</label>
                <input
                  type="text"
                  name="journalistName"
                  value={formData.journalistName}
                  onChange={handleInputChange}
                  placeholder="Full name..."
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Publish Date & Time</label>
                <input
                  type="datetime-local"
                  name="publishedDate"
                  value={formData.publishedDate}
                  onChange={handleInputChange}
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                disabled={loading || loadingCategories}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white px-8 py-4 rounded-lg font-semibold transition shadow-sm hover:shadow-md flex items-center justify-center gap-3 disabled:cursor-not-allowed text-base"
              >
                {loading ? (
                  <>Publishing...</>
                ) : (
                  <>
                    <Save size={20} />
                    Publish Article
                  </>
                )}
              </button>
              <button
                onClick={resetForm}
                disabled={loading}
                className="px-8 py-4 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold transition flex items-center gap-3 text-base"
              >
                <X size={20} />
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>

  );
};

export default Localform;