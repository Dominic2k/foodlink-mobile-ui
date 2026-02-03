/**
 * Authentication types - Matches Backend response structure
 */

export interface User {
  email: string;
  fullName: string;
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

// Backend RegisterResponse structure (inside data field)
export interface RegisterResponseData {
  accessToken: string;
  tokenType: string;
  email: string;
  fullName: string;
  isAdmin: boolean;
}

// Backend BaseResponse wrapper
export interface BaseResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// Combined type for register/login API responses
export type AuthApiResponse = BaseResponse<RegisterResponseData>;

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
