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
}));

// ==========================================
// CORS Configuration & Origin Resolution
// ==========================================

export const DEFAULT_ALLOWED_ORIGINS = [
  'https://anveshana-rho.vercel.app',
  'https://anveshana-club.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:80',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

export const normalizeOrigin = (url: string): string => {
  return url.trim().replace(/\/+$/, '').toLowerCase();
};

export const getAllowedOrigins = (): string[] => {
  const envCandidates = [
    env.CLIENT_URL,
    process.env.CLIENT_URL,
    process.env.CORS_URL,
    process.env.CROS_URL,
    process.env.cros_url,
    process.env.cors_url,
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  const envOrigins = envCandidates
    .flatMap((val) => (val as string).split(','))
    .map(normalizeOrigin)
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS.map(normalizeOrigin), ...envOrigins]));
};

export const isOriginAllowed = (origin: string): boolean => {
  if (!origin) return false;
  const normalized = normalizeOrigin(origin);
  const allowed = getAllowedOrigins();

  // 1. Exact match against allowed list
  if (allowed.includes(normalized) || allowed.includes('*')) {
    return true;
  }

  // 2. Allow any official Vercel preview or production deployment for Anveshana
  if (/^https:\/\/anveshana(-[a-z0-9_-]+)?\.vercel\.app$/.test(normalized)) {
    return true;
  }

  // 3. Allow localhost/127.0.0.1 on any port (for local frontend dev/testing)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalized)) {
    return true;
  }

  return false;
};

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Non-browser or server-to-server requests (curl, postman, health checks) have no origin
    if (!origin) {
      return callback(null, true);
    }
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    // Origin not allowed: pass null, false so cors doesn't attach headers and avoids crashing
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204,
  maxAge: 86400, // 24 hours preflight cache
};

// Mount CORS middleware for all incoming requests
app.use(cors(corsOptions));

// Explicitly handle OPTIONS preflight requests across all endpoints
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

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
