export type FeedbackStatus = 'pending' | 'reviewed' | 'archived';

export interface FeedbackItem {
  _id: string;
  name?: string;
  email?: string;
  rating: number;
  comment: string;
  category: 'general' | 'event' | 'website' | 'other';
  status: FeedbackStatus;
  isDeleted: boolean;
  moderatedAt?: string;
  moderatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackSubmissionPayload {
  name?: string;
  email?: string;
  rating: number;
  comment: string;
  category?: 'general' | 'event' | 'website' | 'other';
}

export interface FeedbackPublicItem {
  _id: string;
  name: string;
  rating: number;
  comment: string;
  category: string;
  createdAt: string;
}

export interface FeedbackPublicResponse {
  feedbacks: FeedbackPublicItem[];
  stats: {
    averageRating: number;
    totalCount: number;
  };
}

export interface FeedbackAdminMetrics {
  total: number;
  pending: number;
  reviewed: number;
  archived: number;
  averageRating: number;
}

export interface FeedbackAdminResponse {
  feedbacks: FeedbackItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  metrics: FeedbackAdminMetrics;
}
