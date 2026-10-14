import { Document, Types } from 'mongoose';

export type AdminRole = 'admin' | 'superadmin';

export type EventStatus =
  | 'upcoming'
  | 'open'
  | 'closed'
  | 'completed'
  | 'archived'
  | 'draft'
  | 'published';

export type DeduplicationRule = 'studentId' | 'email';

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
  | 'url'
  | 'yes_no';

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

export interface IFormVersionSnapshot {
  version: number;
  schema: FormFieldConfig[];
  title?: string | null;
  description?: string | null;
  publishedAt: Date;
}

export type EventFormStatus = 'no_form' | 'draft' | 'published' | 'closed';

export interface IEvent extends Document {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  category: string;
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
  isDeleted: boolean;
  registeredCount: number;
  
  // Dynamic Form Builder & Registration additions
  formTitle?: string | null;
  formDescription?: string | null;
  formSchema: FormFieldConfig[];
  formDraft?: FormFieldConfig[] | null;
  formDraftTitle?: string | null;
  formDraftDescription?: string | null;
  formVersion: number;
  formHistory: IFormVersionSnapshot[];
  formStatus?: EventFormStatus;
  regOpenDate?: Date | null;
  regCloseDate?: Date | null;
  maxParticipants?: number | null;
  deduplicationRule: DeduplicationRule;

  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isRegistrationOpen(): boolean;
  canAcceptRegistrations(currentCount?: number): { allowed: boolean; reason?: string };
  getComputedStatus(): string;
  getFormStatus(): EventFormStatus;
}

export interface IRegistration extends Document<string> {
  _id: string; // Unique 8-character confirmation reference number
  referenceNumber: string;
  eventId: Types.ObjectId;
  formVersion: number;
  answers: Record<string, any>;
  identifier: string; // Deduplication value (Student ID or Email)
  studentId?: string | null;
  email?: string | null;
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
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type FeedbackStatus = 'pending' | 'reviewed' | 'archived';

export interface IFeedback extends Document {
  _id: Types.ObjectId;
  name?: string | null;
  email?: string | null;
  category?: 'general' | 'event' | 'website' | 'other';
  rating: number;
  feedbackText?: string | null;
  status: FeedbackStatus;
  ipHash: string;
  isDeleted: boolean;
  moderatedAt?: Date | null;
  moderatedBy?: Types.ObjectId | null;
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

export interface ILogoAsset {
  url: string;
  publicId?: string | null;
  alt?: string;
}

export interface IClubLogos {
  clubLogo?: ILogoAsset | null;
  universityLogo?: ILogoAsset | null;
}

export interface IHeroSettings {
  eyebrow?: string;
  title?: string;
  tagline?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  backgroundImage?: { url: string; publicId: string } | null;
}

export interface IStatItem {
  value: string;
  label: string;
  description?: string;
}

export interface IPillarItem {
  title: string;
  description: string;
}

export interface IAboutSettings {
  eyebrow?: string;
  heading?: string;
  description?: string;
  subDescription?: string;
  calloutTitle?: string;
  calloutText?: string;
  pillars?: IPillarItem[];
}

export interface IHomeEventsSection {
  eyebrow?: string;
  heading?: string;
  description?: string;
  ctaText?: string;
}

export interface IHomeCtaSection {
  eyebrow?: string;
  heading?: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

export interface INavbarLink {
  name: string;
  path: string;
  isVisible: boolean;
}

export interface INavbarSettings {
  links?: INavbarLink[];
  ctaText?: string;
  ctaLink?: string;
}

export interface IFooterSettings {
  aboutText?: string;
  copyrightText?: string;
}

export interface IPagesContent {
  events?: {
    eyebrow?: string;
    title?: string;
    description?: string;
  };
  team?: {
    eyebrow?: string;
    title?: string;
    description?: string;
  };
  feedback?: {
    eyebrow?: string;
    title?: string;
    description?: string;
    privacyNotice?: string;
  };
}

export interface IClubSettings extends Document {
  _id: Types.ObjectId;
  clubName: string;
  universityName?: string;
  tagline: string;
  mission: string;
  contactEmail: string;
  contactPhone?: string | null;
  campusLocation?: string;
  affiliatedSchools?: string;
  socialLinks: ISocialLinks;
  logos?: IClubLogos;
  hero?: IHeroSettings;
  stats?: IStatItem[];
  about?: IAboutSettings;
  homeEventsSection?: IHomeEventsSection;
  homeCtaSection?: IHomeCtaSection;
  navbar?: INavbarSettings;
  footer?: IFooterSettings;
  pagesContent?: IPagesContent;
  isSingleton: boolean;
  createdAt: Date;
  updatedAt: Date;
}

