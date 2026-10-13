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
  formSchema?: FormFieldConfig[];
  formVersion?: number;
  deduplicationRule?: 'studentId' | 'email';
  createdAt: string;
  updatedAt: string;
}

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'select'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'url';

export interface FormFieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface FormFieldConfig {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  enabled?: boolean;
  order: number;
  choices?: string[];
  validation?: FormFieldValidation;
}

export interface EventFormResponse {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  formVersion: number;
  formSchema: FormFieldConfig[];
  isRegistrationOpen: boolean;
  computedStatus: string;
  maxParticipants?: number | null;
  registeredCount: number;
  deduplicationRule: 'studentId' | 'email';
  regOpenDate?: string | null;
  regCloseDate?: string | null;
}

export interface RegistrationSubmissionPayload {
  answers: Record<string, any>;
  studentId?: string;
  email?: string;
}

export interface RegistrationSuccessData {
  referenceNumber: string;
  eventId: string;
  eventTitle: string;
  formVersion: number;
  submittedAt: string;
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
