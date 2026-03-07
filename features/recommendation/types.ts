import { BaseResponse } from '@/core/api/types';

export interface RecommendationItem {
  recipeId: string;
  recipeName: string;
  imageUrl?: string | null;
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

export type RecommendationPageApiResponse = BaseResponse<RecommendationPageData>;
