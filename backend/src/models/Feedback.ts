import { Schema, model } from 'mongoose';
import { IFeedback } from '../types/models';

const FeedbackSchema = new Schema<IFeedback>(
  {
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
    },
    feedbackText: {
      type: String,
      maxlength: [1000, 'Feedback text cannot exceed 1000 characters'],
      default: null,
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
  },
  {
    timestamps: true,
  }
);

FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ ipHash: 1, createdAt: -1 });

export const Feedback = model<IFeedback>('Feedback', FeedbackSchema);
