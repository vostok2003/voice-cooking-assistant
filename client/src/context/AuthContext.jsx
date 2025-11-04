import React, { createContext, useState, useEffect } from 'react';
import api, { setAuthToken } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      // Optionally fetch user info from backend
      api.get('/auth/me').then(res => {
        setUser(res.data.user || null);
      }).catch(()=> setUser(null)).finally(()=> setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token, userInfo) => {
    localStorage.setItem('token', token);
    setAuthToken(token);
    setUser(userInfo || null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setUser(null);
  };

  const updateLanguage = async (language) => {
    try {
      const response = await api.put('/auth/language', { language });
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Failed to update language:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, updateLanguage, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

