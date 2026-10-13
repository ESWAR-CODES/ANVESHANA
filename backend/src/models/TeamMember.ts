import { Schema, model } from 'mongoose';
import { ITeamMember } from '../types/models';

const MediaAssetSchema = new Schema(
  {
    publicId: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'TeamCategory',
      required: [true, 'Team category reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Member name is required'],
      trim: true,
    },
    designation: {
      type: String,
      required: [true, 'Member designation is required'],
      trim: true,
    },
    biography: {
      type: String,
      maxlength: [300, 'Biography cannot exceed 300 characters'],
      default: null,
      trim: true,
    },
    profileMedia: {
      type: MediaAssetSchema,
      default: null,
    },
    linkedinUrl: {
      type: String,
      default: null,
      trim: true,
    },
    githubUrl: {
      type: String,
      default: null,
      trim: true,
    },
    portfolioUrl: {
      type: String,
      default: null,
      trim: true,
    },
    displayOrder: {
      type: Number,
      required: true,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

TeamMemberSchema.index({ categoryId: 1, displayOrder: 1 });
TeamMemberSchema.index({ isPublished: 1, displayOrder: 1 });

export const TeamMember = model<ITeamMember>('TeamMember', TeamMemberSchema);
