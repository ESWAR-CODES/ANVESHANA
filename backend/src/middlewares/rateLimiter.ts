import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 failed attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      data: null,
      error: 'Too many login attempts from this IP address. Please try again in 15 minutes.',
    });
  },
});

export const registrationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 registration submissions per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      data: null,
      error: 'Too many registration attempts from this network. Please wait a few minutes before trying again.',
    });
  },
});

export const feedbackRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 100 : 5, // 5 feedback submissions per IP in dev/prod
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      data: null,
      error: 'Too many feedback submissions from this network. Please try again later.',
    });
  },
});
