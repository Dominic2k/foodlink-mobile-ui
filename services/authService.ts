/**
 * Auth service for login, register, and token management
 */

import { api } from './api';
import { LoginRequest, RegisterRequest, AuthApiResponse, User } from '@/types/auth';

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthApiResponse> {
    return api.post<AuthApiResponse>('/auth/login', credentials);
  },

  async register(data: RegisterRequest): Promise<AuthApiResponse> {
    return api.post<AuthApiResponse>('/auth/register', data);
  },

  async getCurrentUser(): Promise<User> {
    return api.get<User>('/auth/me');
  },

  async logout(): Promise<void> {
    api.setToken(null);
  },
};
