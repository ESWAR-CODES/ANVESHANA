import { Schema, model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { IRegistration } from '../types/models';

/**
 * Generates a clean human-readable registration reference number
 * e.g., "ANV-202610-A1B2C3"
 */
export const generateRegistrationId = (): string => {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const randomStr = uuidv4().replace(/-/g, '').slice(0, 6).toUpperCase();
  return `ANV-${dateStr}-${randomStr}`;
};

const RegistrationSchema = new Schema<IRegistration>(
  {
    _id: {
      type: String,
      default: generateRegistrationId,
    },
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Associated event ID is required'],
      index: true,
    },
    formVersion: {
      type: Number,
      required: [true, 'Form schema version snapshot is required'],
      min: 1,
    },
    answers: {
      type: Schema.Types.Mixed,
      required: [true, 'Registration answers payload is required'],
      default: {},
    },
    identifier: {
      type: String,
      required: [true, 'Deduplication identifier is required'],
      trim: true,
      lowercase: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    isArchived: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
    _id: false, // Custom string _id provided
  }
);

// Compound unique index prevents duplicate submissions per event using the specified identifier
RegistrationSchema.index({ eventId: 1, identifier: 1 }, { unique: true });
RegistrationSchema.index({ eventId: 1, submittedAt: -1 });
RegistrationSchema.index({ isArchived: 1 });

export const Registration = model<IRegistration>('Registration', RegistrationSchema);
