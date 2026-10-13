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
      enum: ['text', 'textarea', 'email', 'phone', 'number', 'select', 'radio', 'checkbox', 'date'],
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
      enum: ['upcoming', 'open', 'closed', 'completed', 'archived'],
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
    formSchema: {
      type: [FormFieldConfigSchema],
      default: [],
    },
    formVersion: {
      type: Number,
      default: 1,
      min: 1,
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
EventSchema.index({ slug: 1 }, { unique: true });
EventSchema.index({ status: 1, eventDate: -1 });
EventSchema.index({ isPublished: 1, eventDate: 1 });
EventSchema.index({ isArchived: 1 });

/**
 * Checks if registration is currently open for this event based on state and timing.
 */
EventSchema.methods.isRegistrationOpen = function (): boolean {
  if (this.isArchived || !this.isPublished || this.status !== 'open') {
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
  return true;
};

/**
 * Validates whether additional registrations can be accepted against capacity limits.
 */
EventSchema.methods.canAcceptRegistrations = function (
  currentCount: number
): { allowed: boolean; reason?: string } {
  if (!this.isRegistrationOpen()) {
    return { allowed: false, reason: 'Registration is not currently open for this event' };
  }
  if (this.maxParticipants !== null && this.maxParticipants !== undefined && currentCount >= this.maxParticipants) {
    return { allowed: false, reason: 'Event has reached its maximum participant capacity' };
  }
  return { allowed: true };
};

export const Event = model<IEvent>('Event', EventSchema);
