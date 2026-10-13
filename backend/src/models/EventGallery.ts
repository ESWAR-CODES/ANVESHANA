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
    displayOrder: {
      type: Number,
      default: 0,
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
    images: {
      type: [GalleryImageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

EventGallerySchema.index({ eventId: 1 }, { unique: true });

export const EventGallery = model<IEventGallery>('EventGallery', EventGallerySchema);
