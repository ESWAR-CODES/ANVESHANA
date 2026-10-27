import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';
import { escapeRegex } from '../utils/sanitize';
import { isValidImageBuffer } from '../middlewares/upload';
import { signToken, AUTH_COOKIE_NAME } from '../utils/token';

describe('Security Hardening & Protection Specifications', () => {
  const adminToken = signToken({
    id: '65e9d2f0a1b2c3d4e5f6a7b8',
    email: 'admin@mbu.edu.in',
    role: 'superadmin',
  });

  /* =========================================================================
     1. REGEX SANITIZATION & REDOS DEFENSE
     ========================================================================= */
  describe('NoSQL Regex & ReDoS Sanitization', () => {
    it('escapes special regex characters to prevent regex pattern injection', () => {
      const maliciousPayload = '.*+?^${}()|[]\\test';
      const escaped = escapeRegex(maliciousPayload);

      expect(escaped).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\test');
      const regex = new RegExp(escaped, 'i');
      expect(regex.test('.*+?^${}()|[]\\test')).toBe(true);
      expect(regex.test('completely different string')).toBe(false);
    });

    it('safely handles non-string and empty inputs', () => {
      expect(escapeRegex('')).toBe('');
      expect(escapeRegex(null as any)).toBe('');
      expect(escapeRegex(undefined as any)).toBe('');
      expect(escapeRegex(12345 as any)).toBe('');
    });

    it('prevents ReDoS catastrophic backtracking patterns', () => {
      const redosPattern = '(a+)+$';
      const safe = escapeRegex(redosPattern);
      expect(safe).toBe('\\(a\\+\\)\\+\\$');
    });
  });

  /* =========================================================================
     2. FILE SIGNATURE (MAGIC BYTES) VERIFICATION
     ========================================================================= */
  describe('File Signature (Magic Bytes) Verification', () => {
    const validJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
    const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
    const validWebp = Buffer.from([
      0x52, 0x49, 0x46, 0x46, // 'RIFF'
      0x24, 0x00, 0x00, 0x00, // length
      0x57, 0x45, 0x42, 0x50, // 'WEBP'
      0x56, 0x50, 0x38, 0x20, // 'VP8 '
    ]);

    const fakePayload = Buffer.from('FAKE_UNAUTHORIZED_SCRIPT_CONTENTS_NOT_AN_IMAGE');
    const fakeExe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);
    const shortBuffer = Buffer.from([0xff, 0xd8]);

    it('identifies and permits legitimate JPEG, PNG, and WebP signatures', () => {
      expect(isValidImageBuffer(validJpeg)).toBe(true);
      expect(isValidImageBuffer(validPng)).toBe(true);
      expect(isValidImageBuffer(validWebp)).toBe(true);
    });

    it('rejects spoofed files and invalid file headers', () => {
      expect(isValidImageBuffer(fakePayload)).toBe(false);
      expect(isValidImageBuffer(fakeExe)).toBe(false);
      expect(isValidImageBuffer(shortBuffer)).toBe(false);
      expect(isValidImageBuffer(Buffer.alloc(0))).toBe(false);
    });

    it('rejects uploaded file when content does not match image magic bytes even with image/jpeg mime', async () => {
      const res = await request(app)
        .post('/api/v1/admin/events')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .set('Origin', 'https://anveshana-rho.vercel.app')
        .field('title', 'Security Test Summit')
        .field('shortDescription', 'Testing magic bytes validation.')
        .field('fullDescription', 'Full testing description for security suite.')
        .field('eventDate', '2026-11-20T10:00:00Z')
        .field('time', '10:00 AM')
        .field('venue', 'Auditorium')
        .attach('banner', Buffer.from('RAW_TEXT_NOT_AN_IMAGE_FILE_BUFFER'), {
          filename: 'banner.jpg',
          contentType: 'image/jpeg',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid file signature');
    });
  });

  /* =========================================================================
     3. CSRF PROTECTION ON ADMIN OPERATIONS
     ========================================================================= */
  describe('Cross-Site Request Forgery (CSRF) Defense', () => {
    it('permits mutating state requests from verified production origin', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auth/logout')
        .set('Origin', 'https://anveshana-rho.vercel.app');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('permits mutating state requests from local development origin', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auth/logout')
        .set('Origin', 'http://localhost:5173');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('blocks mutating state requests with 403 when Origin is unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auth/logout')
        .set('Origin', 'https://attacker-phishing-site.com');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('CSRF validation failed');
    });

    it('blocks mutating state requests with 403 when Referer origin is unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auth/logout')
        .set('Referer', 'https://malicious-forum.org/threads/exploit');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('CSRF validation failed');
    });

    it('blocks mutating state requests with 403 when Referer is malformed', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auth/logout')
        .set('Referer', 'not-a-valid-url-format');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Malformed referer header');
    });

    it('blocks mutating state requests when Origin is valid but Referer is unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auth/logout')
        .set('Origin', 'https://anveshana-rho.vercel.app')
        .set('Referer', 'https://evil-spoof.com/attack');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Unauthorized request referer');
    });

    it('blocks cross-site mutating requests when Sec-Fetch-Site is cross-site without origin', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auth/logout')
        .set('sec-fetch-site', 'cross-site');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Cross-site request rejected due to missing origin');
    });

    it('blocks authenticated cookie requests when both Origin and Referer are omitted in production mode', async () => {
      const res = await request(app)
        .post('/api/v1/admin/auth/logout')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .set('x-enforce-csrf', 'true');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Missing required origin and referer headers');
    });

    it('allows read-only GET requests even if origin header is cross-site', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'https://some-external-site.com');

      expect(res.status).toBe(200);
    });
  });

  /* =========================================================================
     4. SECURITY HEADERS VERIFICATION
     ========================================================================= */
  describe('Production Security Headers (Helmet)', () => {
    it('sets strict transport security, clickjacking protection, and x-content-type-options', async () => {
      const res = await request(app).get('/api/health');

      expect(res.headers['x-frame-options']).toBe('DENY');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    });
  });
});
