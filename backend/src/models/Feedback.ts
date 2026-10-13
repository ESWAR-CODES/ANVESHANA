import { Schema, model } from 'mongoose';
import { IFeedback } from '../types/models';

const FeedbackSchema = new Schema<IFeedback>(
  {
    name: {
      type: String,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    category: {
      type: String,
      enum: ['general', 'event', 'website', 'other'],
      default: 'general',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    feedbackText: {
      type: String,
      required: [true, 'Feedback text is required'],
      minlength: [5, 'Feedback text must be at least 5 characters'],
      maxlength: [1000, 'Feedback text cannot exceed 1000 characters'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'archived'],
      default: 'pending',
      required: true,
    },
    ipHash: {
      type: String,
      required: [true, 'IP hash is required for spam protection'],
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Administrator',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ status: 1, isDeleted: 1, createdAt: -1 });
FeedbackSchema.index({ ipHash: 1, createdAt: -1 });

export const Feedback = model<IFeedback>('Feedback', FeedbackSchema);
