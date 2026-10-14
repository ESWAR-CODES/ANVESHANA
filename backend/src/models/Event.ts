import { Schema, model } from 'mongoose';
import { IEvent } from '../types/models';

const FormFieldValidationSchema = new Schema(
  {
    min: { type: Number },
    max: { type: Number },
    minLength: { type: Number },
    maxLength: { type: Number },
    pattern: { type: String },
  },
  { _id: false }
);

const FormFieldConfigSchema = new Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'textarea', 'email', 'phone', 'number', 'select', 'dropdown', 'radio', 'checkbox', 'date', 'url', 'yes_no'],
      required: true,
    },
    label: { type: String, required: true, trim: true },
    placeholder: { type: String, trim: true },
    helpText: { type: String, trim: true },
    required: { type: Boolean, default: false },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    choices: [{ type: String, trim: true }],
    validation: { type: FormFieldValidationSchema, default: null },
  },
  { _id: false }
);

const FormVersionSnapshotSchema = new Schema(
  {
    version: { type: Number, required: true },
    schema: { type: [FormFieldConfigSchema], required: true },
    title: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MediaAssetSchema = new Schema(
  {
    publicId: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Event slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      default: 'Workshop',
      trim: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      maxlength: [200, 'Short description cannot exceed 200 characters'],
      trim: true,
    },
    fullDescription: {
      type: String,
      required: [true, 'Full description is required'],
      trim: true,
    },
    bannerMedia: {
      type: MediaAssetSchema,
      required: [true, 'Banner media is required'],
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    time: {
      type: String,
      required: [true, 'Event time is required'],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, 'Event venue is required'],
      trim: true,
    },
    eligibility: {
      type: String,
      default: null,
      trim: true,
    },
    registrationDeadline: {
      type: Date,
      default: null,
    },
    registrationUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['upcoming', 'open', 'closed', 'completed', 'archived', 'draft', 'published'],
      default: 'upcoming',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      required: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      required: true,
    },
    registeredCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    formTitle: {
      type: String,
      default: '',
      trim: true,
    },
    formDescription: {
      type: String,
      default: '',
      trim: true,
    },
    formSchema: {
      type: [FormFieldConfigSchema],
      default: [],
    },
    formDraft: {
      type: [FormFieldConfigSchema],
      default: null,
    },
    formDraftTitle: {
      type: String,
      default: '',
      trim: true,
    },
    formDraftDescription: {
      type: String,
      default: '',
      trim: true,
    },
    formVersion: {
      type: Number,
      default: 1,
      min: 1,
    },
    formHistory: {
      type: [FormVersionSnapshotSchema],
      default: [],
    },
    formStatus: {
      type: String,
      enum: ['no_form', 'draft', 'published', 'closed'],
      default: 'no_form',
    },
    regOpenDate: {
      type: Date,
      default: null,
    },
    regCloseDate: {
      type: Date,
      default: null,
    },
    maxParticipants: {
      type: Number,
      default: null,
      min: 1,
    },
    deduplicationRule: {
      type: String,
      enum: ['studentId', 'email'],
      default: 'studentId',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
EventSchema.index({ status: 1, eventDate: -1 });
EventSchema.index({ isPublished: 1, eventDate: 1 });
EventSchema.index({ isArchived: 1 });
EventSchema.index({ isDeleted: 1 });

/**
 * Checks if registration is currently open for this event based on state and timing.
 */
EventSchema.methods.isRegistrationOpen = function (): boolean {
  if (
    this.isDeleted ||
    this.isArchived ||
    !this.isPublished ||
    this.status === 'draft' ||
    this.status === 'archived' ||
    this.status === 'completed' ||
    this.status === 'closed'
  ) {
    return false;
  }
  const now = new Date();
  if (this.regOpenDate && now < this.regOpenDate) {
    return false;
  }
  if (this.regCloseDate && now > this.regCloseDate) {
    return false;
  }
  if (this.registrationDeadline && now > this.registrationDeadline) {
    return false;
  }
  if (this.maxParticipants !== null && this.maxParticipants !== undefined && this.registeredCount >= this.maxParticipants) {
    return false;
  }
  return true;
};

/**
 * Computes public display state dynamically based on lifecycle rules.
 */
EventSchema.methods.getComputedStatus = function (): string {
  if (this.isDeleted || this.isArchived || this.status === 'archived') {
    return 'archived';
  }
  if (!this.isPublished || this.status === 'draft') {
    return 'draft';
  }
  if (this.status === 'completed') {
    return 'completed';
  }
  const now = new Date();
  if (this.eventDate && this.eventDate < now) {
    return 'completed';
  }
  if (this.maxParticipants !== null && this.maxParticipants !== undefined && this.registeredCount >= this.maxParticipants) {
    return 'full';
  }
  if (this.regCloseDate && now > this.regCloseDate) {
    return 'closed';
  }
  if (this.registrationDeadline && now > this.registrationDeadline) {
    return 'closed';
  }
  if (this.regOpenDate && now < this.regOpenDate) {
    return 'upcoming';
  }
  return this.status === 'closed' ? 'closed' : 'open';
};

/**
 * Validates whether additional registrations can be accepted against capacity limits.
 */
EventSchema.methods.canAcceptRegistrations = function (
  currentCount?: number
): { allowed: boolean; reason?: string } {
  if (!this.isRegistrationOpen()) {
    return { allowed: false, reason: 'Registration is not currently open for this event' };
  }
  const count = currentCount !== undefined ? currentCount : this.registeredCount;
  if (this.maxParticipants !== null && this.maxParticipants !== undefined && count >= this.maxParticipants) {
    return { allowed: false, reason: 'Event has reached its maximum participant capacity' };
  }
  return { allowed: true };
};

/**
 * Computes form registration status: 'no_form' | 'draft' | 'published' | 'closed'
 */
EventSchema.methods.getFormStatus = function (): 'no_form' | 'draft' | 'published' | 'closed' {
  if (this.isDeleted || this.isArchived || this.status === 'archived' || this.status === 'closed') {
    if (this.formSchema && this.formSchema.length > 0) return 'closed';
  }
  const now = new Date();
  if (this.eventDate && this.eventDate < now) {
    if (this.formSchema && this.formSchema.length > 0) return 'closed';
  }
  if (this.maxParticipants !== null && this.maxParticipants !== undefined && this.registeredCount >= this.maxParticipants) {
    if (this.formSchema && this.formSchema.length > 0) return 'closed';
  }
  if (this.regCloseDate && now > this.regCloseDate) {
    if (this.formSchema && this.formSchema.length > 0) return 'closed';
  }
  if (this.registrationDeadline && now > this.registrationDeadline) {
    if (this.formSchema && this.formSchema.length > 0) return 'closed';
  }
  if (this.formSchema && this.formSchema.length > 0) {
    if (this.isPublished && this.status !== 'closed' && this.status !== 'draft') {
      return 'published';
    }
    return 'closed';
  }
  if (this.formDraft && this.formDraft.length > 0) {
    return 'draft';
  }
  return 'no_form';
};

export const Event = model<IEvent>('Event', EventSchema);
