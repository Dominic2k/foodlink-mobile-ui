import { api } from '@/core/api/client';
import { BaseResponse } from '@/core/api/types';
import { FamilyMember, FamilyMemberRequest, HealthCondition } from '@/features/family/types';

export const familyService = {
  getFamilyMembers: async () => {
    const res = await api.get<BaseResponse<FamilyMember[]>>('/family');
    return res.data;
  },

  addFamilyMember: async (data: FamilyMemberRequest) => {
    const res = await api.post<BaseResponse<FamilyMember>>('/family', data);
    return res.data;
  },

  updateFamilyMember: async (id: string, data: FamilyMemberRequest) => {
    const res = await api.put<BaseResponse<FamilyMember>>(`/family/${id}`, data);
    return res.data;
  },

  deleteFamilyMember: async (id: string) => {
    const res = await api.delete<BaseResponse<void>>(`/family/${id}`);
    return res.data;
  },

  getHealthConditions: async () => {
    const res = await api.get<BaseResponse<HealthCondition[]>>('/family/conditions');
    return res.data;
  },
};
