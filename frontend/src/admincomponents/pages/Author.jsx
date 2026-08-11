import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

function Authors() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  
  // Form states
  const [invitationToken] = useState('');
  const [editForm, setEditForm] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'journalist'
  });

  // Fetch all admins
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin');
      setAdmins(response.data.admins);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  // Open create modal
  const handleOpenCreateModal = () => {
    setCreateForm({
      email: '',
      password: '',
      confirmPassword: '',
      role: 'journalist'
    });
    setShowCreateModal(true);
    setError('');
  };

  // Handle create form submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!createForm.email || !createForm.password) {
      setError('Email and password are required');
      return;
    }

    if (createForm.password !== createForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (createForm.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post('/api/admin', {
        email: createForm.email,
        password: createForm.password,
        role: createForm.role
      });

      setSuccessMessage(`${createForm.role === 'superadmin' ? 'Super Admin' : createForm.role === 'admin' ? 'Admin' : 'Journalist'} created successfully!`);
      setShowCreateModal(false);
      fetchAdmins();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 
                       err.response?.data?.errors?.join(', ') || 
                       'Failed to create user';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const handleEdit = (admin) => {
    setSelectedAdmin(admin);
    setEditForm({
      email: admin.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowEditModal(true);
  };

  // Handle edit form submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (editForm.newPassword && editForm.newPassword !== editForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const updateData = { email: editForm.email };

      if (editForm.newPassword) {
        updateData.password = editForm.newPassword;
        if (!isSuperAdmin) {
          updateData.currentPassword = editForm.currentPassword;
        }
      }

      await axiosInstance.put(`/api/admin/${selectedAdmin.id}`, updateData);
      setSuccessMessage('Admin updated successfully!');
      setShowEditModal(false);
      fetchAdmins();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update admin');
    }
  };

  // Delete admin
  const handleDelete = async (id, email) => {
    if (!window.confirm(`Are you sure you want to delete ${email}?`)) {
      return;
    }

    try {
      await axiosInstance.delete(`/api/admin/${id}`);
      setSuccessMessage('Admin deleted successfully!');
      fetchAdmins();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete admin');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Copy invitation link
  const copyInvitationLink = () => {
    const inviteLink = `${window.location.origin}/register?token=${invitationToken}`;
    navigator.clipboard.writeText(inviteLink);
    setSuccessMessage('Invitation link copied to clipboard!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  if (loading && admins.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading admins...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600 text-sm mt-1">
            {isSuperAdmin ? 'Manage admins and journalists' : 'View users (only superadmins can add or manage users)'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isSuperAdmin && (
            <button 
              onClick={handleOpenCreateModal}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create User
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg animate-slideDown">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg animate-slideDown">
          {successMessage}
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        admin.role === 'superadmin' 
                          ? 'bg-red-100 text-red-800' 
                          : admin.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                      }`}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {isSuperAdmin ? (
                        <>
                          <button 
                            onClick={() => handleEdit(admin)}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(admin.id, admin.email)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic">View only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Create New User</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="journalist">Journalist</option>
                    <option value="admin">Admin</option>
                    {isSuperAdmin && <option value="superadmin">Super Admin</option>}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {createForm.role === 'superadmin' 
                      ? 'Full access including admin logs (superadmin only)' 
                      : createForm.role === 'admin' 
                        ? 'Full access to all features' 
                        : 'Can create and manage articles'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    placeholder="user@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                    placeholder="Minimum 8 characters"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 8 characters with uppercase, lowercase, number, and special character
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm({...createForm, confirmPassword: e.target.value})}
                    placeholder="Re-enter password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </div>
              <div className="flex gap-3 p-6 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invitation Modal */}
      {showInviteModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowInviteModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Invitation Created</h2>
              <button 
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">Share this invitation link with the new user:</p>
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={`${window.location.origin}/register?token=${invitationToken}`}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button 
                  onClick={copyInvitationLink}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Copy
                </button>
              </div>
              <p className="text-sm text-gray-500">This link will expire in 24 hours</p>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Edit User</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-white text-sm text-gray-500 font-medium">
                      Change Password 
                    </span>
                  </div>
                </div>

                {isSuperAdmin ? (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
                    As a Super Admin you can directly set a new password without entering the current password.
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={editForm.currentPassword}
                      onChange={(e) => setEditForm({...editForm, currentPassword: e.target.value})}
                      placeholder="Required if changing password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={editForm.newPassword}
                    onChange={(e) => setEditForm({...editForm, newPassword: e.target.value})}
                    placeholder="Leave blank to keep current password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={editForm.confirmPassword}
                    onChange={(e) => setEditForm({...editForm, confirmPassword: e.target.value})}
                    placeholder="Confirm new password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </div>
              <div className="flex gap-3 p-6 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Authors;