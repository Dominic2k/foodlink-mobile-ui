/**
 * Auth Context for global authentication state management
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { User, AuthState, UserProfile } from '@/types/auth';
import { authService } from '@/services/authService';
import { userService } from '@/services/userService';
import { api } from '@/services/api';
import { storage } from '@/utils/storage';

interface AuthContextType extends AuthState {
  profile: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await storage.getToken();
      if (token) {
        api.setToken(token);
        setState({
          user: null,
          token,
          isLoading: false,
          isAuthenticated: true,
        });
        // Load profile in background
        try {
          const res = await userService.getProfile();
          setProfile(res.data);
        } catch {
          // Token might be expired, clear auth
          api.setToken(null);
          await storage.removeToken();
          setState({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
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
    // Load profile after login
    try {
      const profileRes = await userService.getProfile();
      setProfile(profileRes.data);
    } catch {}
    router.replace('/(tabs)' as any);
  };

  const register = async (fullName: string, email: string, password: string) => {
    await authService.register({ fullName, email, password });
    Alert.alert(
      'Đăng ký thành công',
      'Tài khoản đã được tạo. Vui lòng đăng nhập.',
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
      api.setToken(null);
      await storage.removeToken();
      setProfile(null);
      setState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });
      router.replace('/(auth)' as any);
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await userService.getProfile();
      setProfile(res.data);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, profile, login, register, logout, refreshProfile }}>
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
