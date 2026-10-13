export interface MediaAsset {
  publicId: string;
  url: string;
}

export interface ClubEvent {
  _id: string;
  title: string;
  slug: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  bannerMedia: MediaAsset;
  eventDate: string;
  time: string;
  venue: string;
  eligibility?: string | null;
  registrationDeadline?: string | null;
  registrationUrl?: string | null;
  status: 'draft' | 'published' | 'upcoming' | 'open' | 'closed' | 'completed' | 'archived';
  computedStatus: string;
  isPublished: boolean;
  isArchived: boolean;
  isRegistrationOpen: boolean;
  registeredCount: number;
  maxParticipants?: number | null;
  regOpenDate?: string | null;
  regCloseDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventFilterParams {
  status?: string;
  category?: string;
  search?: string;
  month?: string;
  year?: string;
  page?: number;
  limit?: number;
}
