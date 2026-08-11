// admincomponents/pages/Ads.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  Loader, Eye, X, Upload, ImageIcon,
  TrendingUp, MousePointer, Target,
  AlertCircle, CheckCircle, Layers, Globe, Film
} from 'lucide-react';
import axiosInstance from '../../api/axios';

const AD_POSITIONS = [
  { value: 'navbar-top', label: 'Navbar Top' },
  { value: 'header', label: 'Header Banner' },
  { value: 'sidebar-top', label: 'Sidebar Top' },
  { value: 'sidebar-middle', label: 'Sidebar Middle' },
  { value: 'sidebar-bottom', label: 'Sidebar Bottom' },
  { value: 'article-top', label: 'Article Top' },
  { value: 'article-middle', label: 'Article Middle' },
  { value: 'article-bottom', label: 'Article Bottom' },
  { value: 'homepage-banner', label: 'Homepage Banner' },
  { value: 'category-banner', label: 'Category Banner' },
];

// ========================================
// AD MODAL COMPONENT
// ========================================
const AdModal = ({ show, ad, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    position: 'sidebar-top',
    linkUrl: '',
    openInNewTab: true,
    priority: 0,
    isActive: true,
    startDate: '',
    endDate: '',
    width: '',
    height: '',
    advertiser: '',
    notes: '',
    targetPages: [],
    targetCategories: [],
    excludePages: [],
    excludeCategories: [],
    displayFrequency: 'always',
    displayPercentage: 100,
    maxImpressions: '',
    maxClicks: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [availablePages, setAvailablePages] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [isGif, setIsGif] = useState(false);

  const fileInputRef = useRef(null);

  // Load available options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [pagesRes, categoriesRes] = await Promise.all([
          axiosInstance.get('/api/ads/pages/available'),
          axiosInstance.get('/api/ads/categories/available')
        ]);
        setAvailablePages(pagesRes.data.pages || []);
        setAvailableCategories(categoriesRes.data.categories || []);
      } catch (err) {
        console.error('Failed to load options:', err);
      }
    };
    loadOptions();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (ad) {
      setFormData({
        title: ad.title || '',
        position: ad.position || 'sidebar-top',
        linkUrl: ad.linkUrl || '',
        openInNewTab: ad.openInNewTab ?? true,
        priority: ad.priority || 0,
        isActive: ad.isActive ?? true,
        startDate: ad.startDate ? ad.startDate.split('T')[0] : '',
        endDate: ad.endDate ? ad.endDate.split('T')[0] : '',
        width: ad.width || '',
        height: ad.height || '',
        advertiser: ad.advertiser || '',
        notes: ad.notes || '',
        targetPages: ad.targetPages || [],
        targetCategories: ad.targetCategories || [],
        excludePages: ad.excludePages || [],
        excludeCategories: ad.excludeCategories || [],
        displayFrequency: ad.displayFrequency || 'always',
        displayPercentage: ad.displayPercentage || 100,
        maxImpressions: ad.maxImpressions || '',
        maxClicks: ad.maxClicks || '',
      });
      setPreview(ad.imageUrl ? `${axiosInstance.defaults.baseURL}${ad.imageUrl}` : null);
      setIsGif(ad.imageMimeType === 'image/gif');
      setImageFile(null);
    } else {
      setFormData({
        title: '',
        position: 'sidebar-top',
        linkUrl: '',
        openInNewTab: true,
        priority: 0,
        isActive: true,
        startDate: '',
        endDate: '',
        width: '',
        height: '',
        advertiser: '',
        notes: '',
        targetPages: [],
        targetCategories: [],
        excludePages: [],
        excludeCategories: [],
        displayFrequency: 'always',
        displayPercentage: 100,
        maxImpressions: '',
        maxClicks: '',
      });
      setPreview(null);
      setImageFile(null);
      setIsGif(false);
    }
    setErrors({});
  }, [ad, show]);

  const handleFile = (file) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'Only images allowed' }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Max 10MB allowed' }));
      return;
    }

    const isGifFile = file.type === 'image/gif';
    setIsGif(isGifFile);
    setImageFile(file);
    setErrors(prev => {
      const rest = { ...prev };
      delete rest.image;
      return rest;
    });

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const toggleArrayItem = (array, item) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = 'Title is required';
    if (!ad && !imageFile) errs.image = 'Image is required';
    if (formData.displayFrequency === 'percentage' && 
        (formData.displayPercentage < 0 || formData.displayPercentage > 100)) {
      errs.displayPercentage = 'Must be between 0-100';
    }
    // Validate priority
    if (formData.priority < 0 || formData.priority > 100) {
      errs.priority = 'Priority must be between 0-100';
    }
    // Validate width and height
    if (formData.width && (parseInt(formData.width) < 0 || isNaN(parseInt(formData.width)))) {
      errs.width = 'Width must be a positive number';
    }
    if (formData.height && (parseInt(formData.height) < 0 || isNaN(parseInt(formData.height)))) {
      errs.height = 'Height must be a positive number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const data = new FormData();
      
      // Append all form data - FIXED: Properly handle width, height, priority
      Object.keys(formData).forEach(key => {
        if (['targetPages', 'targetCategories', 'excludePages', 'excludeCategories'].includes(key)) {
          data.append(key, JSON.stringify(formData[key]));
        } else if (key === 'width' || key === 'height') {
          // Only append if value is not empty
          if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
            data.append(key, formData[key]);
          }
        } else if (key === 'priority') {
          data.append(key, formData[key] || 0);
        } else if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });
      
      if (imageFile) data.append('image', imageFile);

      // Log the data being sent for debugging
      console.log('📤 Submitting ad data:');
      for (let [key, value] of data.entries()) {
        console.log(`   ${key}: ${value}`);
      }

      let response;
      if (ad?.id) {
        response = await axiosInstance.put(`/api/ads/${ad.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await axiosInstance.post('/api/ads', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.data && response.data.ad) {
        onSave(response.data.ad);
        onClose();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to save advertisement';
      setErrors({ submit: msg });
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden">
        <div className="px-6 py-5 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            {ad ? 'Edit Advertisement' : 'Create New Advertisement'}
            {isGif && (
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Film size={14} /> GIF
              </span>
            )}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition text-white">
            <X size={20} />
          </button>
        </div>

        <div className="border-b bg-gray-50 px-6">
          <div className="flex gap-1">
            {[
              { id: 'basic', label: 'Basic Info', icon: ImageIcon },
              { id: 'targeting', label: 'Targeting', icon: Target },
              { id: 'limits', label: 'Limits & Budget', icon: TrendingUp }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          <form className="space-y-6">
            
            {activeTab === 'basic' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Advertisement Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${
                        errors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Summer Sale Banner"
                    />
                    {errors.title && <p className="mt-1.5 text-sm text-red-600">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Position <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.position}
                      onChange={e => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                    >
                      {AD_POSITIONS.map(pos => (
                        <option key={pos.value} value={pos.value}>{pos.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Advertisement Image <span className="text-red-500">*</span>
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      (JPEG, PNG, GIF, WEBP • Max 10MB)
                    </span>
                  </label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                      errors.image ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-blue-400 bg-gray-50'
                    }`}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      handleFile(e.dataTransfer.files[0]);
                    }}
                  >
                    {preview ? (
                      <div className="space-y-4">
                        {isGif ? (
                          <div className="relative">
                            <img src={preview} alt="GIF Preview" className="max-h-72 mx-auto object-contain rounded-lg shadow-md" />
                            <span className="absolute top-2 right-2 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                              <Film size={14} /> GIF
                            </span>
                          </div>
                        ) : (
                          <img src={preview} alt="Preview" className="max-h-72 mx-auto object-contain rounded-lg shadow-md" />
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Change Image
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="mx-auto h-14 w-14 text-gray-400" />
                        <p className="text-gray-700 font-semibold text-lg">Drag & drop image or GIF here</p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-semibold"
                        >
                          Browse Files
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,.gif"
                          className="hidden"
                          onChange={e => handleFile(e.target.files?.[0])}
                        />
                      </div>
                    )}
                  </div>
                  {errors.image && <p className="mt-1.5 text-sm text-red-600">{errors.image}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Destination URL <span className="text-xs font-normal text-gray-500">(Opens in new tab)</span>
                    </label>
                    <input
                      type="url"
                      value={formData.linkUrl}
                      onChange={e => setFormData({ ...formData, linkUrl: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 cursor-pointer bg-gray-50 px-4 py-3 rounded-lg border w-full hover:bg-gray-100 transition">
                      <input
                        type="checkbox"
                        checked={formData.openInNewTab}
                        onChange={e => setFormData({ ...formData, openInNewTab: e.target.checked })}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium">Open in new tab</span>
                    </label>
                  </div>
                </div>

                {/* ============================================ */}
                {/* FIXED: Width, Height, Priority Section */}
                {/* ============================================ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Width (px) <span className="text-xs font-normal text-gray-500">(Optional)</span>
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      value={formData.width} 
                      onChange={e => setFormData({ ...formData, width: e.target.value })} 
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${
                        errors.width ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Auto" 
                    />
                    {errors.width && <p className="mt-1.5 text-sm text-red-600">{errors.width}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Height (px) <span className="text-xs font-normal text-gray-500">(Optional)</span>
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      value={formData.height} 
                      onChange={e => setFormData({ ...formData, height: e.target.value })} 
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${
                        errors.height ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Auto" 
                    />
                    {errors.height && <p className="mt-1.5 text-sm text-red-600">{errors.height}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Priority <span className="text-xs font-normal text-gray-500">(0-100)</span>
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={formData.priority} 
                      onChange={e => setFormData({ ...formData, priority: e.target.value })} 
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition ${
                        errors.priority ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0" 
                    />
                    {errors.priority && <p className="mt-1.5 text-sm text-red-600">{errors.priority}</p>}
                    <p className="mt-1 text-xs text-gray-500">Higher priority ads show first</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                    <input type="date" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                    <input type="date" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Advertiser</label>
                  <input type="text" value={formData.advertiser} onChange={e => setFormData({ ...formData, advertiser: e.target.value })} className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="Company name" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                  <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} rows="3" className="w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 transition" />
                </div>
              </>
            )}

            {activeTab === 'targeting' && (
              <div className="space-y-8">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">How Targeting Works</h4>
                      <p className="text-sm text-blue-700">
                        Select specific pages/categories where you want this ad to appear. Leave empty to show on all pages. 
                        Exclusions take priority over inclusions.
                      </p>
                      <h4 className="font-semibold text-blue-900 mb-1 mt-2">लक्ष्यकरण कसरी काम गर्छ</h4>
                      <p className="text-sm text-blue-700">
                        तपाईं यस विज्ञापन देखाउन चाहनु भएको विशेष पृष्ठहरू/श्रेणीहरू चयन गर्नुहोस्। सबै पृष्ठमा देखाउन खाली राख्नुहोस्। बहिष्कारले समावेशीकरण भन्दा प्राथमिकता पाउँछ।
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Globe size={20} className="text-gray-600" />
                    <h3 className="text-lg font-bold text-gray-900">Target Pages</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availablePages.map(page => (
                      <label
                        key={page.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                          formData.targetPages.includes(page.value)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.targetPages.includes(page.value)}
                          onChange={() => setFormData({
                            ...formData,
                            targetPages: toggleArrayItem(formData.targetPages, page.value)
                          })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">{page.label}</span>
                      </label>
                    ))}
                  </div>
                  {formData.targetPages.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500" />
                      Will show on all pages
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Layers size={20} className="text-gray-600" />
                    <h3 className="text-lg font-bold text-gray-900">Target Categories</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableCategories.map(cat => (
                      <label
                        key={cat.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${
                          formData.targetCategories.includes(cat.value)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.targetCategories.includes(cat.value)}
                          onChange={() => setFormData({
                            ...formData,
                            targetCategories: toggleArrayItem(formData.targetCategories, cat.value)
                          })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium">{cat.label}</span>
                      </label>
                    ))}
                  </div>
                  {formData.targetCategories.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                      <CheckCircle size={16} className="text-green-500" />
                      Will show in all categories
                    </p>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Display Frequency</h3>
                  <div className="space-y-4">
                    <select
                      value={formData.displayFrequency}
                      onChange={e => setFormData({ ...formData, displayFrequency: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                    >
                      <option value="always">Always Show</option>
                      <option value="rotation">Rotation (based on priority)</option>
                      <option value="percentage">Percentage-based</option>
                    </select>
                    
                    {formData.displayFrequency === 'percentage' && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Display Percentage (0-100)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={formData.displayPercentage}
                          onChange={e => setFormData({ ...formData, displayPercentage: e.target.value })}
                          className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                        />
                        {errors.displayPercentage && (
                          <p className="mt-1.5 text-sm text-red-600">{errors.displayPercentage}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'limits' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="text-yellow-600 mt-0.5" size={20} />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-1">Budget & Limits</h4>
                      <p className="text-sm text-yellow-700">
                        Set maximum impressions and clicks to control ad spend. Ad will automatically stop when limits are reached.
                      </p>
                      <h4 className="font-semibold text-yellow-900 mb-1 mt-2">बजेट र सीमाहरू</h4>
                      <p className="text-sm text-yellow-700">
                        विज्ञापन खर्च नियन्त्रण गर्न अधिकतम इम्प्रेसन र क्लिक सेट गर्नुहोस्। सीमाहरू पुगेपछि विज्ञापन स्वतः रोकिनेछ।
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Max Total Impressions
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxImpressions}
                      onChange={e => setFormData({ ...formData, maxImpressions: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                      placeholder="Unlimited"
                    />
                    <p className="mt-1 text-xs text-gray-500">Leave empty for unlimited</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Max Total Clicks
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxClicks}
                      onChange={e => setFormData({ ...formData, maxClicks: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                      placeholder="Unlimited"
                    />
                    <p className="mt-1 text-xs text-gray-500">Leave empty for unlimited</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <label className="text-sm font-semibold text-gray-700">
                    Activate this advertisement immediately
                  </label>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 border rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition disabled:opacity-60 flex items-center gap-2 min-w-[160px] justify-center font-semibold shadow-lg"
              >
                {loading && <Loader size={20} className="animate-spin" />}
                {loading ? 'Saving...' : ad ? 'Update Ad' : 'Create Ad'}
              </button>
            </div>

            {errors.submit && (
              <div className="text-center text-red-600 font-medium">{errors.submit}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

// ========================================
// PARSE HELPER
// ========================================
const parseAdArrayFields = (ad) => {
  if (!ad) return ad;
  const arrayFields = ['targetPages', 'targetCategories', 'excludePages', 'excludeCategories'];
  const parsed = { ...ad };
  arrayFields.forEach(field => {
    if (typeof parsed[field] === 'string') {
      try { parsed[field] = JSON.parse(parsed[field]); } 
      catch { parsed[field] = []; }
    } else if (!Array.isArray(parsed[field])) {
      parsed[field] = [];
    }
  });
  return parsed;
};

// ========================================
// MAIN ADS MANAGER COMPONENT
// ========================================
const AdsManager = () => {
  const [ads, setAds] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    loadAds();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAds = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get('/api/ads');
      const rawAds = data.ads || data || [];
      setAds(rawAds.map(parseAdArrayFields));
    } catch (err) {
      console.error('Failed to load ads:', err);
      showToast('Failed to load advertisements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await axiosInstance.get('/api/ads/stats/overview');
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const handleSave = (savedAd) => {
    const normalized = parseAdArrayFields(savedAd);
    if (editingAd) {
      setAds(ads.map(a => a.id === normalized.id ? normalized : a));
      showToast('Advertisement updated successfully');
    } else {
      setAds([normalized, ...ads]);
      showToast('Advertisement created successfully');
    }
    setModalOpen(false);
    setEditingAd(null);
    loadStats();
  };

  const handleDelete = async (ad) => {
    if (!window.confirm(`Delete "${ad.title}" permanently?`)) return;
    try {
      await axiosInstance.delete(`/api/ads/${ad.id}`);
      setAds(ads.filter(a => a.id !== ad.id));
      showToast('Advertisement deleted successfully');
      loadStats();
    } catch {
      showToast('Failed to delete advertisement', 'error');
    }
  };

  const handleToggleActive = async (ad) => {
    try {
      await axiosInstance.patch(`/api/ads/${ad.id}/toggle`);
      setAds(ads.map(a => a.id === ad.id ? { ...a, isActive: !a.isActive } : a));
      showToast(`Ad ${ad.isActive ? 'deactivated' : 'activated'}`);
      loadStats();
    } catch {
      showToast('Failed to change status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader className="animate-spin h-12 w-12 text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl text-white font-semibold ${
          toast.type === 'success' ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-red-600 to-rose-600'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Advertisement Manager
          </h1>
          <p className="text-gray-600 mt-2 text-lg flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Advanced targeting & budget control
          </p>
        </div>
        <button
          onClick={() => {
            setEditingAd(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition shadow-lg font-semibold group"
        >
          <Plus size={22} className="group-hover:rotate-90 transition-transform duration-300" />
          New Advertisement
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Ads</p>
                <p className="text-3xl font-bold mt-1">{stats.totalAds}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <ImageIcon size={28} className="opacity-80" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Ads</p>
                <p className="text-3xl font-bold mt-1">{stats.activeAds}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <Eye size={28} className="opacity-80" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Impressions</p>
                <p className="text-3xl font-bold mt-1">{stats.totalImpressions.toLocaleString()}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <TrendingUp size={28} className="opacity-80" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Total Clicks</p>
                <p className="text-3xl font-bold mt-1">{stats.totalClicks.toLocaleString()}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <MousePointer size={28} className="opacity-80" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ads Table */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Preview</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Title & Targeting</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Position</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Analytics</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ads.map(ad => {
                const isGif = ad.imageMimeType === 'image/gif';
                return (
                  <tr key={ad.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="relative">
                        {ad.imageUrl ? (
                          <div className="relative h-20 w-28 rounded-lg overflow-hidden shadow-sm border border-gray-200">
                            <img
                              src={`${axiosInstance.defaults.baseURL}${ad.imageUrl}`}
                              alt={ad.title}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="80"%3E%3Crect width="100" height="80" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="10"%3ENo image%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            {isGif && (
                              <span className="absolute top-1 right-1 bg-black/60 text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Film size={10} /> GIF
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="h-20 w-28 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ImageIcon size={28} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{ad.title}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="inline-block mr-2">Priority: {ad.priority || 0}</span>
                        {ad.width && <span className="inline-block mr-2">W: {ad.width}px</span>}
                        {ad.height && <span className="inline-block">H: {ad.height}px</span>}
                      </div>
                      {ad.targetPages?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {ad.targetPages.slice(0, 3).map(page => (
                            <span key={page} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {page}
                            </span>
                          ))}
                          {ad.targetPages.length > 3 && (
                            <span className="text-xs text-gray-500">+{ad.targetPages.length - 3} more</span>
                          )}
                        </div>
                      )}
                      {ad.targetCategories?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ad.targetCategories.slice(0, 2).map(cat => (
                            <span key={cat} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                              {cat}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800">
                        {AD_POSITIONS.find(p => p.value === ad.position)?.label || ad.position}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {ad.isActive ? (
                          <>
                            <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></span>
                            <span className="text-sm text-green-700 font-semibold">Active</span>
                          </>
                        ) : (
                          <>
                            <span className="h-3 w-3 rounded-full bg-gray-400"></span>
                            <span className="text-sm text-gray-600 font-medium">Inactive</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Eye size={14} className="text-blue-500" />
                          <span className="font-medium">{ad.impressions?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MousePointer size={14} className="text-green-500" />
                          <span className="font-medium">{ad.clicks?.toLocaleString() || 0}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleToggleActive(ad)}
                          className={`p-2 rounded-lg transition ${
                            ad.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                          }`}
                          title={ad.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {ad.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                        <button
                          onClick={() => {
                            setEditingAd(ad);
                            setModalOpen(true);
                          }}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(ad)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {ads.length === 0 && (
          <div className="text-center py-20">
            <ImageIcon size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg font-medium">No advertisements yet. Create your first one!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AdModal
        show={modalOpen}
        ad={editingAd}
        onClose={() => {
          setModalOpen(false);
          setEditingAd(null);
        }}
        onSave={handleSave}
      />
    </div>
  );
};

export default AdsManager;