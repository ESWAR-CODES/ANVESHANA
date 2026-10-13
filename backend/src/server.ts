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
import { requireAdmin } from './middlewares/auth';

dotenv.config();

const app = express();
const PORT = env.PORT || 5000;
const CLIENT_URL = env.CLIENT_URL || 'http://localhost:5173';

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
  crossOriginEmbedderPolicy: false,
}));

// Strict CORS Configuration
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

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

// Event Routes (Public & Admin)
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/admin/events', adminEventRoutes);

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

if (process.env.NODE_ENV !== 'test' && !process.env.PORT_OVERRIDE) {
  // Attempt DB connection on boot if configured; non-blocking
  connectDB().catch((err) => {
    console.warn('[Database] Initial connection skipped or failed:', err.message);
  });

  app.listen(PORT, () => {
    console.log(`[Server] Anveshana Backend running on http://localhost:${PORT}`);
  });
}

export default app;
