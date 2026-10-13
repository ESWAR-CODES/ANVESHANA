import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';
import {
  signToken,
  verifyToken,
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
} from '../utils/token';

describe('Admin Authentication & Security Middleware', () => {
  const sampleAdmin = {
    id: '670b8f1023456789abcdef01',
    email: 'lead@anveshana-mbu.in',
    role: 'admin',
  };

  describe('JWT Utilities', () => {
    it('signs and verifies a valid token payload', () => {
      const token = signToken(sampleAdmin);
      expect(token).toBeDefined();

      const decoded = verifyToken(token);
      expect(decoded.id).toBe(sampleAdmin.id);
      expect(decoded.email).toBe(sampleAdmin.email);
      expect(decoded.role).toBe(sampleAdmin.role);
    });

    it('rejects tampered or forged tokens', () => {
      const token = signToken(sampleAdmin);
      const tampered = token + 'manipulated';
      expect(() => verifyToken(tampered)).toThrow();
    });

    it('enforces httpOnly and proper security settings on auth cookies', () => {
      const options = getAuthCookieOptions();
      expect(options.httpOnly).toBe(true);
      expect(options.path).toBe('/');
      expect(options.maxAge).toBe(2 * 60 * 60 * 1000);
    });
  });

  describe('Access Control & Middleware (isAuth / requireAdmin)', () => {
    it('blocks unauthenticated access to /api/v1/admin/auth/me with 401', async () => {
      const res = await request(app).get('/api/v1/admin/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('blocks unauthenticated access to protected admin route /api/v1/admin/test-protected with 401', async () => {
      const res = await request(app).get('/api/v1/admin/test-protected');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Unauthorized');
    });

    it('rejects forged or corrupted cookies with 401', async () => {
      const res = await request(app)
        .get('/api/v1/admin/test-protected')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=malicious.fake.jwt.token`]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('allows access to protected route when provided with a valid admin cookie', async () => {
      const token = signToken(sampleAdmin);
      const res = await request(app)
        .get('/api/v1/admin/test-protected')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admin.email).toBe(sampleAdmin.email);
      expect(res.body.data.admin.role).toBe(sampleAdmin.role);
    });

    it('returns current session info via /api/v1/admin/auth/me for valid cookie', async () => {
      const token = signToken(sampleAdmin);
      const res = await request(app)
        .get('/api/v1/admin/auth/me')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admin.email).toBe(sampleAdmin.email);
      // Ensures password hashes or secrets are never exposed
      expect(res.body.data.admin.passwordHash).toBeUndefined();
    });

    it('blocks access with 403 when user lacks admin privileges', async () => {
      const studentToken = signToken({
        id: '670b8f1023456789abcdef02',
        email: 'student@anveshana-mbu.in',
        role: 'student', // non-admin role
      });

      const res = await request(app)
        .get('/api/v1/admin/test-protected')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Forbidden');
    });

    it('returns 503 Service Unavailable when database is offline in non-test runtime', async () => {
      const prevEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        const token = signToken(sampleAdmin);
        const res = await request(app)
          .get('/api/v1/admin/test-protected')
          .set('Cookie', [`${AUTH_COOKIE_NAME}=${token}`]);

        expect(res.status).toBe(503);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('Database connection unavailable');
      } finally {
        process.env.NODE_ENV = prevEnv;
      }
    });
  });

  describe('Login & Logout Handlers', () => {
    it('validates login request payload and rejects invalid inputs with 400', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auth/login')
        .send({ email: 'not-an-email', password: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('reports database offline status safely with 503 when Atlas is not connected', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auth/login')
        .send({ email: 'admin@anveshana-mbu.in', password: 'ValidPassword123!' });

      // In current testing environment without MONGO_URI, returns safe 503
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database connection unavailable');
    });

    it('clears session cookie on logout', async () => {
      const res = await request(app).post('/api/v1/admin/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      const cookieHeader = Array.isArray(setCookie) ? setCookie.join(';') : setCookie;
      expect(cookieHeader).toContain(AUTH_COOKIE_NAME);
    });
  });
});
