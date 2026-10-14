import { Schema, model } from 'mongoose';
import { IEventGallery } from '../types/models';

const GalleryImageSchema = new Schema(
  {
    publicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required'],
    },
    url: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    caption: {
      type: String,
      default: '',
      trim: true,
    },
    altText: {
      type: String,
      default: '',
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const EventGalleryWinnerSchema = new Schema(
  {
    position: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    project: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const EventGallerySchema = new Schema<IEventGallery>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID reference is required'],
      unique: true,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    eventDate: {
      type: String,
      default: '',
      trim: true,
    },
    shortSummary: {
      type: String,
      default: '',
      trim: true,
    },
    fullStory: {
      type: String,
      default: '',
      trim: true,
    },
    challenges: {
      type: String,
      default: '',
      trim: true,
    },
    highlights: {
      type: [String],
      default: [],
    },
    winners: {
      type: [EventGalleryWinnerSchema],
      default: [],
    },
    coverImage: {
      publicId: { type: String, default: null },
      url: { type: String, default: null },
    },
    images: {
      type: [GalleryImageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const EventGallery = model<IEventGallery>('EventGallery', EventGallerySchema);
