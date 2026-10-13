import { Schema, model } from 'mongoose';
import { IClubSettings } from '../types/models';

const SocialLinksSchema = new Schema(
  {
    instagram: { type: String, default: null, trim: true },
    linkedin: { type: String, default: null, trim: true },
    github: { type: String, default: null, trim: true },
    twitter: { type: String, default: null, trim: true },
    youtube: { type: String, default: null, trim: true },
  },
  { _id: false }
);

const ClubSettingsSchema = new Schema<IClubSettings>(
  {
    clubName: {
      type: String,
      default: 'Anveshana Club',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Explore · Build · Bring Ideas to Life.',
      trim: true,
    },
    mission: {
      type: String,
      default:
        'A central university club uniting students from the School of Computing and the School of Engineering to foster innovation and cross-disciplinary collaboration.',
      trim: true,
    },
    contactEmail: {
      type: String,
      default: 'anveshana@mbu.edu.in',
      trim: true,
    },
    contactPhone: {
      type: String,
      default: null,
      trim: true,
    },
    socialLinks: {
      type: SocialLinksSchema,
      default: () => ({}),
    },
    isSingleton: {
      type: Boolean,
      default: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

ClubSettingsSchema.index({ isSingleton: 1 }, { unique: true });

export const ClubSettings = model<IClubSettings>('ClubSettings', ClubSettingsSchema);
