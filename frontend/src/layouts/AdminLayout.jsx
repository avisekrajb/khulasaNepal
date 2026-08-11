// src/layouts/AdminLayout.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminNav from '../admincomponents/components/AdminNav';

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      {/* Main Content Area with proper spacing for sidebar */}
      <main className="md:ml-72 transition-all duration-300 ease-in-out min-h-screen">
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;