import React, { useState, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Nav from '../components/Nav';
import MiniNav from '../components/MiniNav';
import Footer from '../components/Footer';
import ChatBot from '../components/ChatBot';
import { useTheme } from '../context/ThemeContext';

const PublicLayout = () => {
  const { isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [footerInView, setFooterInView] = useState(false);
  const footerRef = useRef(null);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL;
    try {
      fetch(`${API_URL}/api/visits/record`, { method: 'POST', headers: { 'Content-Type': 'application/json' } })
        .catch(err => console.error('Visit record failed:', err));
    } catch (err) {
      console.error('Visit record failed:', err);
    }
  }, []);

  useEffect(() => {
    let timeoutId = null;
    
    const toggleVisibility = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      
      if (scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
      
      if (footerRef.current) {
        const footerRect = footerRef.current.getBoundingClientRect();
        const footerVisible = footerRect.top < windowHeight;
        setFooterInView(footerVisible);

        if (footerVisible) {
          setIsVisible(false);
        }
      }
    };

    const handleScroll = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(toggleVisibility, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    toggleVisibility();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      scrollToTop();
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark' : 'light'}`}>
      <Nav />
      <MiniNav />
      <main className="min-h-screen transition-colors duration-300">
        <Outlet />
        <div ref={footerRef}>
          <Footer />
        </div>
      </main>

      {isVisible && (
        <button
          onClick={scrollToTop}
          onKeyDown={handleKeyDown}
          className="fixed bottom-4 right-4 md:bottom-8 md:right-8 bg-[#123E8C] hover:bg-[#0d2f6b] text-white p-3 md:p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 hover:shadow-xl z-50 group focus:outline-none focus:ring-4 focus:ring-blue-400/40"
          aria-label="Scroll to top"
          type="button"
        >
          <svg
            className="w-5 h-5 md:w-6 md:h-6 transition-transform duration-300 group-hover:-translate-y-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M7 11l5-5m0 0l5 5m-5-5v12"
            />
          </svg>
          
          <span 
            className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"
            aria-hidden="true"
          ></span>
        </button>
      )}

      <ChatBot footerInView={footerInView} />
    </div>
  );
};

export default PublicLayout;