import { apiClient } from './apiClient';
import type { TeamCategory, TeamMember, PublicTeamResponse } from '../types/team';

export const teamService = {
  // Public
  getPublicTeam: async (): Promise<{
    success: boolean;
    data: PublicTeamResponse;
    error: string | null;
  }> => {
    const res = await apiClient.get('/api/v1/team');
    return res.data;
  },

  // Admin
  getAdminCategories: async (): Promise<{
    success: boolean;
    data: TeamCategory[];
    error: string | null;
  }> => {
    const res = await apiClient.get('/api/v1/admin/team/categories');
    return res.data;
  },

  getAdminMembers: async (params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    status?: 'published' | 'draft';
  }): Promise<{
    success: boolean;
    data: {
      members: TeamMember[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    };
    error: string | null;
  }> => {
    const res = await apiClient.get('/api/v1/admin/team/members', { params });
    return res.data;
  },

  createMember: async (
    payload: FormData | Record<string, any>
  ): Promise<{ success: boolean; data: TeamMember; message?: string; error: string | null }> => {
    const headers = payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const res = await apiClient.post('/api/v1/admin/team/members', payload, { headers });
    return res.data;
  },

  updateMember: async (
    id: string,
    payload: FormData | Record<string, any>
  ): Promise<{ success: boolean; data: TeamMember; message?: string; error: string | null }> => {
    const headers = payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const res = await apiClient.put(`/api/v1/admin/team/members/${id}`, payload, { headers });
    return res.data;
  },

  togglePublishMember: async (
    id: string
  ): Promise<{ success: boolean; data: { id: string; isPublished: boolean }; message?: string; error: string | null }> => {
    const res = await apiClient.patch(`/api/v1/admin/team/members/${id}/publish`);
    return res.data;
  },

  deleteMember: async (
    id: string
  ): Promise<{ success: boolean; message?: string; error: string | null }> => {
    const res = await apiClient.delete(`/api/v1/admin/team/members/${id}`);
    return res.data;
  },
};
