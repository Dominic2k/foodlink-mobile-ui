/**
 * User service for profile management
 */

import { api } from '@/core/api/client';
import { UserProfileApiResponse, UpdateProfileRequest } from '@/features/profile/types';

export const userService = {
  async getProfile(): Promise<UserProfileApiResponse> {
    return api.get<UserProfileApiResponse>('/users/me');
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfileApiResponse> {
    return api.put<UserProfileApiResponse>('/users/me', data);
  },
};
