import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin',
  AUDITOR: 'auditor',
  DEPT_HEAD: 'dept_head',
  QUALITY_MGR: 'quality_mgr',
  VIEWER: 'viewer',
};

const PORTAL_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ORG_ADMIN]: 'Administration',
  [ROLES.AUDITOR]: 'Auditor',
  [ROLES.DEPT_HEAD]: 'Department',
  [ROLES.QUALITY_MGR]: 'Quality',
  [ROLES.VIEWER]: 'Reports',
};

export function getPortalLabel(role) {
  return PORTAL_LABELS[role] || role;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('farm_token'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('farm_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAuthenticated = !!token && !!user;

  const saveAuth = (tokenVal, userVal) => {
    localStorage.setItem('farm_token', tokenVal);
    localStorage.setItem('farm_user', JSON.stringify(userVal));
    setToken(tokenVal);
    setUser(userVal);
  };

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(username, password);
      saveAuth(data.token, data.user);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username, password, fullName, orgName) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.register(username, password, fullName, orgName);
      saveAuth(data.token, data.user);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const data = await api.getMe();
      if (data.user) {
        localStorage.setItem('farm_user', JSON.stringify(data.user));
        setUser(data.user);
      }
    } catch (_) {}
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('farm_token');
    localStorage.removeItem('farm_user');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (token && !user) {
      refreshMe();
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        username: user?.username,
        orgId: user?.orgId,
        role: user?.role,
        orgName: user?.orgName,
        portalLabel: getPortalLabel(user?.role),
        isAuthenticated,
        loading,
        error,
        login,
        register,
        logout,
        refreshMe,
        setError,
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
