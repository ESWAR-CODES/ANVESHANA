import { apiClient } from './apiClient';
import type {
  FeedbackSubmissionPayload,
  FeedbackPublicResponse,
  FeedbackAdminResponse,
  FeedbackStatus,
} from '../types/feedback';

export const feedbackService = {
  // Public
  submitFeedback: async (
    payload: FeedbackSubmissionPayload
  ): Promise<{ success: boolean; data: any; message?: string; error: string | null }> => {
    const res = await apiClient.post('/api/v1/feedback', payload);
    return res.data;
  },

  getPublicFeedback: async (): Promise<{
    success: boolean;
    data: FeedbackPublicResponse;
    error: string | null;
  }> => {
    const res = await apiClient.get('/api/v1/feedback');
    return res.data;
  },

  // Admin
  getAdminFeedback: async (params?: {
    status?: FeedbackStatus | 'all';
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: FeedbackAdminResponse;
    error: string | null;
  }> => {
    const res = await apiClient.get('/api/v1/admin/feedback', { params });
    return res.data;
  },

  moderateFeedbackStatus: async (
    id: string,
    status: FeedbackStatus
  ): Promise<{ success: boolean; data: any; error: string | null }> => {
    const res = await apiClient.patch(`/api/v1/admin/feedback/${id}/status`, { status });
    return res.data;
  },

  softDeleteFeedback: async (
    id: string
  ): Promise<{ success: boolean; data: any; error: string | null }> => {
    const res = await apiClient.delete(`/api/v1/admin/feedback/${id}`);
    return res.data;
  },
};
