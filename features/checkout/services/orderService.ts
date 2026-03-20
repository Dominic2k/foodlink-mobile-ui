import { api } from '@/core/api/client';
import { DishRatingApiResponse, DishRatingRequest, OrderRequest, OrderApiResponse, OrderListApiResponse } from '@/features/checkout/types';

export const orderService = {
  createOrder: async (request: OrderRequest): Promise<OrderApiResponse['data']> => {
    const response = await api.post<OrderApiResponse>('/api/v1/orders', request);
    return response.data;
  },
  getOrderById: async (orderId: string): Promise<OrderApiResponse['data']> => {
    const response = await api.get<OrderApiResponse>(`/api/v1/orders/${orderId}`);
    return response.data;
  },
  cancelMyOrder: async (orderId: string): Promise<OrderApiResponse['data']> => {
    const response = await api.put<OrderApiResponse>(`/api/v1/orders/${orderId}/cancel`, {});
    return response.data;
  },
  getMyOrders: async (page = 0, size = 20): Promise<OrderListApiResponse['data']> => {
    const response = await api.get<OrderListApiResponse>(`/api/v1/orders/my-orders?page=${page}&size=${size}`);
    return response.data;
  },
  submitDishRating: async (orderId: string, orderItemId: string, request: DishRatingRequest): Promise<DishRatingApiResponse['data']> => {
    const response = await api.put<DishRatingApiResponse>(`/api/v1/orders/${orderId}/items/${orderItemId}/rating`, request);
    return response.data;
  },
  deleteDishRating: async (orderId: string, orderItemId: string): Promise<void> => {
    await api.delete(`/api/v1/orders/${orderId}/items/${orderItemId}/rating`);
  },
};
