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

  async uploadAvatar(imageUri: string, mimeType: string = 'image/jpeg', name: string = 'avatar.jpg'): Promise<{ data: string, message: string }> {
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: mimeType,
      name: name,
    } as any);

    return api.post<{ data: string, message: string }>('/users/me/avatar', formData, {
      'Content-Type': 'multipart/form-data',
    });
  },
};
