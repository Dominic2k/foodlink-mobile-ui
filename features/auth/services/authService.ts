/**
 * Auth service for login, register, and token management
 */

import { api } from '@/core/api/client';
import {
  LoginRequest,
  RegisterRequest,
  RegisterApiResponse,
  LoginApiResponse,
} from '@/features/auth/types';
import { BaseResponse } from '@/core/api/types';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginApiResponse> {
    return api.post<LoginApiResponse>('/auth/login', credentials);
  },

  async register(data: RegisterRequest): Promise<RegisterApiResponse> {
    return api.post<RegisterApiResponse>('/auth/register', data);
  },

  async logout(token: string): Promise<BaseResponse<string>> {
    return api.postWithAuth<BaseResponse<string>>('/auth/logout', {}, token);
  },
};
