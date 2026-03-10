import { BaseResponse } from '@/core/api/types';

export interface OrderItemRequest {
  ingredientId: string;
  quantity: number;
  unit: string;
  price?: number;
  lineTotal?: number;
}

export interface OrderRequest {
  deliveryAddressText: string;
  deliveryPhone?: string;
  note?: string;
  totalAmount: number;
  paymentMethod?: string;
  items: OrderItemRequest[];
}

export interface OrderResponseItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  price?: number;
  lineTotal?: number;
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
