import { apiClient } from './apiClient';
import type { ClubSettings, UpdateSettingsPayload } from '../types/settings';

export const settingsService = {
  // Public
  getPublicSettings: async (): Promise<{
    success: boolean;
    data: ClubSettings;
    error: string | null;
  }> => {
    const res = await apiClient.get('/api/v1/settings');
    return res.data;
  },

  // Admin
  getAdminSettings: async (): Promise<{
    success: boolean;
    data: ClubSettings;
    error: string | null;
  }> => {
    const res = await apiClient.get('/api/v1/admin/settings');
    return res.data;
  },

  updateAdminSettings: async (
    payload: UpdateSettingsPayload
  ): Promise<{
    success: boolean;
    data: ClubSettings;
    message?: string;
    error: string | null;
  }> => {
    const res = await apiClient.put('/api/v1/admin/settings', payload);
    return res.data;
  },
};
