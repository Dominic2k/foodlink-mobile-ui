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

// User profile from GET /users/me
export interface UserProfile {
  email: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
}

export type UserProfileApiResponse = BaseResponse<UserProfile>;

export interface HealthCondition {
  id: string;
  code: string;
  name: string;
}

export type Relationship = 'self' | 'father' | 'mother' | 'child' | 'other';
export type Gender = 'male' | 'female' | 'other';
export type ActivityLevel = 'low' | 'medium' | 'high';

export interface FamilyMember {
  id: string;
  displayName: string;
  relationship: Relationship;
  gender?: Gender;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: ActivityLevel;
  healthNotes?: string;
  healthConditions: HealthCondition[];
}

export interface FamilyMemberRequest {
  displayName: string;
  relationship: Relationship;
  gender?: Gender;
  birthDate?: string;
  heightCm?: number;
  weightKg?: number;
  activityLevel?: ActivityLevel;
  healthNotes?: string;
  conditionIds?: string[];
}
