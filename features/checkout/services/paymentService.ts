import { api } from '@/core/api/client';

export const paymentService = {
  createPaymentIntent: async (amount: number): Promise<{ clientSecret: string }> => {
    return await api.post<{ clientSecret: string }>(`/api/payment/create?amount=${amount}`, {});
  },
  createCheckoutSession: async (amount: number, successUrl: string, cancelUrl: string): Promise<{ url: string, sessionId: string }> => {
    return await api.post<{ url: string, sessionId: string }>(
      `/api/payment/checkout?amount=${amount}&successUrl=${encodeURIComponent(successUrl)}&cancelUrl=${encodeURIComponent(cancelUrl)}`, 
      {}
    );
  }
};
