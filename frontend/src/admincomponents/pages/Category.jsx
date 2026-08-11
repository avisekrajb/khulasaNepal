import React, { useState, useEffect } from 'react';
import { 
  Tag, Plus, Edit2, Trash2, Save, X, Loader, 
  ToggleLeft, ToggleRight, AlertCircle, Shield, 
  ChevronUp, ChevronDown, Eye, EyeOff
} from 'lucide-react';
import axiosInstance from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AVAILABLE_COLORS = [
  { value: 'blue', label: 'Blue', bg: 'bg-blue-500', text: 'text-blue-700', bgLight: 'bg-blue-50' },
  { value: 'green', label: 'Green', bg: 'bg-green-500', text: 'text-green-700', bgLight: 'bg-green-50' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-500', text: 'text-purple-700', bgLight: 'bg-purple-50' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-500', text: 'text-orange-700', bgLight: 'bg-orange-50' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-500', text: 'text-pink-700', bgLight: 'bg-pink-50' },
  { value: 'red', label: 'Red', bg: 'bg-red-500', text: 'text-red-700', bgLight: 'bg-red-50' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-500', text: 'text-yellow-700', bgLight: 'bg-yellow-50' },
  { value: 'teal', label: 'Teal', bg: 'bg-teal-500', text: 'text-teal-700', bgLight: 'bg-teal-50' },
  { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', text: 'text-indigo-700', bgLight: 'bg-indigo-50' },
  { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', text: 'text-cyan-700', bgLight: 'bg-cyan-50' },
];

// Category Form Modal Component
const CategoryModal = ({ show, category, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    value: '',
    label: '',
    color: 'blue',
    description: '',
    isActive: true
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setFormData({
        value: category.value || '',
        label: category.label || '',
        color: category.color || 'blue',
        description: category.description || '',
        isActive: category.isActive !== undefined ? category.isActive : true
      });
    } else {
      setFormData({
        value: '',
        label: '',
        color: 'blue',
        description: '',
        isActive: true
      });
    }
    setErrors({});
  }, [category, show]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.value.trim()) {
      newErrors.value = 'Value is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.value)) {
      newErrors.value = 'Value must contain only lowercase letters, numbers, and hyphens';
    }
    
    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {category ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Value Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Value (Slug) *
            </label>
            <input
              type="text"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value.toLowerCase() })}
              disabled={category?.isProtected}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.value ? 'border-red-500' : 'border-gray-300'
              } ${category?.isProtected ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="e.g., entertainment"
            />
            {errors.value && (
              <p className="mt-1 text-sm text-red-600">{errors.value}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          {/* Label Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Label (Display Name) *
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.label ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., मनोरञ्जन (Entertainment)"
            />
            {errors.label && (
              <p className="mt-1 text-sm text-red-600">{errors.label}</p>
            )}
          </div>

          {/* Color Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-5 gap-2">
              {AVAILABLE_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`h-10 rounded-lg ${color.bg} transition-all ${
                    formData.color === color.value
                      ? 'ring-4 ring-offset-2 ring-gray-400 scale-110'
                      : 'hover:scale-105'
                  }`}
                  title={color.label}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Selected: {AVAILABLE_COLORS.find(c => c.value === formData.color)?.label}
            </p>
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Brief description for admin reference"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-gray-700">Active Status</p>
              <p className="text-sm text-gray-500">Show this category on the website</p>
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

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {category ? 'Update' : 'Create'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Category Component
function Category() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    fetchCategories();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate]);

const fetchCategories = async () => {
  try {
    setLoading(true);
    console.log('🔍 Fetching categories from: /api/categories');
    
    const response = await axiosInstance.get('/api/categories', {
      params: {
        includeInactive: 'true',
        includeProtected: 'true'
      }
    });
    
    console.log('✅ Categories received:', response.data);
    setCategories(response.data.categories || []);
    setError(null);
  } catch (err) {
    console.error('❌ Error fetching categories:', err);
    console.error('Error details:', {
      message: err.message,
      response: err.response?.data,
      status: err.response?.status
    });
    setError('Failed to load categories');
    showToast('Failed to load categories', 'error');
    setCategories([]);
  } finally {
    setLoading(false);
  }
};

  const fetchStats = async () => {
    try {
      const response = await axiosInstance.get('/api/categories/stats');
      const statsMap = {};
      response.data.stats.forEach(stat => {
        statsMap[stat.id] = stat.newsCount;
      });
      setStats(statsMap);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowAddModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowAddModal(true);
  };

  const handleDeleteCategory = async (category) => {
    if (category.isProtected) {
      showToast('Cannot delete protected system category', 'error');
      return;
    }

    const newsCount = stats[category.id] || 0;
    if (newsCount > 0) {
      showToast(`Cannot delete category with ${newsCount} articles`, 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${category.label}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/categories/${category.id}`);
      setCategories(categories.filter(c => c.id !== category.id));
      showToast('Category deleted successfully', 'success');
      fetchStats();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to delete category';
      showToast(errorMsg, 'error');
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await axiosInstance.patch(`/api/categories/${category.id}/toggle`);
      setCategories(categories.map(c => 
        c.id === category.id ? { ...c, isActive: !c.isActive } : c
      ));
      showToast(`Category ${!category.isActive ? 'activated' : 'deactivated'} successfully`, 'success');
    } catch {
      showToast('Failed to toggle category status', 'error');
    }
  };

  const handleSaveCategory = async (categoryData) => {
    try {
      if (editingCategory) {
        const response = await axiosInstance.put(`/api/categories/${editingCategory.id}`, categoryData);
        setCategories(categories.map(c => 
          c.id === editingCategory.id ? response.data.category : c
        ));
        showToast('Category updated successfully', 'success');
      } else {
        const response = await axiosInstance.post('/api/categories', categoryData);
        setCategories([...categories, response.data.category]);
        showToast('Category created successfully', 'success');
      }
      setShowAddModal(false);
      fetchStats();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to save category';
      showToast(errorMsg, 'error');
      throw err;
    }
  };

  const handleReorder = async (categoryId, direction) => {
    const currentIndex = categories.findIndex(c => c.id === categoryId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const newCategories = [...categories];
    [newCategories[currentIndex], newCategories[newIndex]] = 
    [newCategories[newIndex], newCategories[currentIndex]];
    
    setCategories(newCategories);

    try {
      await axiosInstance.post('/categories/reorder', {
        categoryIds: newCategories.map(c => c.id)
      });
      showToast('Categories reordered successfully', 'success');
    } catch {
      showToast('Failed to reorder categories', 'error');
      fetchCategories();
    }
  };

  const getColorClasses = (color) => {
    const colorObj = AVAILABLE_COLORS.find(c => c.value === color);
    return colorObj || AVAILABLE_COLORS[0];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 font-medium">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl animate-slide-in ${
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
                <Tag className="text-blue-600" />
                Category Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage news categories - {categories.length} total
              </p>
            </div>
            <button
              onClick={handleAddCategory}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-sm hover:shadow-md"
            >
              <Plus size={20} />
              Add Category
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

        {categories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Categories Yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first category</p>
            <button
              onClick={handleAddCategory}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create First Category
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Articles
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categories.map((category, index) => {
                    const colorClasses = getColorClasses(category.color);
                    const newsCount = stats[category.id] || 0;
                    
                    return (
                      <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                        {/* Order Controls */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleReorder(category.id, 'up')}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move Up"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              onClick={() => handleReorder(category.id, 'down')}
                              disabled={index === categories.length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move Down"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>
                        </td>

                        {/* Category Label */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{category.label}</span>
                            {category.isProtected && (
                              <Shield size={16} className="text-yellow-600" title="Protected Category" />
                            )}
                          </div>
                          {category.description && (
                            <p className="text-sm text-gray-500 mt-1">{category.description}</p>
                          )}
                        </td>

                        {/* Value */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <code className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-mono">
                            {category.value}
                          </code>
                        </td>

                        {/* Color */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded ${colorClasses.bg}`} />
                            <span className="text-sm text-gray-600 capitalize">{category.color}</span>
                          </div>
                        </td>

                        {/* Articles Count */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {newsCount}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleActive(category)}
                            className="flex items-center gap-2"
                          >
                            {category.isActive ? (
                              <>
                                <Eye size={18} className="text-green-600" />
                                <span className="text-sm font-medium text-green-600">Active</span>
                              </>
                            ) : (
                              <>
                                <EyeOff size={18} className="text-gray-400" />
                                <span className="text-sm font-medium text-gray-400">Inactive</span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditCategory(category)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Category"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              disabled={category.isProtected || newsCount > 0}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title={
                                category.isProtected 
                                  ? 'Protected - Cannot Delete'
                                  : newsCount > 0 
                                    ? `Has ${newsCount} articles`
                                    : 'Delete Category'
                              }
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">🔵 Active Categories</h3>
            <p className="text-2xl font-bold text-blue-700">
              {categories.filter(c => c.isActive).length}
            </p>
            <p className="text-sm text-blue-600 mt-1">Visible on website</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">🛡️ Protected Categories</h3>
            <p className="text-2xl font-bold text-yellow-700">
              {categories.filter(c => c.isProtected).length}
            </p>
            <p className="text-sm text-yellow-600 mt-1">Cannot be deleted</p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">📝 Total Articles</h3>
            <p className="text-2xl font-bold text-green-700">
              {Object.values(stats).reduce((sum, count) => sum + count, 0)}
            </p>
            <p className="text-sm text-green-600 mt-1">Across all categories</p>
          </div>
        </div>
      </main>

      {/* Category Modal */}
      <CategoryModal
        show={showAddModal}
        category={editingCategory}
        onClose={() => {
          setShowAddModal(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
      />
    </div>
  );
}

export default Category;