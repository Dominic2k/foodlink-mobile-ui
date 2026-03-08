import { api } from '@/core/api/client';
import {
  RecommendationDetailApiResponse,
  RecommendationFilterOptionsApiResponse,
  RecommendationPageApiResponse,
  RecommendationStatusFilter,
} from '@/features/recommendation/types';

export const recommendationService = {
  async getFilterOptions() {
    const res = await api.get<RecommendationFilterOptionsApiResponse>('/recommendations/filter-options');
    return res.data;
  },

  async getRecommendationDetail(recipeId: string) {
    const res = await api.get<RecommendationDetailApiResponse>(`/recommendations/${recipeId}`);
    return res.data;
  },

  async getRecommendations(
    page = 0,
    size = 10,
    statusFilter: RecommendationStatusFilter = 'all',
    ingredientCategoryFilter = 'all',
    dishCategoryFilter = 'all',
    scoreMin?: number,
    scoreMax?: number,
    q?: string
  ) {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    if (statusFilter === 'suitable') {
      params.set('evaluated', 'true');
      params.set('suitable', 'true');
    } else if (statusFilter === 'not_suitable') {
      params.set('evaluated', 'true');
      params.set('suitable', 'false');
    } else if (statusFilter === 'unevaluated') {
      params.set('evaluated', 'false');
    }

    if (ingredientCategoryFilter && ingredientCategoryFilter !== 'all') {
      params.set('ingredientCategory', ingredientCategoryFilter);
    }

    if (dishCategoryFilter && dishCategoryFilter !== 'all') {
      params.set('dishCategory', dishCategoryFilter);
    }

    if (typeof scoreMin === 'number') {
      params.set('scoreMin', String(scoreMin));
    }

    if (typeof scoreMax === 'number') {
      params.set('scoreMax', String(scoreMax));
    }

    if (q && q.trim().length > 0) {
      params.set('q', q.trim());
    }

    const res = await api.get<RecommendationPageApiResponse>(`/recommendations?${params.toString()}`);
    return res.data;
  },
};
