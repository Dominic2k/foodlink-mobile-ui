import { BaseResponse } from '@/core/api/types';

export type RecommendationStatusFilter = 'all' | 'suitable' | 'not_suitable' | 'unevaluated';

export interface RecommendationItem {
  recipeId: string;
  recipeName: string;
  imageUrl?: string | null;
  recipeDescription?: string | null;
  recipeInstructions?: string | null;
  prepTimeMin?: number | null;
  cookTimeMin?: number | null;
  baseServings?: number | null;
  category?: string | null;
  dishCategories?: string[];
  evaluated: boolean;
  score: number;
  suitable: boolean;
  reason?: string | null;
  suggestion?: string | null;
  ingredients?: RecommendationIngredientDetail[] | null;
  nutritionSummary?: RecommendationNutritionSummary | null;
}

export interface RecommendationIngredientDetail {
  ingredientId?: string | null;
  ingredientName: string;
  category?: string | null;
  quantity?: number | null;
  unit?: string | null;
  price?: number | null;
  totalPrice?: number | null;
  optional?: boolean;
  calories?: number | null;
  protein?: number | null;
  carb?: number | null;
  fat?: number | null;
}

export interface RecommendationNutritionSummary {
  calories?: number | null;
  protein?: number | null;
  carb?: number | null;
  fat?: number | null;
  coveredIngredients?: number;
  totalIngredients?: number;
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
export type RecommendationDetailApiResponse = BaseResponse<RecommendationItem>;
