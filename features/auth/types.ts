import { BaseResponse } from '@/core/api/types';

export interface User {
  email?: string;
  fullName?: string;
  username?: string;
  role?: string;
  isAdmin?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface RegisterResponseData {
  accessToken: string;
  tokenType: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
}

export interface LoginResponseData {
  accessToken: string;
  tokenType: string;
  username: string;
  role: string;
}

export type RegisterApiResponse = BaseResponse<RegisterResponseData>;
export type LoginApiResponse = BaseResponse<LoginResponseData>;

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
