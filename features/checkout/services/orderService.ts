import { api } from '@/core/api/client';
import { OrderRequest, OrderApiResponse } from '@/features/checkout/types';

export const orderService = {
  createOrder: async (request: OrderRequest): Promise<OrderApiResponse['data']> => {
    const response = await api.post<OrderApiResponse>('/api/v1/orders', request);
    return response.data;
  },
};
