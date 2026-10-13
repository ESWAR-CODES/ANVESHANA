import { Document, Types } from 'mongoose';

export type AdminRole = 'admin' | 'superadmin';

export type EventStatus = 'upcoming' | 'open' | 'closed' | 'completed' | 'archived';

export type DeduplicationRule = 'studentId' | 'email';

export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date';

export interface FormFieldValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface FormFieldConfig {
  id: string; // Stable unique ID (UUID)
  type: FormFieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  enabled: boolean;
  order: number;
  choices?: string[];
  validation?: FormFieldValidation;
}

export interface MediaAsset {
  publicId: string;
  url: string;
}

export interface IAdministrator extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEvent extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  bannerMedia: MediaAsset;
  eventDate: Date;
  time: string;
  venue: string;
  eligibility?: string | null;
  registrationDeadline?: Date | null;
  registrationUrl?: string | null; // Optional external fallback
  status: EventStatus;
  isPublished: boolean;
  isArchived: boolean;
  
  // Dynamic Form Builder & Registration additions
  formSchema: FormFieldConfig[];
  formVersion: number;
  regOpenDate?: Date | null;
  regCloseDate?: Date | null;
  maxParticipants?: number | null;
  deduplicationRule: DeduplicationRule;

  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isRegistrationOpen(): boolean;
  canAcceptRegistrations(currentCount: number): { allowed: boolean; reason?: string };
}

export interface IRegistration extends Document<string> {
  _id: string; // Formatted reference number (e.g. ANV-202610-ABCD12)
  eventId: Types.ObjectId;
  formVersion: number;
  answers: Record<string, any>;
  identifier: string; // Deduplication value (Student ID or Email)
  submittedAt: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGalleryImage extends MediaAsset {
  caption?: string;
  displayOrder: number;
}

export interface IEventGallery extends Document {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  images: IGalleryImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeamCategory extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITeamMember extends Document {
  _id: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  designation: string;
  biography?: string | null;
  profileMedia?: MediaAsset | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  displayOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type FeedbackStatus = 'pending' | 'reviewed' | 'archived';

export interface IFeedback extends Document {
  _id: Types.ObjectId;
  rating: number;
  feedbackText?: string | null;
  status: FeedbackStatus;
  ipHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISocialLinks {
  instagram?: string | null;
  linkedin?: string | null;
  github?: string | null;
  twitter?: string | null;
  youtube?: string | null;
}

export interface IClubSettings extends Document {
  _id: Types.ObjectId;
  clubName: string;
  tagline: string;
  mission: string;
  contactEmail: string;
  contactPhone?: string | null;
  socialLinks: ISocialLinks;
  isSingleton: boolean;
  createdAt: Date;
  updatedAt: Date;
}
