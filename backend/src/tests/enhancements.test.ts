import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../server';
import { signToken, AUTH_COOKIE_NAME } from '../utils/token';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { EventGallery } from '../models/EventGallery';
import { TeamCategory } from '../models/TeamCategory';
import { TeamMember } from '../models/TeamMember';
import { ensureTwoTeamCategoriesAndMigrate, REQUIRED_TEAM_CATEGORIES } from '../scripts/seedCategories';
import mongoose from 'mongoose';

describe('Comprehensive Bug Fixes & Feature Enhancements Tests', () => {
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

  const validObjectId = new mongoose.Types.ObjectId().toString();

  /* =========================================================================
     1. PHASE 1: EVENT REGISTRATION LIFECYCLE (REOPEN & REMOVE FORM)
     ========================================================================= */
  describe('Phase 1: Registration Lifecycle Endpoints', () => {
    it('rejects unauthenticated requests to PATCH /api/v1/admin/events/:id/form/reopen with 401', async () => {
      const res = await request(app).patch(`/api/v1/admin/events/${validObjectId}/form/reopen`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role on PATCH /api/v1/admin/events/:id/form/reopen with 403', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/events/${validObjectId}/form/reopen`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for invalid event ID on reopen', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/events/invalid-id-format/form/reopen')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid event identifier');
    });

    it('rejects unauthenticated requests to DELETE /api/v1/admin/events/:id/form with 401', async () => {
      const res = await request(app).delete(`/api/v1/admin/events/${validObjectId}/form`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 for invalid event ID on remove form', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/events/invalid-id-format/form')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid event identifier');
    });
  });

  /* =========================================================================
     2. PHASE 2: CENTRALIZED PARTICIPANT MANAGEMENT & EXPORTS
     ========================================================================= */
  describe('Phase 2: Centralized Participants & Secure Exports', () => {
    it('rejects unauthenticated requests to GET /api/v1/admin/participants with 401', async () => {
      const res = await request(app).get('/api/v1/admin/participants');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role on GET /api/v1/admin/participants with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/participants')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated requests to GET /api/v1/admin/participants/export with 401', async () => {
      const res = await request(app).get('/api/v1/admin/participants/export?format=csv');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role on GET /api/v1/admin/participants/export with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/participants/export?format=csv')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated requests to DELETE /api/v1/admin/events/:id/participants with 401', async () => {
      const res = await request(app).delete(`/api/v1/admin/events/${validObjectId}/participants`);
      expect(res.status).toBe(401);
    });

    it('returns 400 for invalid event ID on participants clear', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/events/invalid-id/participants')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid event identifier');
    });
  });

  /* =========================================================================
     3. PHASE 4: 2 SIMPLIFIED TEAM CATEGORIES & MIGRATION
     ========================================================================= */
  describe('Phase 4: Simplified Team Categories & Migration', () => {
    it('has exactly 2 mandated categories in REQUIRED_TEAM_CATEGORIES', () => {
      expect(REQUIRED_TEAM_CATEGORIES).toHaveLength(2);
      expect(REQUIRED_TEAM_CATEGORIES.map((c) => c.name)).toEqual(['Team Leads', 'Champions']);
      expect(REQUIRED_TEAM_CATEGORIES.map((c) => c.slug)).toEqual(['team-leads', 'champions']);
    });

    it('idempotently ensures both categories exist and returns boolean', async () => {
      // Mock mongoose findOne and create
      vi.spyOn(TeamCategory, 'findOne').mockResolvedValue(null as any);
      vi.spyOn(TeamCategory, 'create').mockImplementation(async (doc: any) => ({
        _id: new mongoose.Types.ObjectId(),
        ...doc,
      }) as any);
      vi.spyOn(TeamCategory, 'find').mockResolvedValue([] as any);
      vi.spyOn(TeamMember, 'updateMany').mockResolvedValue({ modifiedCount: 0 } as any);

      const result = await ensureTwoTeamCategoriesAndMigrate();
      expect(result).toBe(true);

      vi.restoreAllMocks();
    });
  });

  /* =========================================================================
     4. PHASE 5: EVENT GALLERY STORY EXPANSION
     ========================================================================= */
  describe('Phase 5: Event Gallery Story Expansion', () => {
    it('rejects unauthenticated requests to PUT /api/v1/admin/events/:id/gallery/story with 401', async () => {
      const res = await request(app).put(`/api/v1/admin/events/${validObjectId}/gallery/story`);
      expect(res.status).toBe(401);
    });

    it('rejects student role on PUT /api/v1/admin/events/:id/gallery/story with 403', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/events/${validObjectId}/gallery/story`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
    });

    it('returns 400 for invalid event ID on gallery story update', async () => {
      const res = await request(app)
        .put('/api/v1/admin/events/invalid-event-id/gallery/story')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid event identifier');
    });

    it('instantiates valid EventGallery with new story fields, winners, and altText', () => {
      const gallery = new EventGallery({
        eventId: new mongoose.Types.ObjectId(),
        title: 'Anveshana Hackathon 2026',
        eventDate: 'October 15, 2026',
        shortSummary: '36 hours of competitive computing innovation.',
        fullStory: 'Over 120 students built software prototypes.',
        challenges: 'Managing multi-cloud quotas during deployment.',
        highlights: ['120+ participants', '14 working projects'],
        winners: [
          { position: '1st Place', name: 'Team DevPulse', project: 'Automated Diagnostic Pipeline' },
        ],
        images: [
          {
            publicId: 'gallery_test_01',
            url: 'https://res.cloudinary.com/test/image.jpg',
            caption: 'Winning team celebration',
            altText: 'Students receiving gold trophy on stage',
            displayOrder: 1,
          },
        ],
      });

      const err = gallery.validateSync();
      expect(err).toBeUndefined();
      expect(gallery.title).toBe('Anveshana Hackathon 2026');
      expect(gallery.winners).toHaveLength(1);
      expect(gallery.winners![0].position).toBe('1st Place');
      expect(gallery.images[0].altText).toBe('Students receiving gold trophy on stage');
    });
  });
});
