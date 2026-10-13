import { Request, Response, NextFunction } from 'express';
import { verifyToken, AUTH_COOKIE_NAME, TokenPayload } from '../utils/token';
import { Administrator } from '../models/Administrator';
import { getDbStatus } from '../config/db';

// Augment Express Request interface with admin property
declare global {
  namespace Express {
    interface Request {
      admin?: TokenPayload;
    }
  }
}

/**
 * Middleware verifying JWT in HttpOnly cookie or Authorization Bearer header.
 */
export const isAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token = req.cookies?.[AUTH_COOKIE_NAME];

    // Support Bearer token header as fallback
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        data: null,
        error: 'Unauthorized: Authentication required',
      });
      return;
    }

    let decoded: TokenPayload;
    try {
      decoded = verifyToken(token);
    } catch {
      res.status(401).json({
        success: false,
        data: null,
        error: 'Unauthorized: Invalid or expired session',
      });
      return;
    }

    // Verify account status against database record
    const dbStatus = getDbStatus();
    if (dbStatus.connected) {
      const admin = await Administrator.findById(decoded.id);
      if (!admin) {
        res.status(401).json({
          success: false,
          data: null,
          error: 'Unauthorized: Administrator account not found',
        });
        return;
      }

      if (!admin.isActive) {
        res.status(403).json({
          success: false,
          data: null,
          error: 'Forbidden: Administrator account is suspended',
        });
        return;
      }

      req.admin = {
        id: admin._id.toString(),
        email: admin.email,
        role: admin.role,
      };
    } else if (process.env.NODE_ENV === 'test') {
      // In offline unit test mode, attach verified decoded payload
      req.admin = decoded;
    } else {
      res.status(503).json({
        success: false,
        data: null,
        error: 'Database connection unavailable. Persistent storage is offline.',
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error during authentication verification',
    });
  }
};

/**
 * Middleware requiring admin or superadmin privilege.
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await isAuth(req, res, () => {
    if (!req.admin || (req.admin.role !== 'admin' && req.admin.role !== 'superadmin')) {
      res.status(403).json({
        success: false,
        data: null,
        error: 'Forbidden: Administrator privileges required',
      });
      return;
    }
    next();
  });
};
