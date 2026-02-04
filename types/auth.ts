/**
 * Authentication types - Matches Backend response structure
 */

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

// Backend RegisterResponse structure
export interface RegisterResponseData {
  accessToken: string;
  tokenType: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
}

// Backend LoginResponse structure
export interface LoginResponseData {
  accessToken: string;
  tokenType: string;
  username: string;
  role: string;
}

// Backend BaseResponse wrapper
export interface BaseResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export type RegisterApiResponse = BaseResponse<RegisterResponseData>;
export type LoginApiResponse = BaseResponse<LoginResponseData>;

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
