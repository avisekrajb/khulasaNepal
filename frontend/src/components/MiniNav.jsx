import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Menu, X, Home, Sun, Moon, Search, Globe, XCircle } from 'lucide-react';
import axiosInstance from '../api/axios';
import fallbackLogo from '../assets/image/khulashafallbacklogo.png';
import { useTheme } from '../context/ThemeContext';
import { useSearch } from '../context/SearchContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

// Debounce function for search
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

function MiniNav() {
  const { isDark, toggleTheme } = useTheme();
  const { 
    searchQuery, 
    setSearchQuery, 
    searchResults, 
    setSearchResults,
    isSearching, 
    setIsSearching,
    searchError,
    setSearchError,
    showSearch,
    setShowSearch,
    clearSearch
  } = useSearch();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const [highlightedResults, setHighlightedResults] = useState([]);
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('home');
  const [scrolled, setScrolled] = useState(false);
  const [logoUrl, setLogoUrl] = useState(null);
  const [logoLoading, setLogoLoading] = useState(true);

  // Fixed menu items in exact order - 7 items
  const menuItems = [
    { name: 'मोहर', path: '/', value: 'home', icon: Home },
    { name: 'समाचार', path: '/news', value: 'news' },
    { name: 'समाज', path: '/society', value: 'society' },
    { name: 'स्थानीय', path: '/local', value: 'local' },
    { name: 'सुशासन', path: '/governance', value: 'governance' },
    { name: 'खेलकुद', path: '/sports', value: 'sports' },
    { name: 'बिबीध', path: '/more', value: 'more' }
  ];

  // ============================================
  // HIGHLIGHT TEXT FUNCTION
  // ============================================
  const highlightText = useCallback((text, query) => {
    if (!query || !text) return text;
    
    const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 1);
    if (queryWords.length === 0) return text;

    const escapeRegex = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    let highlightedText = text;
    const uniqueWords = [...new Set(queryWords)];

    uniqueWords.forEach(word => {
      const regex = new RegExp(`(${escapeRegex(word)})`, 'gi');
      highlightedText = highlightedText.replace(regex, (match) => {
        const isPartialMatch = match.length < word.length || match.toLowerCase() !== word.toLowerCase();
        return `<span class="search-highlight ${isPartialMatch ? 'partial-match' : 'exact-match'}" style="background-color: #fbbf24; padding: 0 2px; border-radius: 2px; font-weight: 500;">${match}</span>`;
      });
    });

    return highlightedText;
  }, []);

  // ============================================
  // ENHANCED SEARCH FUNCTION
  // ============================================
  const performEnhancedSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHighlightedResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await axiosInstance.get(`/api/news/search?q=${encodeURIComponent(query)}`);
      
      let results = [];
      if (response.data.success) {
        results = response.data.data || [];
      } else {
        results = [];
      }

      const highlighted = results.map(result => ({
        ...result,
        highlightedTitle: highlightText(result.title, query),
        highlightedExcerpt: highlightText(
          result.subtitle || result.paragraph || result.excerpt || '',
          query
        )
      }));

      setSearchResults(results);
      setHighlightedResults(highlighted);
    } catch (err) {
      console.error('Search error:', err);
      setSearchError('Failed to perform search');
      setSearchResults([]);
      setHighlightedResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [highlightText, setSearchResults, setIsSearching, setSearchError]);

  // ============================================
  // DEBOUNCED SEARCH
  // ============================================
  const debouncedSearch = useMemo(
    () => debounce(performEnhancedSearch, 300),
    [performEnhancedSearch]
  );

  // ============================================
  // HANDLE SEARCH INPUT CHANGE
  // ============================================
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      setSearchResults([]);
      setHighlightedResults([]);
    }
  };

  // ============================================
  // HANDLE SEARCH RESULT CLICK
  // ============================================
  const handleResultClick = (result) => {
    const category = result.category || 'news';
    navigate(`/${category}/${result.id}`);
    clearSearch();
    setShowSearch(false);
    setHighlightedResults([]);
  };

  // ============================================
  // HANDLE UNICODE CLICK - Direct navigation
  // ============================================
  const handleUnicodeClick = () => {
    navigate('/unicodeconverter');
  };

  // Fetch logo from backend
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch(`${API_URL}/api/footer/public`);
        if (!response.ok) {
          throw new Error(`Failed to fetch logo: ${response.status}`);
        }
        const data = await response.json();
        if (data.success && data.footer && data.footer.logoUrl) {
          setLogoUrl(data.footer.logoUrl);
        }
      } catch (err) {
        console.error('Error fetching logo:', err);
      } finally {
        setLogoLoading(false);
      }
    };

    fetchLogo();
  }, []);

  // Set active category from URL
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath === '/') {
      setActiveCategory('home');
    } else {
      const pathCategory = currentPath.split('/')[1];
      const pathMap = {
        'news': 'news',
        'society': 'society',
        'local': 'local',
        'governance': 'governance',
        'sports': 'sports',
        'miscellaneous': 'miscellaneous'
      };
      setActiveCategory(pathMap[pathCategory] || 'home');
    }
  }, []);

  // Throttled scroll handler with RAF
  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
      scrollTimeout = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 200);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
    };
  }, []);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        // Don't close search if clicking inside search
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get display results (highlighted or raw)
  const displayResults = highlightedResults.length > 0 ? highlightedResults : searchResults;

  return (
    <div className={`sticky top-0 z-[100] transition-all duration-300 ${
      scrolled
        ? 'bg-[#123E8C] shadow-2xl border-b border-blue-700/50'
        : 'bg-[#123E8C] shadow-md border-b border-blue-700/30'
    }`}>

      <div className="max-w-7xl mx-auto px-6">
        {/* Desktop Navigation */}
        <nav className="hidden lg:flex py-4 items-center">
          {/* Logo - Only visible when scrolled */}
          {scrolled && (
            <div className="mr-6 flex-shrink-0 transition-opacity duration-200">
              <a href="/" className="block">
                {logoLoading ? (
                  <div className="w-24 h-12 bg-blue-800/30 animate-pulse rounded"></div>
                ) : logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Khulasha Logo"
                    className="h-15 w-auto object-contain transition-transform duration-300 hover:scale-105 rounded-full"
                    onError={(e) => {
                      e.target.src = fallbackLogo;
                    }}
                  />
                ) : (
                  <img
                    src={fallbackLogo}
                    alt="Khulasha Logo"
                    className="h-15 w-auto object-contain transition-transform duration-300 hover:scale-105 rounded-full"
                  />
                )}
              </a>
            </div>
          )}

          <ul className="flex flex-row justify-center items-center gap-6 text-xl font-bold text-white flex-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.value} className="text-center relative group">
                  <a
                    href={item.path}
                    onClick={() => setActiveCategory(item.value)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-lg transition-all duration-300 relative overflow-hidden ${
                      activeCategory === item.value
                        ? 'text-orange-300 bg-blue-700/50'
                        : 'text-white hover:text-orange-300 hover:bg-blue-700/30'
                    }`}
                  >
                    {Icon && <Icon size={18} />}
                    <span className="relative z-10">{item.name}</span>

                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-600/20 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    {activeCategory === item.value && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 via-red-500 to-red-700 rounded-full shadow-lg shadow-red-500/50"></div>
                    )}
                  </a>

                  {activeCategory !== item.value && (
                    <div className="absolute bottom-0 left-1/2 w-0 h-1 bg-gradient-to-r from-orange-400 to-pink-500 group-hover:w-full group-hover:left-0 transition-all duration-300 rounded-full"></div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Right Side: Search, Unicode & Theme Toggle Buttons */}
          <div className="flex items-center gap-2 ml-6 flex-shrink-0">
            {/* Unicode Converter Button - Direct Navigation */}
            <button
              onClick={handleUnicodeClick}
              className="p-1.5 rounded-full transition-all duration-300 text-white hover:text-orange-300 hover:bg-white/10"
              title="Unicode Converter"
            >
              <Globe size={16} />
            </button>

            {/* Search Button */}
            <div className="relative" ref={searchRef}>
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-1.5 rounded-full transition-all duration-300 text-white hover:text-orange-300 hover:bg-white/10"
                title="Search"
              >
                <Search size={16} />
              </button>

              {/* Search Dropdown */}
              {showSearch && (
                <div className={`absolute right-0 mt-2 w-96 rounded-xl shadow-2xl border overflow-hidden z-50 ${
                  isDark
                    ? 'bg-gray-800 border-gray-600'
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="p-3">
                    <div className="relative">
                      <Search size={14} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                        isDark ? 'text-gray-400' : 'text-gray-400'
                      }`} />
                      <input
                        type="text"
                        placeholder="Search news..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className={`w-full pl-8 pr-7 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                        }`}
                        autoFocus
                      />
                      {searchQuery && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSearchResults([]);
                            setHighlightedResults([]);
                          }}
                          className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 ${
                            isDark ? 'hover:bg-gray-600' : ''
                          }`}
                        >
                          <XCircle size={12} className={isDark ? 'text-gray-400' : 'text-gray-400'} />
                        </button>
                      )}
                    </div>

                    {/* Search Stats */}
                    {searchQuery && !isSearching && searchResults.length > 0 && (
                      <div className={`text-xs mt-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Found {searchResults.length} result{searchResults.length > 1 ? 's' : ''}
                      </div>
                    )}

                    {/* Search Results */}
                    {isSearching && (
                      <div className="text-center py-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
                        <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Searching...</p>
                      </div>
                    )}

                    {!isSearching && displayResults.length > 0 && (
                      <div className="mt-2 max-h-60 overflow-y-auto search-results-container">
                        {displayResults.map((result) => (
                          <div
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className={`p-2 rounded-lg cursor-pointer transition-colors ${
                              isDark
                                ? 'hover:bg-gray-700'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            {/* Title with Highlighting */}
                            <div 
                              className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'} line-clamp-2`}
                              dangerouslySetInnerHTML={{ 
                                __html: result.highlightedTitle || result.title 
                              }}
                            />
                            
                            {/* Excerpt with Highlighting */}
                            {(result.subtitle || result.paragraph || result.excerpt) && (
                              <div 
                                className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1 line-clamp-2`}
                                dangerouslySetInnerHTML={{ 
                                  __html: result.highlightedExcerpt || 
                                    (result.subtitle || result.paragraph || result.excerpt)?.substring(0, 150) + '...'
                                }}
                              />
                            )}
                            
                            {/* Meta Info */}
                            <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-1 flex items-center gap-2`}>
                              <span>{result.category || 'News'}</span>
                              <span>•</span>
                              <span>{new Date(result.publishedDate).toLocaleDateString('ne-NP')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!isSearching && searchQuery && displayResults.length === 0 && !searchError && (
                      <div className="text-center py-3">
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          No results found for "{searchQuery}"
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} mt-0.5`}>
                          Try different keywords or check spelling
                        </p>
                      </div>
                    )}

                    {searchError && (
                      <div className="text-center py-3">
                        <p className="text-sm text-red-500">{searchError}</p>
                        <button
                          onClick={() => performEnhancedSearch(searchQuery)}
                          className={`text-xs mt-1.5 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                        >
                          Try again
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Buttons - Modern smaller size */}
            <div className={`flex items-center gap-0.5 rounded-full p-0.5 border ${
              isDark ? 'border-gray-600 bg-gray-800/50' : 'border-white/20 bg-white/10'
            } backdrop-blur-sm`}>
              <button
                onClick={() => {
                  if (isDark) toggleTheme();
                }}
                className={`p-1 rounded-full transition-all duration-300 ${
                  !isDark 
                    ? 'bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-400/30 scale-110' 
                    : 'text-white hover:text-yellow-400 hover:bg-white/10'
                }`}
                title="Light Mode"
              >
                <Sun size={13} className={!isDark ? 'animate-spin-slow' : ''} />
              </button>

              <button
                onClick={() => {
                  if (!isDark) toggleTheme();
                }}
                className={`p-1 rounded-full transition-all duration-300 ${
                  isDark 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110' 
                    : 'text-white hover:text-indigo-400 hover:bg-white/10'
                }`}
                title="Dark Mode"
              >
                <Moon size={13} className={isDark ? 'animate-pulse' : ''} />
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <div className="lg:hidden relative">
          <div className="flex items-center justify-between py-2">
            {/* Logo - Only visible when scrolled on mobile */}
            {scrolled && (
              <div className="flex-shrink-0 transition-opacity duration-200">
                <a href="/" className="block">
                  {logoLoading ? (
                    <div className="w-20 h-10 bg-blue-800/30 animate-pulse rounded"></div>
                  ) : logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Khulasha Logo"
                      className="h-10 w-auto object-contain"
                      onError={(e) => {
                        e.target.src = fallbackLogo;
                      }}
                    />
                  ) : (
                    <img
                      src={fallbackLogo}
                      alt="Khulasha Logo"
                      className="h-10 w-auto object-contain"
                    />
                  )}
                </a>
              </div>
            )}

            <div className="flex items-center gap-1.5 ml-auto">
              {/* Mobile Search Button */}
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-1.5 rounded-full transition-all duration-300 text-white hover:text-orange-300 hover:bg-white/10"
              >
                <Search size={16} />
              </button>

              {/* Mobile Unicode Button - Direct Navigation */}
              <button
                onClick={handleUnicodeClick}
                className="p-1.5 rounded-full transition-all duration-300 text-white hover:text-orange-300 hover:bg-white/10"
              >
                <Globe size={16} />
              </button>

              {/* Mobile Theme Toggle - Modern smaller size */}
              <div className={`flex items-center gap-0.5 rounded-full p-0.5 border ${
                isDark ? 'border-gray-600 bg-gray-800/50' : 'border-white/20 bg-white/10'
              } backdrop-blur-sm`}>
                <button
                  onClick={() => {
                    if (isDark) toggleTheme();
                  }}
                  className={`p-1 rounded-full transition-all duration-300 ${
                    !isDark 
                      ? 'bg-yellow-400 text-gray-900 shadow-lg shadow-yellow-400/30 scale-110' 
                      : 'text-white hover:text-yellow-400 hover:bg-white/10'
                  }`}
                >
                  <Sun size={12} />
                </button>
                <button
                  onClick={() => {
                    if (!isDark) toggleTheme();
                  }}
                  className={`p-1 rounded-full transition-all duration-300 ${
                    isDark 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110' 
                      : 'text-white hover:text-indigo-400 hover:bg-white/10'
                  }`}
                >
                  <Moon size={12} />
                </button>
              </div>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-white focus:outline-none flex justify-end hover:text-orange-300 transition-colors duration-300 relative group"
                aria-label="Toggle menu"
              >
                <div className="relative">
                  {isOpen ? (
                    <X size={24} className="transition-transform duration-200" />
                  ) : (
                    <Menu size={24} className="group-hover:scale-110 transition-transform duration-300" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Search Dropdown */}
          {showSearch && (
            <div className={`absolute top-full left-0 right-0 border-t z-50 shadow-2xl p-3 ${
              isDark
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
            }`}>
              <div className="relative">
                <Search size={14} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isDark ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <input
                  type="text"
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className={`w-full pl-8 pr-7 py-1.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                  }`}
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setHighlightedResults([]);
                    }}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 ${
                      isDark ? 'hover:bg-gray-600' : ''
                    }`}
                  >
                    <XCircle size={12} className={isDark ? 'text-gray-400' : 'text-gray-400'} />
                  </button>
                )}
              </div>

              {/* Mobile Search Results */}
              {isSearching && (
                <div className="text-center py-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto"></div>
                  <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Searching...</p>
                </div>
              )}

              {!isSearching && displayResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto">
                  {displayResults.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        isDark
                          ? 'hover:bg-gray-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div 
                        className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'} line-clamp-2`}
                        dangerouslySetInnerHTML={{ 
                          __html: result.highlightedTitle || result.title 
                        }}
                      />
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                        {result.category || 'News'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {!isSearching && searchQuery && displayResults.length === 0 && !searchError && (
                <div className="text-center py-3">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    No results found for "{searchQuery}"
                  </p>
                </div>
              )}
            </div>
          )}

          {isOpen && (
            <div className="absolute top-full left-0 right-0 border-t z-50 shadow-2xl bg-[#123E8C] border-blue-700/50">
              <ul className="flex flex-col items-center py-6 space-y-4 text-lg font-bold text-white">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.value} className="w-full text-center px-4">
                      <a
                        href={item.path}
                        onClick={() => {
                          setIsOpen(false);
                          setActiveCategory(item.value);
                        }}
                        className={`flex items-center justify-center gap-3 py-3 px-6 rounded-lg transition-all duration-300 ${
                          activeCategory === item.value
                            ? 'bg-blue-700/50 text-orange-300 shadow-lg'
                            : 'hover:bg-blue-700/30 hover:text-orange-300'
                        }`}
                      >
                        {Icon && <Icon size={20} />}
                        <span>{item.name}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Add custom animation styles and search highlight styles */}
      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        
        /* Search highlight styles */
        .search-highlight {
          background-color: #fbbf24;
          padding: 0 2px;
          border-radius: 2px;
          font-weight: 500;
          transition: background-color 0.2s ease;
        }
        
        .search-highlight.exact-match {
          background-color: #f59e0b;
          padding: 0 3px;
        }
        
        .search-highlight.partial-match {
          background-color: #fcd34d;
          opacity: 0.9;
        }
        
        /* Dark mode highlight adjustments */
        .dark .search-highlight {
          background-color: #d97706;
          color: #ffffff;
        }
        
        .dark .search-highlight.exact-match {
          background-color: #b45309;
        }
        
        .dark .search-highlight.partial-match {
          background-color: #b45309;
          opacity: 0.8;
        }
        
        /* Smooth scroll for results */
        .search-results-container {
          scroll-behavior: smooth;
        }
        
        .search-results-container::-webkit-scrollbar {
          width: 4px;
        }
        
        .search-results-container::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .search-results-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 2px;
        }
        
        .search-results-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}

export default MiniNav;