import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Edit2, Trash2, Save, X, Loader, 
  Upload, Eye, EyeOff, AlertCircle, ChevronUp, ChevronDown,
  Mail, Phone, Globe
} from 'lucide-react';
import axiosInstance from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

// Team Member Form Modal
const TeamMemberModal = ({ show, member, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    bio: '',
    email: '',
    phone: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: ''
    },
    isActive: true
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        position: member.position || '',
        bio: member.bio || '',
        email: member.email || '',
        phone: member.phone || '',
        socialLinks: member.socialLinks || {
          facebook: '',
          twitter: '',
          linkedin: '',
          instagram: ''
        },
        isActive: member.isActive !== undefined ? member.isActive : true
      });
      setImagePreview(member.imageUrl ? `${API_URL}${member.imageUrl}` : null);
    } else {
      setFormData({
        name: '',
        position: '',
        bio: '',
        email: '',
        phone: '',
        socialLinks: {
          facebook: '',
          twitter: '',
          linkedin: '',
          instagram: ''
        },
        isActive: true
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setErrors({});
  }, [member, show]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, image: 'Image must be less than 5MB' });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors({ ...errors, image: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.position.trim()) {
      newErrors.position = 'Position is required';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('position', formData.position);
      submitData.append('bio', formData.bio);
      submitData.append('email', formData.email);
      submitData.append('phone', formData.phone);
      submitData.append('socialLinks', JSON.stringify(formData.socialLinks));
      submitData.append('isActive', formData.isActive);
      
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to save' });
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-gray-900">
            {member ? 'Edit Team Member' : 'Add Team Member'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <Upload size={32} className="text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer font-medium"
                >
                  <Upload size={18} />
                  Choose Photo
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG or WebP. Max 5MB
                </p>
              </div>
            </div>
            {errors.image && <p className="mt-2 text-sm text-red-600">{errors.image}</p>}
          </div>

          {/* Name & Position */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Please enter your full name: "
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Position/Role *
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.position ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Managing Director"
              />
              {errors.position && <p className="mt-1 text-sm text-red-600">{errors.position}</p>}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Biography
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Brief bio about the team member..."
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="name@gmail.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="+977 9800000000"
              />
            </div>
          </div>

          {/* Social Links */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Social Media Links
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="url"
                value={formData.socialLinks.facebook}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, facebook: e.target.value }
                })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Facebook URL"
              />
              <input
                type="url"
                value={formData.socialLinks.twitter}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, twitter: e.target.value }
                })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Twitter URL"
              />
              <input
                type="url"
                value={formData.socialLinks.linkedin}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, linkedin: e.target.value }
                })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="LinkedIn URL"
              />
              <input
                type="url"
                value={formData.socialLinks.instagram}
                onChange={(e) => setFormData({
                  ...formData,
                  socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Instagram URL"
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-700">Active Status</p>
              <p className="text-sm text-gray-500">Show this member on public page</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.isActive ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {member ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
function Ourteamsetting() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchTeamMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate]);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/team?includeInactive=true');
      setTeamMembers(response.data.team || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching team members:', err);
      setError('Failed to load team members');
      showToast('Failed to load team members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setShowAddModal(true);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setShowAddModal(true);
  };

  const handleDeleteMember = async (member) => {
    if (!window.confirm(`Delete ${member.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/team/${member.id}`);
      setTeamMembers(teamMembers.filter(m => m.id !== member.id));
      showToast('Team member deleted successfully', 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showToast(err.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const handleToggleActive = async (member) => {
    try {
      await axiosInstance.patch(`/api/team/${member.id}/toggle`);
      setTeamMembers(teamMembers.map(m => 
        m.id === member.id ? { ...m, isActive: !m.isActive } : m
      ));
      showToast(`Member ${!member.isActive ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
      console.error('Toggle error:', err);
      showToast('Failed to toggle status', 'error');
    }
  };

  const handleSaveMember = async (formData) => {
    try {
      let response;
      if (editingMember) {
        response = await axiosInstance.put(`/api/team/${editingMember.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setTeamMembers(teamMembers.map(m => 
          m.id === editingMember.id ? response.data.team : m
        ));
        showToast('Team member updated successfully', 'success');
      } else {
        response = await axiosInstance.post('/api/team', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setTeamMembers([...teamMembers, response.data.team]);
        showToast('Team member created successfully', 'success');
      }
      setShowAddModal(false);
    } catch (err) {
      console.error('Save member error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to save';
      showToast(errorMsg, 'error');
      throw err;
    }
  };

  const handleReorder = async (memberId, direction) => {
    const currentIndex = teamMembers.findIndex(m => m.id === memberId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= teamMembers.length) return;

    const newMembers = [...teamMembers];
    [newMembers[currentIndex], newMembers[newIndex]] = 
    [newMembers[newIndex], newMembers[currentIndex]];
    
    setTeamMembers(newMembers);

    try {
      await axiosInstance.post('/api/team/reorder', {
        teamIds: newMembers.map(m => m.id)
      });
      showToast('Team members reordered', 'success');
    } catch (err) {
      console.error('Reorder error:', err);
      showToast('Failed to reorder', 'error');
      fetchTeamMembers();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading team members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white font-medium`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="text-blue-600" />
                Team Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your team members - {teamMembers.length} total
              </p>
            </div>
            <button
              onClick={handleAddMember}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm"
            >
              <Plus size={20} />
              Add Member
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {teamMembers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Team Members Yet</h3>
            <p className="text-gray-500 mb-6">Add your first team member to get started</p>
            <button
              onClick={handleAddMember}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Add First Member
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member, index) => (
              <div key={member.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="relative h-48 bg-gray-200">
                  {member.imageUrl ? (
                    <img
                      src={`${API_URL}${member.imageUrl}`}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users size={64} className="text-gray-400" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <button
                      onClick={() => handleToggleActive(member)}
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        member.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {member.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                      {member.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Order Controls */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <button
                      onClick={() => handleReorder(member.id, 'up')}
                      disabled={index === 0}
                      className="p-1 bg-white rounded shadow hover:bg-gray-50 disabled:opacity-30"
                    >
                      <ChevronUp size={16} />
                    </button>
                    <button
                      onClick={() => handleReorder(member.id, 'down')}
                      disabled={index === teamMembers.length - 1}
                      className="p-1 bg-white rounded shadow hover:bg-gray-50 disabled:opacity-30"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{member.name}</h3>
                  <p className="text-sm text-blue-600 font-medium mb-3">{member.position}</p>
                  
                  {member.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{member.bio}</p>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4">
                    {member.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail size={14} />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Social Links */}
                  {member.socialLinks && Object.values(member.socialLinks).some(link => link) && (
                    <div className="flex gap-2 mb-4">
                      {Object.entries(member.socialLinks).map(([platform, url]) => 
                        url && (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Globe size={16} />
                          </a>
                        )
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      onClick={() => handleEditMember(member)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium"
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMember(member)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      <TeamMemberModal
        show={showAddModal}
        member={editingMember}
        onClose={() => {
          setShowAddModal(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
      />
    </div>
  );
}

export default Ourteamsetting;