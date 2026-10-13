import { apiClient } from './apiClient';
import type { ClubEvent, EventFilterParams } from '../types/event';

export interface EventsResponse {
  success: boolean;
  data: ClubEvent[];
  error: string | null;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SingleEventResponse {
  success: boolean;
  data: ClubEvent;
  error: string | null;
}

export const eventService = {
  // Public
  getPublicEvents: async (params?: EventFilterParams): Promise<EventsResponse> => {
    const res = await apiClient.get<EventsResponse>('/api/v1/events', { params });
    return res.data;
  },

  getPublicEventBySlug: async (slug: string): Promise<SingleEventResponse> => {
    const res = await apiClient.get<SingleEventResponse>(`/api/v1/events/${slug}`);
    return res.data;
  },

  // Admin
  getAdminEvents: async (params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<EventsResponse> => {
    const res = await apiClient.get<EventsResponse>('/api/v1/admin/events', { params });
    return res.data;
  },

  getAdminEventById: async (id: string): Promise<SingleEventResponse> => {
    const res = await apiClient.get<SingleEventResponse>(`/api/v1/admin/events/${id}`);
    return res.data;
  },

  createAdminEvent: async (payload: FormData | Record<string, any>): Promise<SingleEventResponse> => {
    const headers = payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const res = await apiClient.post<SingleEventResponse>('/api/v1/admin/events', payload, { headers });
    return res.data;
  },

  updateAdminEvent: async (id: string, payload: FormData | Record<string, any>): Promise<SingleEventResponse> => {
    const headers = payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
    const res = await apiClient.put<SingleEventResponse>(`/api/v1/admin/events/${id}`, payload, { headers });
    return res.data;
  },

  togglePublishEvent: async (id: string): Promise<any> => {
    const res = await apiClient.patch(`/api/v1/admin/events/${id}/publish`);
    return res.data;
  },

  archiveAdminEvent: async (id: string): Promise<any> => {
    const res = await apiClient.patch(`/api/v1/admin/events/${id}/archive`);
    return res.data;
  },

  deleteAdminEvent: async (id: string): Promise<any> => {
    const res = await apiClient.delete(`/api/v1/admin/events/${id}`);
    return res.data;
  },

  // Dynamic Form & Native Registration
  getEventForm: async (identifier: string): Promise<{ success: boolean; data: any; error: string | null }> => {
    const res = await apiClient.get(`/api/v1/events/${identifier}/form`);
    return res.data;
  },

  registerForEvent: async (
    identifier: string,
    payload: { answers: Record<string, any>; studentId?: string; email?: string }
  ): Promise<{ success: boolean; data: any; error: string | null; message?: string }> => {
    const res = await apiClient.post(`/api/v1/events/${identifier}/register`, payload);
    return res.data;
  },

  updateEventFormSchema: async (
    id: string,
    formSchema: any[]
  ): Promise<{ success: boolean; data: any; error: string | null; message?: string }> => {
    const res = await apiClient.put(`/api/v1/admin/events/${id}/form`, { formSchema });
    return res.data;
  },

  // Participant Management & Secure Exports
  getEventRegistrations: async (
    id: string,
    params?: { page?: number; limit?: number; search?: string; formVersion?: number }
  ): Promise<{
    success: boolean;
    data: {
      registrations: any[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
      formVersions: number[];
      eventTitle: string;
    };
    error: string | null;
  }> => {
    const res = await apiClient.get(`/api/v1/admin/events/${id}/registrations`, { params });
    return res.data;
  },

  getRegistrationDetails: async (
    id: string,
    registrationId: string
  ): Promise<{
    success: boolean;
    data: any;
    error: string | null;
  }> => {
    const res = await apiClient.get(`/api/v1/admin/events/${id}/registrations/${registrationId}`);
    return res.data;
  },

  exportEventRegistrations: async (
    id: string,
    format: 'csv' | 'xlsx'
  ): Promise<Blob> => {
    const res = await apiClient.get(`/api/v1/admin/events/${id}/export`, {
      params: { format },
      responseType: 'blob',
    });
    return res.data;
  },
};
