import { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = sessionStorage.getItem('userData');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('authToken') || null);
  const [loading] = useState(false);

  // Login function - called when user logs in
  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    sessionStorage.setItem('authToken', authToken);
    sessionStorage.setItem('userData', JSON.stringify(userData));
  };

  // Logout function - called when user logs out
  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.clear();
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  // ✅ ADD THIS - Get auth headers for API requests
  const getAuthHeaders = () => {
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  // ✅ ADD THIS - Get token directly
  const getToken = () => {
    return token;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      isAuthenticated,
      getAuthHeaders, 
      getToken,       
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth anywhere in your app
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};