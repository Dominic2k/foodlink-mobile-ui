/**
 * Auth Context for global authentication state management
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import { User, AuthState } from '@/types/auth';
import { authService } from '@/services/authService';
import { api } from '@/services/api';
import { storage } from '@/utils/storage';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await storage.getToken();
      if (token) {
        api.setToken(token);
        const user = await authService.getCurrentUser();
        setState({
          user,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      await storage.removeToken();
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    const { accessToken, email: userEmail, fullName, isAdmin } = response.data;
    await storage.setToken(accessToken);
    api.setToken(accessToken);
    setState({
      user: { email: userEmail, fullName, isAdmin },
      token: accessToken,
      isLoading: false,
      isAuthenticated: true,
    });
    router.replace('/(tabs)' as any);
  };

  const register = async (fullName: string, email: string, password: string) => {
    const response = await authService.register({ fullName, email, password });
    const { accessToken, email: userEmail, fullName: userName, isAdmin } = response.data;
    await storage.setToken(accessToken);
    api.setToken(accessToken);
    setState({
      user: { email: userEmail, fullName: userName, isAdmin },
      token: accessToken,
      isLoading: false,
      isAuthenticated: true,
    });
    router.replace('/(tabs)' as any);
  };

  const logout = async () => {
    await authService.logout();
    await storage.removeToken();
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
    router.replace('/(auth)' as any);
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
