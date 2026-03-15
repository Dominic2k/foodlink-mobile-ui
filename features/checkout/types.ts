import { BaseResponse, PaginatedResponse } from '@/core/api/types';

export interface CustomIngredientRequest {
  ingredientId: string;
  quantity: number;
  unit?: string;
}

export interface OrderItemRequest {
  recipeId: string;
  servings: number;
  customIngredients?: CustomIngredientRequest[];
}

export interface OrderRequest {
  deliveryAddressText: string;
  deliveryPhone?: string;
  note?: string;
  paymentMethod?: string;
  items: OrderItemRequest[];
}

export interface OrderIngredientResponse {
  ingredientId: string;
  ingredientName: string;
  quantityBase: number;
  baseUnit: string;
  unitPriceSnapshot: number;
  lineTotal: number;
}

export interface OrderResponseItem {
  id: string;
  recipeId: string;
  recipeName: string;
  servings: number;
  pricePerServingSnapshot: number;
  lineTotal: number;
  ingredients: OrderIngredientResponse[];
}

export interface OrderResponse {
  id: string;
  userId: string;
  userEmail: string;
  userFullName: string;
  status: string;
  deliveryAddressText: string;
  deliveryPhone?: string;
  note?: string;
  totalAmount: number;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderResponseItem[];
}

export type OrderApiResponse = BaseResponse<OrderResponse>;
export type OrderListApiResponse = BaseResponse<PaginatedResponse<OrderResponse>>;
