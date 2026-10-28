import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('parkbay_user');
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      // Auto-cleanup legacy 'Alex Driver' default to authentic Indian Name or derived from user email
      if (parsed && (parsed.full_name === 'Alex Driver' || parsed.full_name?.toLowerCase().includes('alex driver'))) {
        if (parsed.email && parsed.email.includes('@') && !parsed.email.toLowerCase().includes('alex')) {
          const local = parsed.email.split('@')[0].replace(/[0-9._-]+/g, ' ').trim();
          parsed.full_name = local.length > 1
            ? local.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            : 'Aarav Sharma';
        } else {
          parsed.full_name = 'Aarav Sharma';
        }
        localStorage.setItem('parkbay_user', JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return null;
    }
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

  const updateUserProfile = async (profileData) => {
    try {
      const res = await api.updateProfile(profileData);
      const updated = res.user || { ...user, ...profileData };
      setUser(updated);
      localStorage.setItem('parkbay_user', JSON.stringify(updated));
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
        setUser,
        updateUserProfile
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
