// src/contexts/AuthContext.tsx
import React, { createContext, useCallback, useEffect, useState } from 'react';
import { authApi } from '@/api/auth';
import type { AuthTokens, User, UserRole } from '@/types';
import { LOCAL_STORAGE_KEYS } from '@/utils/constants';
import { isTokenExpired } from '@/utils/helpers';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
  refreshToken: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.USER);
  }, []);

  const saveAuth = useCallback((userData: User, authTokens: AuthTokens) => {
    setUser(userData);
    setTokens(authTokens);
    localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, authTokens.accessToken);
    localStorage.setItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN, authTokens.refreshToken);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(userData));
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedUser = localStorage.getItem(LOCAL_STORAGE_KEYS.USER);
        const accessToken = localStorage.getItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN);
        const refreshTokenStr = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);

        if (!savedUser || !accessToken || !refreshTokenStr) {
          setIsLoading(false);
          return;
        }

        if (isTokenExpired(accessToken)) {
          const response = await authApi.refreshToken(refreshTokenStr);
          const newAccessToken = response.data.accessToken;
          localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, newAccessToken);

          const meResponse = await authApi.getMe();
          setUser(meResponse.data);
          setTokens({
            accessToken: newAccessToken,
            refreshToken: refreshTokenStr,
          });
        } else {
          setUser(JSON.parse(savedUser));
          setTokens({ accessToken, refreshToken: refreshTokenStr });
        }
      } catch {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [clearAuth]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      const resData = (response as any).data || response;
      const user = resData.user || resData;
      const tokens = resData.tokens || {
        accessToken: resData.accessToken,
        refreshToken: resData.refreshToken,
      };
      const normalizedUser = {
        ...user,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        role: (user.role || 'patient').toLowerCase(),
      };
      saveAuth(normalizedUser, tokens);
      toast.success(`Welcome back, ${normalizedUser.name}!`);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      throw error;
    }
  }, [saveAuth]);

  const register = useCallback(async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
  }) => {
    try {
      const response = await authApi.register(data);
      const resData = (response as any).data || response;
      const user = resData.user || resData;
      const tokens = resData.tokens || {
        accessToken: resData.accessToken,
        refreshToken: resData.refreshToken,
      };
      const normalizedUser = {
        ...user,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        role: (user.role || 'patient').toLowerCase(),
      };
      saveAuth(normalizedUser, tokens);
      toast.success('Account created successfully!');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      throw error;
    }
  }, [saveAuth]);

  const logout = useCallback(async () => {
    try {
      const refreshTokenStr = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
      if (refreshTokenStr) {
        await authApi.logout(refreshTokenStr);
      }
    } catch {
      // Ignore logout errors
    } finally {
      clearAuth();
      toast.success('Logged out successfully');
    }
  }, [clearAuth]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USER, JSON.stringify(updatedUser));
  }, []);

  const hasRole = useCallback((role: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }, [user]);

  const refreshToken = useCallback(async () => {
    const refreshTokenStr = localStorage.getItem(LOCAL_STORAGE_KEYS.REFRESH_TOKEN);
    if (!refreshTokenStr) return;
    try {
      const response = await authApi.refreshToken(refreshTokenStr);
      const newAccessToken = response.data.accessToken;
      localStorage.setItem(LOCAL_STORAGE_KEYS.AUTH_TOKEN, newAccessToken);
      setTokens((prev) =>
        prev ? { ...prev, accessToken: newAccessToken } : null
      );
    } catch {
      clearAuth();
    }
  }, [clearAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!user && !!tokens,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        hasRole,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

