/**
 * User service for profile management
 */

import { api } from './api';
import {
  UserProfileApiResponse,
  UpdateProfileRequest,
} from '@/types/auth';

export const userService = {
  async getProfile(): Promise<UserProfileApiResponse> {
    return api.get<UserProfileApiResponse>('/users/me');
  },

  async updateProfile(data: UpdateProfileRequest): Promise<UserProfileApiResponse> {
    return api.put<UserProfileApiResponse>('/users/me', data);
  },
};
