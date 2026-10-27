import cors from 'cors';
import { env } from './env';

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
