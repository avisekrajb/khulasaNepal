import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('khulasa_theme');
    if (savedTheme) {
      return savedTheme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // Remove both classes first
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    
    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      // Set inline styles as fallback
      body.style.backgroundColor = '#0f172a';
      body.style.color = '#f1f5f9';
    } else {
      root.classList.add('light');
      body.classList.add('light');
      // Set inline styles as fallback
      body.style.backgroundColor = '#ffffff';
      body.style.color = '#111827';
    }
    
    localStorage.setItem('khulasa_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;