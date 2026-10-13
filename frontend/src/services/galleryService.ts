import { apiClient } from './apiClient';
import type { EventGalleryData, AdminEventGalleryData, GalleryImage } from '../types/gallery';

export const galleryService = {
  // Public
  getPublicGallery: async (
    slug: string
  ): Promise<{ success: boolean; data: EventGalleryData; error: string | null }> => {
    const res = await apiClient.get(`/api/v1/events/${slug}/gallery`);
    return res.data;
  },

  // Admin
  getAdminGallery: async (
    eventId: string
  ): Promise<{ success: boolean; data: AdminEventGalleryData; error: string | null }> => {
    const res = await apiClient.get(`/api/v1/admin/events/${eventId}/gallery`);
    return res.data;
  },

  uploadGalleryPhoto: async (
    eventId: string,
    formData: FormData
  ): Promise<{ success: boolean; data: { image: GalleryImage; totalImages: number }; message?: string; error: string | null }> => {
    const res = await apiClient.post(`/api/v1/admin/events/${eventId}/gallery`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  deleteGalleryPhoto: async (
    eventId: string,
    publicId: string
  ): Promise<{ success: boolean; message?: string; error: string | null }> => {
    const res = await apiClient.delete(`/api/v1/admin/events/${eventId}/gallery`, {
      params: { publicId },
    });
    return res.data;
  },

  updateGalleryOrder: async (
    eventId: string,
    images: GalleryImage[]
  ): Promise<{ success: boolean; data: any; error: string | null }> => {
    const res = await apiClient.put(`/api/v1/admin/events/${eventId}/gallery`, { images });
    return res.data;
  },
};
