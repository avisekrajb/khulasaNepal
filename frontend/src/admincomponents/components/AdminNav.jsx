import React, { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  const userEmail = user?.email || 'admin';
  const isSuperAdmin = user?.role === 'superadmin';

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const toggleMenu = useCallback((menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  }, []);

  const handleNavigation = useCallback((path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  }, [navigate]);

  const menuItems = useMemo(
    () => [
      {
        name: 'Dashboard',
        path: isSuperAdmin ? '/superadmin/dashboard' : '/admin/dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
        subItems: [],
      },
      {
        name: 'Manage news',
        path: '/admin/local',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        subItems: [
          { name: 'View All', path: '/admin/local' },
          { name: 'Add New', path: '/admin/local/add' },
        ],
      },
      {
        name: 'Category',
        path: '/admin/category',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        ),
        subItems: [
          { name: 'View All', path: '/admin/category' },
        ],
      },
      {
        name: 'Ads',
        path: '/admin/ads',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1zm13-1v4m3-6v8m-6-5.5a2.5 2.5 0 010 3" />
          </svg>
        ),
        subItems: [
          { name: 'Ads Management', path: '/admin/ads' },
        ],
      },
      {
        name: 'Comments',
        path: '/admin/comments',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
        subItems: [
          { name: 'All Comments', path: '/admin/comments' },
        ],
      },
      {
        name: 'Settings',
        path: '/admin/settings',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
        subItems: [
          { name: 'General Settings', path: '/admin/settings' },
          { name: 'Author', path: '/admin/author' },
          { name: 'Our Team', path: '/admin/ourteamsetting' },
          { name: 'Footer Settings', path: '/admin/footer-settings' },
        ],
      },
      ...(isSuperAdmin
        ? [
            {
              name: 'Superadmin',
              path: '/superadmin/dashboard',
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              subItems: [
                { name: 'Dashboard', path: '/superadmin/dashboard' },
                { name: 'Admin Logs', path: '/superadmin/logs' },
                { name: 'Comments', path: '/superadmin/comment' },
                { name: 'Visitors', path: '/superadmin/visitory' },
                { name: 'Add Admin', path: '/superadmin/seeting' },
              ],
            },
          ]
        : []),
    ],
    [isSuperAdmin]
  );

  const isActive = useCallback((path) => location.pathname === path || location.pathname.startsWith(`${path}/`), [location.pathname]);

  const renderMenuItem = useCallback(
    (item, isMobile = false) => {
      const hasSubItems = item.subItems?.length > 0;
      const isExpanded = expandedMenus[item.name];

      return (
        <div key={item.name} className="relative">
          <button
            onClick={() => (hasSubItems ? toggleMenu(item.name) : handleNavigation(item.path))}
            className={`w-full group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }`}
            title={item.name}
          >
            <div className="flex-shrink-0">{item.icon}</div>

            {(!isCollapsed || isMobile) && (
              <>
                <span className="font-medium text-sm flex-1 text-left">{item.name}</span>
                {hasSubItems && (
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </>
            )}
          </button>

          {hasSubItems && (!isCollapsed || isMobile) && (
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="ml-8 space-y-1">
                {item.subItems.map((subItem) => (
                  <button
                    key={subItem.path}
                    onClick={() => handleNavigation(subItem.path)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${
                      isActive(subItem.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <span className="font-medium">{subItem.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    },
    [expandedMenus, isCollapsed, toggleMenu, handleNavigation, isActive]
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-gray-900 text-white shadow-xl border-r border-gray-800 transform transition-all duration-300 ease-in-out hidden md:block ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
          {!isCollapsed && (
            <span className="text-xl font-bold text-white">
              Khulasha Panel
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 h-[calc(100vh-128px)]">
          <div className="space-y-1">{menuItems.map((item) => renderMenuItem(item))}</div>
        </nav>

        {/* User & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-900">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                {userEmail?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{userEmail}</p>
                <p className="text-xs text-gray-400">{user?.role || 'Admin'}</p>
              </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 mb-2 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                {userEmail?.[0]?.toUpperCase() || 'A'}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-40 p-3 rounded-lg bg-gray-900 hover:bg-gray-800 shadow-lg border border-gray-800 md:hidden transition-all duration-200"
        title="Open Menu"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 text-white shadow-xl border-r border-gray-800 md:hidden transform transition-transform duration-300 ease-in-out">
            {/* Mobile Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
              <span className="text-xl font-bold text-white">
                Khulasha Panel
              </span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 h-[calc(100vh-144px)]">
              <div className="space-y-1">{menuItems.map((item) => renderMenuItem(item, true))}</div>
            </nav>

            {/* Mobile User & Logout */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-900">
              <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                {userEmail?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{userEmail}</p>
                <p className="text-xs text-gray-400">{user?.role || 'Admin'}</p>
              </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default AdminNav;