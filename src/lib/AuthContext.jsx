import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/apiClient';

/** @typedef {{ user: any, isAuthenticated: boolean, isLoadingAuth: boolean, isLoadingPublicSettings: boolean, authError: any, authChecked: boolean, login: (email: string, password: string) => Promise<any>, register: (data: any) => Promise<any>, logout: () => Promise<void>, navigateToLogin: () => void, checkUserAuth: () => Promise<void>, checkAppState: () => Promise<void> }} AuthContextValue */
/** @type {React.Context<AuthContextValue | null>} */
const AuthContext = createContext(/** @type {AuthContextValue | null} */ (null));

/**
 * @param {{ children: React.ReactNode }} props
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAppState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAppState = useCallback(async () => {
    setAuthError(null);
    const token = apiClient.auth.getToken();
    if (token) {
      await checkUserAuth();
    } else {
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setUser(null);
      setAuthChecked(true);
    }
  }, []);

  const checkUserAuth = useCallback(async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.log('Auth check failed or user not logged in');
      // Clear the stale/expired token so subsequent page loads don't keep
      // retrying a failed /auth/me call.
      apiClient.auth.setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  const login = useCallback(async (/** @type {string} */ email, /** @type {string} */ password) => {
    const res = await apiClient.auth.loginViaEmailPassword(email, password);
    await checkUserAuth();
    return res;
  }, [checkUserAuth]);

  const register = useCallback(async (/** @type {{ email: string, password: string }} */ data) => {
    const res = await apiClient.auth.register(data);
    await checkUserAuth();
    return res;
  }, [checkUserAuth]);

  const logout = useCallback(async () => {
    await apiClient.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);
    navigate('/login');
  }, [navigate]);

  const navigateToLogin = useCallback(() => {
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      authChecked,
      login,
      register,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
