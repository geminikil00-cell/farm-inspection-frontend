import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('farm_token'));
  const [username, setUsername] = useState(() => localStorage.getItem('farm_username'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAuthenticated = !!token;

  const login = useCallback(async (user, pass) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(user, pass);
      localStorage.setItem('farm_token', data.token);
      localStorage.setItem('farm_username', data.user.username);
      setToken(data.token);
      setUsername(data.user.username);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (user, pass) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.register(user, pass);
      localStorage.setItem('farm_token', data.token);
      localStorage.setItem('farm_username', data.user.username);
      setToken(data.token);
      setUsername(data.user.username);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('farm_token');
    localStorage.removeItem('farm_username');
    setToken(null);
    setUsername(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, username, isAuthenticated, loading, error, login, register, logout, setError }}
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
