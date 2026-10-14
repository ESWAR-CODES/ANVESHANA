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

  // Dual Logo Management
  uploadClubLogo: async (
    file: File,
    alt?: string
  ): Promise<{
    success: boolean;
    data: ClubSettings;
    message?: string;
    error: string | null;
  }> => {
    const formData = new FormData();
    formData.append('logo', file);
    if (alt) formData.append('alt', alt);

    const res = await apiClient.post('/api/v1/admin/settings/logo/club', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  uploadUniversityLogo: async (
    file: File,
    alt?: string
  ): Promise<{
    success: boolean;
    data: ClubSettings;
    message?: string;
    error: string | null;
  }> => {
    const formData = new FormData();
    formData.append('logo', file);
    if (alt) formData.append('alt', alt);

    const res = await apiClient.post('/api/v1/admin/settings/logo/university', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteClubLogo: async (): Promise<{
    success: boolean;
    data: ClubSettings;
    message?: string;
    error: string | null;
  }> => {
    const res = await apiClient.delete('/api/v1/admin/settings/logo/club');
    return res.data;
  },

  deleteUniversityLogo: async (): Promise<{
    success: boolean;
    data: ClubSettings;
    message?: string;
    error: string | null;
  }> => {
    const res = await apiClient.delete('/api/v1/admin/settings/logo/university');
    return res.data;
  },
};
