import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app, { isOriginAllowed, getAllowedOrigins, normalizeOrigin } from '../server';

describe('Production CORS & Preflight Specifications', () => {
  const prodOrigin = 'https://anveshana-rho.vercel.app';
  const localOrigin = 'http://localhost:5173';
  const maliciousOrigin = 'https://malicious-attacker.com';

  /* =========================================================================
     1. ORIGIN RESOLUTION & NORMALIZATION UNIT TESTS
     ========================================================================= */
  describe('Origin Resolution & Normalization', () => {
    it('normalizes origins by trimming whitespace, lowercase, and stripping trailing slashes', () => {
      expect(normalizeOrigin('  HTTPS://ANVESHANA-RHO.VERCEL.APP/  ')).toBe('https://anveshana-rho.vercel.app');
      expect(normalizeOrigin('http://localhost:5173/')).toBe('http://localhost:5173');
    });

    it('always permits the exact production Vercel origin', () => {
      expect(isOriginAllowed(prodOrigin)).toBe(true);
      expect(isOriginAllowed('https://anveshana-rho.vercel.app/')).toBe(true);
      expect(isOriginAllowed('https://anveshana-club.vercel.app')).toBe(true);
    });

    it('permits Vercel preview deployments for the anveshana project', () => {
      expect(isOriginAllowed('https://anveshana-git-feature.vercel.app')).toBe(true);
      expect(isOriginAllowed('https://anveshana-preview-123.vercel.app')).toBe(true);
    });

    it('permits development localhost and 127.0.0.1 origins', () => {
      expect(isOriginAllowed(localOrigin)).toBe(true);
      expect(isOriginAllowed('http://localhost:3000')).toBe(true);
      expect(isOriginAllowed('http://127.0.0.1:5173')).toBe(true);
    });

    it('rejects unauthorized external origins', () => {
      expect(isOriginAllowed(maliciousOrigin)).toBe(false);
      expect(isOriginAllowed('https://google.com')).toBe(false);
      expect(isOriginAllowed('https://evil-anveshana.com')).toBe(false);
      expect(isOriginAllowed('')).toBe(false);
    });

    it('supports CROS_URL alias (user configuration typo protection)', () => {
      const prevCros = process.env.CROS_URL;
      try {
        process.env.CROS_URL = 'https://custom-typo-frontend.vercel.app';
        expect(getAllowedOrigins()).toContain('https://custom-typo-frontend.vercel.app');
        expect(isOriginAllowed('https://custom-typo-frontend.vercel.app')).toBe(true);
      } finally {
        if (prevCros !== undefined) {
          process.env.CROS_URL = prevCros;
        } else {
          delete process.env.CROS_URL;
        }
      }
    });
  });

  /* =========================================================================
     2. PREFLIGHT OPTIONS REQUEST TESTS
     ========================================================================= */
  describe('HTTP OPTIONS Preflight Handling', () => {
    it('handles OPTIONS preflight for /api/v1/admin/auth/login from production origin', async () => {
      const res = await request(app)
        .options('/api/v1/admin/auth/login')
        .set('Origin', prodOrigin)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(prodOrigin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-allow-methods']).toContain('POST');
      expect(res.headers['access-control-allow-headers']).toContain('Content-Type');
      expect(res.headers['access-control-max-age']).toBe('86400');
    });

    it('handles OPTIONS preflight for /api/v1/admin/auth/me from production origin', async () => {
      const res = await request(app)
        .options('/api/v1/admin/auth/me')
        .set('Origin', prodOrigin)
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'content-type');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(prodOrigin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('handles OPTIONS preflight for localhost development origin', async () => {
      const res = await request(app)
        .options('/api/v1/admin/auth/login')
        .set('Origin', localOrigin)
        .set('Access-Control-Request-Method', 'POST');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(localOrigin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('does not return Access-Control-Allow-Origin header for rejected origins on OPTIONS preflight', async () => {
      const res = await request(app)
        .options('/api/v1/admin/auth/login')
        .set('Origin', maliciousOrigin)
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  /* =========================================================================
     3. ACTUAL HTTP REQUEST CORS HEADERS & CREDENTIALS
     ========================================================================= */
  describe('Actual Request CORS Headers & Credentials', () => {
    it('returns exact origin (not *) and credentials: true on POST /api/v1/admin/auth/login', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auth/login')
        .set('Origin', prodOrigin)
        .send({ email: 'test@invalid.com', password: 'wrong' });

      // Origin header must match the request origin exactly
      expect(res.headers['access-control-allow-origin']).toBe(prodOrigin);
      expect(res.headers['access-control-allow-origin']).not.toBe('*');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('returns exact origin and credentials: true on GET /api/v1/admin/auth/me', async () => {
      const res = await request(app)
        .get('/api/v1/admin/auth/me')
        .set('Origin', prodOrigin);

      expect(res.headers['access-control-allow-origin']).toBe(prodOrigin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('returns exact origin and credentials: true on GET /api/health', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', prodOrigin);

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe(prodOrigin);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('permits requests with no Origin header (health checkers, curl, server-to-server)', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('does not set Access-Control-Allow-Origin for unauthorized origin on actual GET request', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', maliciousOrigin);

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
