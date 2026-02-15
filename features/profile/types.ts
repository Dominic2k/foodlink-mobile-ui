import { BaseResponse } from '@/core/api/types';

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
