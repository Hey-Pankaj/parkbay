import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('parkbay_token'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // A cached user object is display data, not proof of identity. Verify every
  // persisted token with the API before treating the browser as authenticated.
  useEffect(() => {
    let active = true;
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return () => { active = false; };
    }
    setIsLoading(true);
    api.getCurrentUser()
      .then((res) => { if (active) setUser(res.user || null); })
      .catch(() => {
        if (active) {
          localStorage.removeItem('parkbay_token');
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('parkbay_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const register = async (userData) => api.register(userData);

  const updateUserProfile = async (profileData) => {
    const res = await api.updateProfile(profileData);
    setUser(res.user || { ...user, ...profileData });
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
      isAuthenticated: !!user && !!token,
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
