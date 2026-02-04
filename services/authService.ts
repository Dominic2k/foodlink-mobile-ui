/**
 * Auth service for login, register, and token management
 */

import { api } from './api';
import { 
  LoginRequest, 
  RegisterRequest, 
  RegisterApiResponse, 
  LoginApiResponse,
  BaseResponse 
} from '@/types/auth';

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
