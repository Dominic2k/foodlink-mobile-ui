import { api } from '@/core/api/client';
import { RecommendationPageApiResponse } from '@/features/recommendation/types';

export const recommendationService = {
  async getRecommendations(page = 0, size = 10) {
    const res = await api.get<RecommendationPageApiResponse>(`/recommendations?page=${page}&size=${size}`);
    return res.data;
  },
};
