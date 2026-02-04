/**
 * Auth Context for global authentication state management
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
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
        // For now, just set authenticated state with stored token
        // In production, you'd validate the token with the server
        setState({
          user: null,
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
    const { accessToken, username, role } = response.data;
    await storage.setToken(accessToken);
    api.setToken(accessToken);
    setState({
      user: { username, role },
      token: accessToken,
      isLoading: false,
      isAuthenticated: true,
    });
    router.replace('/(tabs)' as any);
  };

  const register = async (fullName: string, email: string, password: string) => {
    // Register but don't auto-login, redirect to login page
    await authService.register({ fullName, email, password });
    Alert.alert(
      'Registration Successful', 
      'Your account has been created. Please login.',
      [{ text: 'OK', onPress: () => router.replace('/(auth)/login' as any) }]
    );
  };

  const logout = async () => {
    try {
      const currentToken = state.token;
      if (currentToken) {
        await authService.logout(currentToken);
      }
    } catch (error) {
      console.log('Logout API error (token may be expired):', error);
    } finally {
      // Always clear local state regardless of API result
      api.setToken(null);
      await storage.removeToken();
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
      router.replace('/(auth)' as any);
    }
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
