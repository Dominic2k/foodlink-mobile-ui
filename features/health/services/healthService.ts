import { api } from '@/core/api/client';

export interface HealthCondition {
  id: string;
  code: string;
  name: string;
  description: string;
  dietaryAdvice: string;
  exerciseAdvice: string;
  imageUrl: string;
}

export const healthService = {
  getAll: async (): Promise<HealthCondition[]> => {
    return await api.get<HealthCondition[]>('/api/health-conditions');
  },
  getById: async (id: string): Promise<HealthCondition> => {
    return await api.get<HealthCondition>(`/api/health-conditions/${id}`);
  }
};
