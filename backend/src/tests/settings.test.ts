import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';
import { signToken, AUTH_COOKIE_NAME } from '../utils/token';
import { ClubSettings } from '../models/ClubSettings';

describe('Phase 8: Club Settings & Whitelist Security Specifications', () => {
  const adminToken = signToken({
    id: '670b8f1023456789abcdef01',
    email: 'lead@anveshana-mbu.in',
    role: 'admin',
  });

  const studentToken = signToken({
    id: '670b8f1023456789abcdef02',
    email: 'student@anveshana-mbu.in',
    role: 'student',
  });

  /* =========================================================================
     1. CLUB SETTINGS MONGOOSE MODEL SPECIFICATIONS
     ========================================================================= */
  describe('ClubSettings Mongoose Model Definition', () => {
    it('instantiates valid singleton document with default university values', () => {
      const doc = new ClubSettings({
        contactEmail: 'anveshana@mbu.edu.in',
      });

      const err = doc.validateSync();
      expect(err).toBeUndefined();
      expect(doc.clubName).toBe('Anveshana Club');
      expect(doc.tagline).toBe('Explore · Build · Bring Ideas to Life.');
      expect(doc.isSingleton).toBe(true);
      expect(doc.contactEmail).toBe('anveshana@mbu.edu.in');
    });

    it('rejects ClubSettings without required contactEmail', () => {
      const doc = new ClubSettings({
        clubName: 'Anveshana Club',
        contactEmail: '',
      });
      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors['contactEmail']).toBeDefined();
    });

    it('preserves nested socialLinks structure', () => {
      const doc = new ClubSettings({
        contactEmail: 'anveshana@mbu.edu.in',
        socialLinks: {
          instagram: 'https://instagram.com/anveshana_mbu',
          linkedin: 'https://linkedin.com/company/anveshana-mbu',
          github: 'https://github.com/anveshana-mbu',
        },
      });

      const err = doc.validateSync();
      expect(err).toBeUndefined();
      expect(doc.socialLinks.instagram).toBe('https://instagram.com/anveshana_mbu');
      expect(doc.socialLinks.linkedin).toBe('https://linkedin.com/company/anveshana-mbu');
      expect(doc.socialLinks.github).toBe('https://github.com/anveshana-mbu');
    });
  });

  /* =========================================================================
     2. PUBLIC SETTINGS RETRIEVAL & OFFLINE RESILIENCE
     ========================================================================= */
  describe('Public Club Settings Endpoint (Offline Resilience)', () => {
    it('returns HTTP 200 with default fallback settings even when database is offline', async () => {
      const res = await request(app).get('/api/v1/settings');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();

      // Verify Mohan Babu University default branding and contacts
      const data = res.body.data;
      expect(data.clubName).toBe('Anveshana Club');
      expect(data.tagline).toBe('Explore · Build · Bring Ideas to Life.');
      expect(data.contactEmail).toBe('anveshana@mbu.edu.in');
      expect(data.isSingleton).toBe(true);
    });
  });

  /* =========================================================================
     3. ADMIN SETTINGS ENDPOINTS AUTHORIZATION & ACCESS CONTROL
     ========================================================================= */
  describe('Admin Settings Endpoints Authorization', () => {
    it('rejects unauthenticated requests to GET /api/v1/admin/settings with 401', async () => {
      const res = await request(app).get('/api/v1/admin/settings');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on GET /api/v1/admin/settings', async () => {
      const res = await request(app)
        .get('/api/v1/admin/settings')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated requests to PUT /api/v1/admin/settings with 401', async () => {
      const res = await request(app).put('/api/v1/admin/settings').send({
        contactEmail: 'desk@mbu.edu.in',
      });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on PUT /api/v1/admin/settings', async () => {
      const res = await request(app)
        .put('/api/v1/admin/settings')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`])
        .send({ contactEmail: 'desk@mbu.edu.in' });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  /* =========================================================================
     4. ADMIN SETTINGS WHITELIST ENFORCEMENT & INPUT VALIDATION
     ========================================================================= */
  describe('Admin Settings Whitelist Enforcement & Validation', () => {
    it('validates contactEmail format and rejects invalid emails', async () => {
      const res = await request(app)
        .put('/api/v1/admin/settings')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .send({ contactEmail: 'invalid-email-address' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Valid contact email is required');
    });

    it('validates social link URLs and rejects non-http protocols', async () => {
      const res = await request(app)
        .put('/api/v1/admin/settings')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .send({
          contactEmail: 'anveshana@mbu.edu.in',
          socialLinks: {
            instagram: 'ftp://not-a-web-url',
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Social link for instagram must be a valid HTTP or HTTPS URL');
    });

    it('returns 503 fail-safe on admin update when database is disconnected', async () => {
      const res = await request(app)
        .put('/api/v1/admin/settings')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .send({
          contactEmail: 'updated-lead@mbu.edu.in',
          contactPhone: '+91 9876543210',
          socialLinks: {
            instagram: 'https://instagram.com/anveshana_mbu',
          },
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database service is currently unavailable');
    });
  });

  /* =========================================================================
     5. DUAL LOGO MANAGEMENT & CMS ENDPOINTS
     ========================================================================= */
  describe('Dual Logo Management & CMS Endpoints', () => {
    it('rejects unauthenticated requests to POST /api/v1/admin/settings/logo/club with 401', async () => {
      const res = await request(app).post('/api/v1/admin/settings/logo/club');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role on POST /api/v1/admin/settings/logo/club with 403', async () => {
      const res = await request(app)
        .post('/api/v1/admin/settings/logo/club')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects request without logo file with 400', async () => {
      const res = await request(app)
        .post('/api/v1/admin/settings/logo/club')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('No logo image file was provided');
    });

    it('rejects unauthenticated requests to POST /api/v1/admin/settings/logo/university with 401', async () => {
      const res = await request(app).post('/api/v1/admin/settings/logo/university');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role on DELETE /api/v1/admin/settings/logo/club with 403', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/settings/logo/club')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns public settings containing full CMS fields and defaults', async () => {
      const res = await request(app).get('/api/v1/settings');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hero).toBeDefined();
      expect(res.body.data.hero.title).toBe('ANVESHANA');
      expect(res.body.data.about).toBeDefined();
      expect(res.body.data.about.heading).toBe('Bridging Computing and Engineering.');
      expect(res.body.data.stats).toHaveLength(4);
      expect(res.body.data.navbar).toBeDefined();
      expect(res.body.data.footer).toBeDefined();
      expect(res.body.data.pagesContent).toBeDefined();
      expect(res.body.data.pagesContent.events.title).toBe('Our Events');
    });
  });
});

