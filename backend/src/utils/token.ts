import jwt, { SignOptions } from 'jsonwebtoken';
import { CookieOptions } from 'express';
import { env } from '../config/env';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export const AUTH_COOKIE_NAME = 'anveshana_admin_token';

/**
 * Signs a short-lived JSON Web Token for authenticated administrators.
 */
export const signToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: (env.JWT_EXPIRES_IN || '2h') as any,
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
};

/**
 * Verifies a JWT token signature and decodes the payload.
 */
export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

/**
 * Returns secure cookie settings for storing JWT in HttpOnly cookies.
 * In cross-site production deployments (e.g. Vercel frontend + Render backend),
 * sameSite defaults to 'none' with secure: true to permit cross-domain API credentials.
 */
export const getAuthCookieOptions = (): CookieOptions => {
  const isProduction = env.NODE_ENV === 'production';
  const sameSite = env.COOKIE_SAME_SITE ?? (isProduction ? 'none' : 'lax');
  const secure = env.COOKIE_SECURE ?? (isProduction || sameSite === 'none');

  return {
    httpOnly: true, // Prevents JavaScript client-side theft
    secure,
    sameSite,
    maxAge: 2 * 60 * 60 * 1000, // 2 hours in ms
    path: '/',
  };
};

/**
 * Returns options for clearing the auth cookie upon logout.
 */
export const getClearCookieOptions = (): CookieOptions => {
  const isProduction = env.NODE_ENV === 'production';
  const sameSite = env.COOKIE_SAME_SITE ?? (isProduction ? 'none' : 'lax');
  const secure = env.COOKIE_SECURE ?? (isProduction || sameSite === 'none');

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  };
};
