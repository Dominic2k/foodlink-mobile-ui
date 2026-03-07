import { BaseResponse } from '@/core/api/types';

export type RecommendationStatusFilter = 'all' | 'suitable' | 'not_suitable' | 'unevaluated';

export interface RecommendationItem {
  recipeId: string;
  recipeName: string;
  imageUrl?: string | null;
  category?: string | null;
  evaluated: boolean;
  score: number;
  suitable: boolean;
}

export interface RecommendationPageData {
  items: RecommendationItem[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
}

export interface RecommendationFilterOptionsData {
  ingredientCategories: string[];
  dishCategories: string[];
}

export type RecommendationPageApiResponse = BaseResponse<RecommendationPageData>;
export type RecommendationFilterOptionsApiResponse = BaseResponse<RecommendationFilterOptionsData>;
