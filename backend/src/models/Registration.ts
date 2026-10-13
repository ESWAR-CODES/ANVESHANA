import { Schema, model } from 'mongoose';
import crypto from 'crypto';
import { IRegistration } from '../types/models';

/**
 * Generates a unique 8-character alphanumeric confirmation reference
 * e.g., "7K9XP2A4", avoiding ambiguous characters (0/O, 1/I).
 */
export const generateRegistrationId = (): string => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
};

const RegistrationSchema = new Schema<IRegistration>(
  {
    _id: {
      type: String,
      default: generateRegistrationId,
    },
    referenceNumber: {
      type: String,
      default: function (this: any) {
        return this._id || generateRegistrationId();
      },
      index: true,
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
    studentId: {
      type: String,
      trim: true,
      uppercase: true,
      default: undefined,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
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

// Compound unique indexes preventing duplicate submissions per event (including concurrent requests)
RegistrationSchema.index({ eventId: 1, identifier: 1 }, { unique: true });
RegistrationSchema.index(
  { eventId: 1, studentId: 1 },
  { unique: true, partialFilterExpression: { studentId: { $type: 'string' } } }
);
RegistrationSchema.index(
  { eventId: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: 'string' } } }
);
RegistrationSchema.index({ eventId: 1, submittedAt: -1 });
RegistrationSchema.index({ isArchived: 1 });

export const Registration = model<IRegistration>('Registration', RegistrationSchema);
