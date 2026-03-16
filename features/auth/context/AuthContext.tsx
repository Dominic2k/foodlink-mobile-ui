/**
 * Auth Context for global authentication state management
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { router } from 'expo-router';
import { User, AuthState } from '@/features/auth/types';
import { UserProfile } from '@/features/profile/types';
import { authService } from '@/features/auth/services/authService';
import { userService } from '@/features/profile/services/userService';
import { api } from '@/core/api/client';
import { storage } from '@/core/storage/storage';

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
  const sessionStartRef = useRef<number>(Date.now());
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Session duration tracking via AppState
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/active/) &&
        nextAppState.match(/inactive|background/) &&
        state.isAuthenticated
      ) {
        // App going to background — report session duration
        const durationSeconds = Math.round((Date.now() - sessionStartRef.current) / 1000);
        if (durationSeconds >= 5) {
          api.post('/api/sessions', { durationSeconds }).catch(() => {});
        }
      }

      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App coming to foreground — reset session start
        sessionStartRef.current = Date.now();
      }

      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [state.isAuthenticated]);

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
          // Record app visit (fire-and-forget)
          api.post('/api/visits', {}).catch(() => {});
        } catch (error: any) {
          // Token invalid/expired -> only clear if status is 401
          // Otherwise keep token and assume it's a transient network issue
          if (error.message && error.message.includes('401')) {
            console.warn('[Auth] Token expired or invalid (401), logging out');
            api.setToken(null);
            await storage.removeToken();
            setProfile(null);
            setState({
              user: null,
              token: null,
              isLoading: false,
              isAuthenticated: false,
            });
          } else {
            console.error('[Auth] Failed to load profile during init:', error);
            setState(prev => ({ ...prev, isLoading: false }));
          }
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      api.setToken(null);
      await storage.removeToken();
      setProfile(null);
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
    // Record app visit (fire-and-forget)
    api.post('/api/visits', {}).catch(() => {});
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
