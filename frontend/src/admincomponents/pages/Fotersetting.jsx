import React, { useState, useEffect } from 'react';
import { FaSave, FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaUpload, FaTimes, FaVideo, FaImage } from 'react-icons/fa';
import axiosInstance from '../../api/axios';

function FooterSettings() {
  const [footers, setFooters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [selectedFooter, setSelectedFooter] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [, setLogoFile] = useState(null);
  const [bgPreview, setBgPreview] = useState(null);
  const [, setBgFile] = useState(null);
  const [bgMediaType, setBgMediaType] = useState('image');
  
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    email: '',
    chairman: '',
    itEditor: '',
    legalAdvisor: '',
    advisor: '',
    coEditor: '',
    companyName: '',
    pressName: '',
    departmentRegNo: '',
    pressCouncilNo: '',
    facebookUrl: '',
    whatsappNumber: '',
    twitterUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    copyrightText: '',
    aboutText: '',
    logoUrl: '',
    bgMediaUrl: '',
    bgMediaType: 'image',
    usefulLinks: [],
    isActive: true
  });

  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    fetchFooters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFooters = async () => {
    try {
      const response = await axiosInstance.get('/api/footer');
      
      if (response.data.success) {
        setFooters(response.data.footers);
      }
    } catch (error) {
      showAlert('Error fetching footer configurations', 'error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert('Logo file size should be less than 5MB', 'error');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setLogoPreview(base64String);
        setFormData(prev => ({ ...prev, logoUrl: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logoUrl: '' }));
  };

  const handleBgMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showAlert('Background media file size should be less than 10MB', 'error');
        return;
      }

      // Determine media type
      const fileType = file.type;
      let mediaType = 'image';
      if (fileType.startsWith('video/')) {
        mediaType = 'video';
      }
      
      setBgMediaType(mediaType);
      setBgFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setBgPreview(base64String);
        setFormData(prev => ({ 
          ...prev, 
          bgMediaUrl: base64String,
          bgMediaType: mediaType
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBgMedia = () => {
    setBgFile(null);
    setBgPreview(null);
    setBgMediaType('image');
    setFormData(prev => ({ 
      ...prev, 
      bgMediaUrl: '', 
      bgMediaType: 'image' 
    }));
  };

  const addUsefulLink = () => {
    setFormData(prev => ({
      ...prev,
      usefulLinks: [...prev.usefulLinks, { text: '', url: '' }]
    }));
  };

  const updateUsefulLink = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      usefulLinks: prev.usefulLinks.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const removeUsefulLink = (index) => {
    setFormData(prev => ({
      ...prev,
      usefulLinks: prev.usefulLinks.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        usefulLinks: JSON.stringify(formData.usefulLinks)
      };

      // Log to debug
      console.log('Submitting footer data:', {
        hasBgMedia: !!submitData.bgMediaUrl,
        bgMediaType: submitData.bgMediaType,
        bgMediaLength: submitData.bgMediaUrl ? submitData.bgMediaUrl.length : 0
      });

      const response = editMode 
        ? await axiosInstance.put(`/api/footer/${selectedFooter.id}`, submitData)
        : await axiosInstance.post('/api/footer', submitData);

      if (response.data.success) {
        showAlert(response.data.message, 'success');
        fetchFooters();
        resetForm();
      } else {
        showAlert(response.data.message, 'error');
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error saving footer configuration', 'error');
      console.error('Error:', error);
    }
  };

  const handleEdit = (footer) => {
    let parsedLinks = [];
    if (footer.usefulLinks) {
      try {
        parsedLinks = typeof footer.usefulLinks === 'string' 
          ? JSON.parse(footer.usefulLinks) 
          : footer.usefulLinks;
      } catch (e) {
        console.error('Error parsing useful links:', e);
      }
    }

    setFormData({
      address: footer.address || '',
      phone: footer.phone || '',
      email: footer.email || '',
      chairman: footer.chairman || '',
      itEditor: footer.itEditor || '',
      legalAdvisor: footer.legalAdvisor || '',
      advisor: footer.advisor || '',
      coEditor: footer.coEditor || '',
      companyName: footer.companyName || '',
      pressName: footer.pressName || '',
      departmentRegNo: footer.departmentRegNo || '',
      pressCouncilNo: footer.pressCouncilNo || '',
      facebookUrl: footer.facebookUrl || '',
      whatsappNumber: footer.whatsappNumber || '',
      twitterUrl: footer.twitterUrl || '',
      instagramUrl: footer.instagramUrl || '',
      youtubeUrl: footer.youtubeUrl || '',
      copyrightText: footer.copyrightText || '',
      aboutText: footer.aboutText || '',
      logoUrl: footer.logoUrl || '',
      bgMediaUrl: footer.bgMediaUrl || '',
      bgMediaType: footer.bgMediaType || 'image',
      usefulLinks: parsedLinks,
      isActive: footer.isActive
    });

    if (footer.logoUrl) {
      setLogoPreview(footer.logoUrl);
    }

    if (footer.bgMediaUrl) {
      setBgPreview(footer.bgMediaUrl);
      setBgMediaType(footer.bgMediaType || 'image');
    }

    setSelectedFooter(footer);
    setEditMode(true);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this footer configuration?')) {
      return;
    }

    try {
      const response = await axiosInstance.delete(`/api/footer/${id}`);

      if (response.data.success) {
        showAlert(response.data.message, 'success');
        fetchFooters();
      } else {
        showAlert(response.data.message, 'error');
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error deleting footer configuration', 'error');
      console.error('Error:', error);
    }
  };

  const handleToggle = async (id) => {
    try {
      const response = await axiosInstance.patch(`/api/footer/${id}/toggle`);

      if (response.data.success) {
        showAlert(response.data.message, 'success');
        fetchFooters();
      } else {
        showAlert(response.data.message, 'error');
      }
    } catch (error) {
      showAlert(error.response?.data?.message || 'Error toggling footer status', 'error');
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      address: '',
      phone: '',
      email: '',
      chairman: '',
      itEditor: '',
      legalAdvisor: '',
      advisor: '',
      coEditor: '',
      companyName: '',
      pressName: '',
      departmentRegNo: '',
      pressCouncilNo: '',
      facebookUrl: '',
      whatsappNumber: '',
      twitterUrl: '',
      instagramUrl: '',
      youtubeUrl: '',
      copyrightText: '',
      aboutText: '',
      logoUrl: '',
      bgMediaUrl: '',
      bgMediaType: 'image',
      usefulLinks: [],
      isActive: true
    });
    setEditMode(false);
    setSelectedFooter(null);
    setShowForm(false);
    setLogoPreview(null);
    setLogoFile(null);
    setBgPreview(null);
    setBgFile(null);
    setBgMediaType('image');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {alert.show && (
        <div className={`mb-4 p-4 rounded-lg ${
          alert.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {alert.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Footer Settings</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FaPlus />
          {showForm ? 'Cancel' : (footers.length > 0 ? 'Edit Footer' : 'Add Footer')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">
            {editMode ? 'Edit Footer Configuration' : 'Create New Footer Configuration'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Logo</h3>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Logo</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors">
                      <FaUpload />
                      <span>Choose Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    {logoPreview && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <FaTimes />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Recommended: PNG or JPG, max 5MB</p>
                </div>
                
                {logoPreview && (
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className="h-20 w-auto object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Background Media Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Background Media (Image or Video)</h3>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Background Media</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors">
                      <FaUpload />
                      <span>Choose Image or Video</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleBgMediaChange}
                        className="hidden"
                      />
                    </label>
                    {bgPreview && (
                      <button
                        type="button"
                        onClick={removeBgMedia}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <FaTimes />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Supported: Images (JPG, PNG, GIF) or Videos (MP4, WebM), max 10MB</p>
                  {bgPreview && (
                    <p className="text-xs text-blue-600 mt-1">
                      Media Type: {bgMediaType === 'image' ? '🖼️ Image' : '🎬 Video'} ({bgPreview.length > 100 ? `${Math.round(bgPreview.length / 1024)}KB` : 'small'})
                    </p>
                  )}
                </div>
                
                {bgPreview && (
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4 max-w-xs">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                    {bgMediaType === 'image' ? (
                      <img 
                        src={bgPreview} 
                        alt="Background preview" 
                        className="h-24 w-auto object-contain"
                      />
                    ) : (
                      <video 
                        src={bgPreview} 
                        className="h-24 w-auto object-contain"
                        controls
                        muted
                        loop
                        playsInline
                      />
                    )}
                    <p className="text-xs text-gray-500 mt-2 truncate max-w-full">
                      Size: {bgPreview.length > 100 ? `${Math.round(bgPreview.length / 1024)}KB` : 'small'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Rest of the form fields... (keep the same as before) */}
            {/* Team Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Team Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chairman / Chief Editor</label>
                  <input
                    type="text"
                    name="chairman"
                    value={formData.chairman}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., लवदेव ढुंगाना"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IT Editor</label>
                  <input
                    type="text"
                    name="itEditor"
                    value={formData.itEditor}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., सुमन सुवेदी"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Legal Advisor</label>
                  <input
                    type="text"
                    name="legalAdvisor"
                    value={formData.legalAdvisor}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., अधिवक्ता शान्ति रिजाल"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Advisor</label>
                  <input
                    type="text"
                    name="advisor"
                    value={formData.advisor}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., राधेश्याम पौडेल"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Co-Editor</label>
                  <input
                    type="text"
                    name="coEditor"
                    value={formData.coEditor}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., राधा पौडेल"
                  />
                </div>
              </div>
            </div>

            {/* Company Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., सम्पादक मिडिया प्रा.लि."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., सदनमार्ग, ग्वार्को"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Press Name</label>
                  <input
                    type="text"
                    name="pressName"
                    value={formData.pressName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., कैलाश प्रेस नेपाल"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Reg. No.</label>
                  <input
                    type="text"
                    name="departmentRegNo"
                    value={formData.departmentRegNo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., ८९६/२०८/८९"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Press Council No.</label>
                  <input
                    type="text"
                    name="pressCouncilNo"
                    value={formData.pressCouncilNo}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., ८९६/२०८/८९"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+977-1-1234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="info@example.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">About Text</label>
                  <textarea
                    name="aboutText"
                    value={formData.aboutText}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description about your news portal..."
                  />
                </div>
              </div>
            </div>

            {/* Useful Links Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 flex-1">Useful Links (उपयोगी लिङ्कहरू)</h3>
                <button
                  type="button"
                  onClick={addUsefulLink}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FaPlus />
                  Add Link
                </button>
              </div>
              
              {formData.usefulLinks.length === 0 ? (
                <p className="text-gray-500 text-sm mb-4">No useful links added yet. Click "Add Link" to create one.</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {formData.usefulLinks.map((link, index) => (
                    <div key={index} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Link Text</label>
                          <input
                            type="text"
                            value={link.text}
                            onChange={(e) => updateUsefulLink(index, 'text', e.target.value)}
                            placeholder="e.g., गृह मन्त्रालय"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
                          <input
                            type="url"
                            value={link.url}
                            onChange={(e) => updateUsefulLink(index, 'url', e.target.value)}
                            placeholder="https://example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUsefulLink(index)}
                        className="mt-6 text-red-600 hover:text-red-800 transition-colors"
                        title="Remove link"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Social Media Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Social Media Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Facebook URL</label>
                  <input
                    type="url"
                    name="facebookUrl"
                    value={formData.facebookUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number</label>
                  <input
                    type="text"
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+9779812345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Twitter URL</label>
                  <input
                    type="url"
                    name="twitterUrl"
                    value={formData.twitterUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL</label>
                  <input
                    type="url"
                    name="instagramUrl"
                    value={formData.instagramUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">YouTube URL</label>
                  <input
                    type="url"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://youtube.com/yourchannel"
                  />
                </div>
              </div>
            </div>

            {/* Copyright Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Copyright & Powered By</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Copyright Text</label>
                <input
                  type="text"
                  name="copyrightText"
                  value={formData.copyrightText}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="© 2025 Your Company. All Rights Reserved"
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Set as Active Footer
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaSave />
                {editMode ? 'Update Footer' : 'Create Footer'}
              </button>
              {editMode && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Footer List */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Logo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Background
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {footers.map((footer) => (
                <tr key={footer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {footer.logoUrl ? (
                      <img 
                        src={footer.logoUrl} 
                        alt="Logo" 
                        className="h-12 w-12 object-contain"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                        No Logo
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{footer.companyName || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{footer.chairman || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{footer.email || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{footer.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {footer.bgMediaUrl ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {footer.bgMediaType === 'image' ? '🖼️' : '🎬'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {footer.bgMediaType === 'image' ? 'Image' : 'Video'}
                        </span>
                        {footer.bgMediaUrl.length > 100 && (
                          <span className="text-xs text-gray-400">
                            ({Math.round(footer.bgMediaUrl.length / 1024)}KB)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No BG</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      footer.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {footer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(footer.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleToggle(footer.id)}
                        className={`${
                          footer.isActive ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'
                        } transition-colors`}
                        title={footer.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {footer.isActive ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                      </button>
                      <button
                        onClick={() => handleEdit(footer)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Edit"
                      >
                        <FaEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(footer.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete"
                      >
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {footers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No footer configurations found. Create one to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FooterSettings;