import { Request, Response, NextFunction } from 'express';
import { isOriginAllowed } from '../config/cors';
import { AUTH_COOKIE_NAME } from '../utils/token';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF Protection Middleware for Admin endpoints.
 * Verifies that mutating requests (POST, PUT, PATCH, DELETE) originate from an authorized client origin.
 * Defends against cross-site request forgery when HttpOnly cookies are used across domains.
 */
export const adminCsrfCheck = (req: Request, res: Response, next: NextFunction): void => {
  // Safe HTTP methods do not alter state
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    return next();
  }

  const originHeader = req.headers.origin as string | undefined;
  const refererHeader = req.headers.referer as string | undefined;
  const secFetchSite = req.headers['sec-fetch-site'] as string | undefined;

  // 1. If Sec-Fetch-Site explicitly indicates an unauthorized cross-site request without valid origin:
  if (secFetchSite === 'cross-site') {
    if (!originHeader && !refererHeader) {
      res.status(403).json({
        success: false,
        data: null,
        error: 'CSRF validation failed: Cross-site request rejected due to missing origin.',
      });
      return;
    }
  }

  // 2. Validate Origin header whenever present
  if (originHeader) {
    if (!isOriginAllowed(originHeader)) {
      res.status(403).json({
        success: false,
        data: null,
        error: 'CSRF validation failed: Unauthorized request origin.',
      });
      return;
    }
  }

  // 3. Validate Referer header whenever present
  if (refererHeader) {
    try {
      const refererOrigin = new URL(refererHeader).origin;
      if (!isOriginAllowed(refererOrigin)) {
        res.status(403).json({
          success: false,
          data: null,
          error: 'CSRF validation failed: Unauthorized request referer.',
        });
        return;
      }
    } catch {
      res.status(403).json({
        success: false,
        data: null,
        error: 'CSRF validation failed: Malformed referer header.',
      });
      return;
    }
  }

  // 4. Handle cases where BOTH Origin and Referer are omitted
  if (!originHeader && !refererHeader) {
    const hasAuthCookie = Boolean(req.cookies?.[AUTH_COOKIE_NAME]);
    // In production, authenticated requests carrying ambient admin cookies MUST verify origin
    if (hasAuthCookie && (process.env.NODE_ENV === 'production' || req.headers['x-enforce-csrf'] === 'true')) {
      res.status(403).json({
        success: false,
        data: null,
        error: 'CSRF validation failed: Missing required origin and referer headers on authenticated request.',
      });
      return;
    }
  }

  next();
};
