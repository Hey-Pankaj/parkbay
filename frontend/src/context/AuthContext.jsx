import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('parkbay_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('parkbay_token') || null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('parkbay_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('parkbay_user');
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem('parkbay_token', res.token);
      return res;
    } catch (err) {
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.register(userData);
      return res;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('parkbay_user');
    localStorage.removeItem('parkbay_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
