import { Schema, model } from 'mongoose';
import { IAdministrator } from '../types/models';

const AdministratorSchema = new Schema<IAdministrator>(
  {
    email: {
      type: String,
      required: [true, 'Admin email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Prevent password leak in queries by default
    },
    role: {
      type: String,
      enum: ['admin', 'superadmin'],
      default: 'admin',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).passwordHash;
        return ret;
      },
    },
  }
);

export const Administrator = model<IAdministrator>('Administrator', AdministratorSchema);
