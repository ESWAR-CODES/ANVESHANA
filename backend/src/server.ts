import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { env } from './config/env';
import { connectDB, getDbStatus } from './config/db';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes';
import adminEventRoutes from './routes/adminEventRoutes';
import feedbackRoutes from './routes/feedbackRoutes';
import adminFeedbackRoutes from './routes/adminFeedbackRoutes';
import teamRoutes from './routes/teamRoutes';
import adminTeamRoutes from './routes/adminTeamRoutes';
import settingsRoutes from './routes/settingsRoutes';
import adminSettingsRoutes from './routes/adminSettingsRoutes';
import adminParticipantRoutes from './routes/adminParticipantRoutes';
import { requireAdmin } from './middlewares/auth';
import { adminCsrfCheck } from './middlewares/csrf';
import {
  DEFAULT_ALLOWED_ORIGINS,
  normalizeOrigin,
  getAllowedOrigins,
  isOriginAllowed,
  corsOptions,
} from './config/cors';

export {
  DEFAULT_ALLOWED_ORIGINS,
  normalizeOrigin,
  getAllowedOrigins,
  isOriginAllowed,
  corsOptions,
};

dotenv.config();

const app = express();
const PORT = env.PORT || 5000;
const CLIENT_URL = env.CLIENT_URL || 'http://localhost:5173';

// Trust proxy in production (Render, Vercel, Railway, AWS, Cloudflare)
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  noSniff: true,
  xssFilter: true,
}));

// Mount CORS middleware for all incoming requests
app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight requests across all endpoints
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// CSRF Protection for state-changing admin operations
app.use('/api/v1/admin', adminCsrfCheck);

// Baseline health check
app.get('/api/health', (_req: Request, res: Response) => {
  const dbStatus = getDbStatus();
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    },
    error: null
  });
});

// Root API v1 info
app.get('/api/v1', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Anveshana Club API v1 Baseline Running',
      version: '1.0.0',
      databaseStatus: getDbStatus()
    },
    error: null
  });
});

// Admin Auth Routes
app.use('/api/v1/admin/auth', authRoutes);

// Event & Participant Routes (Public & Admin)
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/admin/events', adminEventRoutes);
app.use('/api/v1/admin/participants', adminParticipantRoutes);

// Feedback Routes (Public & Admin)
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/admin/feedback', adminFeedbackRoutes);

// Team Routes (Public & Admin)
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/admin/team', adminTeamRoutes);

// Club Settings Routes (Public & Admin)
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/admin/settings', adminSettingsRoutes);

// Protected Admin Verification Endpoint (used by tests and session checks)
app.get('/api/v1/admin/test-protected', requireAdmin, (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Access granted to protected admin resource',
      admin: req.admin,
    },
    error: null,
  });
});

// 404 Handler for undefined API routes
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    data: null,
    error: 'The requested API endpoint does not exist',
  });
});

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: express.NextFunction) => {
  if (err?.message?.includes('CORS origin not allowed')) {
    res.status(403).json({
      success: false,
      data: null,
      error: err.message,
    });
    return;
  }
  const statusCode = err?.status || err?.statusCode || 500;
  const message = env.NODE_ENV === 'production' && statusCode === 500
    ? 'An internal server error occurred'
    : err?.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    data: null,
    error: message,
  });
});

let server: any;

if (process.env.NODE_ENV !== 'test' && !process.env.PORT_OVERRIDE) {
  // Attempt DB connection on boot if configured; non-blocking
  connectDB().catch((err) => {
    console.warn('[Database] Initial connection skipped or failed:', err.message);
  });

  server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Anveshana Backend running on http://0.0.0.0:${PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[Server] Received ${signal}. Gracefully shutting down...`);
    if (server) {
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
      setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout');
        process.exit(1);
      }, 10000).unref();
    } else {
      process.exit(0);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default app;
