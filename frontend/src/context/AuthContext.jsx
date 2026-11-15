import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('parkbay_token'));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('parkbay_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sync token and verify session if needed
  useEffect(() => {
    let active = true;
    if (!token) {
      setUser(null);
      return () => { active = false; };
    }
    
    // Only verify with backend if token is a remote signed token
    if (token && !token.startsWith('local-token-')) {
      api.getCurrentUser()
        .then((res) => { 
          if (active && res && res.user) {
            setUser(res.user);
            localStorage.setItem('parkbay_user', JSON.stringify(res.user));
          } 
        })
        .catch(() => {
          // If network / 405 fails, preserve cached user from localStorage
          if (active) {
            const cached = localStorage.getItem('parkbay_user');
            if (cached) {
              try { setUser(JSON.parse(cached)); } catch {}
            }
          }
        });
    }
    return () => { active = false; };
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res && res.token && res.user) {
      localStorage.setItem('parkbay_token', res.token);
      localStorage.setItem('parkbay_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    return res;
  };

  const updateUserProfile = async (profileData) => {
    const res = await api.updateProfile(profileData);
    const updated = res.user || { ...user, ...profileData };
    setUser(updated);
    localStorage.setItem('parkbay_user', JSON.stringify(updated));
    return res;
  };

  const logout = () => {
    localStorage.removeItem('parkbay_token');
    localStorage.removeItem('parkbay_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
