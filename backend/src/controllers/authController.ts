import { Request, Response } from 'express';
import { z } from 'zod';
import { Administrator } from '../models/Administrator';
import { comparePassword } from '../utils/password';
import {
  signToken,
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  getClearCookieOptions,
} from '../utils/token';
import { getDbStatus } from '../config/db';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * Administrator login handler.
 * Verifies credentials, sets HttpOnly JWT cookie, returns admin profile.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        data: null,
        error: parseResult.error.issues[0]?.message || 'Invalid input payload',
      });
      return;
    }

    const { email, password } = parseResult.data;
    const dbStatus = getDbStatus();

    if (!dbStatus.connected) {
      res.status(503).json({
        success: false,
        data: null,
        error: 'Database connection unavailable. MongoDB Atlas configuration is required.',
      });
      return;
    }

    // Query admin explicitly requesting passwordHash
    const admin = await Administrator.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');

    if (!admin) {
      // Generic message prevents user enumeration
      res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid email or password',
      });
      return;
    }

    if (!admin.isActive) {
      res.status(403).json({
        success: false,
        data: null,
        error: 'Administrator account is suspended',
      });
      return;
    }

    const isMatch = await comparePassword(password, admin.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid email or password',
      });
      return;
    }

    // Update lastLogin timestamp
    admin.lastLogin = new Date();
    await admin.save();

    // Sign JWT token
    const token = signToken({
      id: admin._id.toString(),
      email: admin.email,
      role: admin.role,
    });

    // Set HttpOnly, Secure, SameSite cookie
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    res.status(200).json({
      success: true,
      data: {
        admin: {
          id: admin._id.toString(),
          email: admin.email,
          role: admin.role,
        },
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'An internal server error occurred during login',
    });
  }
};

/**
 * Administrator logout handler.
 * Clears HttpOnly session cookie.
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie(AUTH_COOKIE_NAME, getClearCookieOptions());
  res.status(200).json({
    success: true,
    data: {
      message: 'Logged out successfully',
    },
    error: null,
  });
};

/**
 * Current authenticated admin session inspector.
 */
export const me = async (req: Request, res: Response): Promise<void> => {
  if (!req.admin) {
    res.status(401).json({
      success: false,
      data: null,
      error: 'Unauthorized: Session not active',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      admin: {
        id: req.admin.id,
        email: req.admin.email,
        role: req.admin.role,
      },
    },
    error: null,
  });
};
