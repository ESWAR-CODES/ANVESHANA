import { Schema, model } from 'mongoose';
import { ITeamCategory } from '../types/models';

const TeamCategorySchema = new Schema<ITeamCategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    displayOrder: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

TeamCategorySchema.index({ displayOrder: 1 });
TeamCategorySchema.index({ isActive: 1 });

export const TeamCategory = model<ITeamCategory>('TeamCategory', TeamCategorySchema);
