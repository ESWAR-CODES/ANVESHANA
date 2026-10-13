import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';
import { signToken, AUTH_COOKIE_NAME } from '../utils/token';
import { Event } from '../models/Event';

describe('Event API & Lifecycle Specifications', () => {
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

  describe('Public Event Endpoints', () => {
    it('returns 503 cleanly on GET /api/v1/events when database is offline', async () => {
      const res = await request(app).get('/api/v1/events');
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database service is currently unavailable');
    });

    it('returns 503 cleanly on GET /api/v1/events/:slug when database is offline', async () => {
      const res = await request(app).get('/api/v1/events/hackathon-2026');
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Admin Authorization on Event Endpoints', () => {
    it('rejects unauthenticated requests to GET /api/v1/admin/events with 401', async () => {
      const res = await request(app).get('/api/v1/admin/events');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated requests to POST /api/v1/admin/events with 401', async () => {
      const res = await request(app).post('/api/v1/admin/events').send({ title: 'Test' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects non-admin roles with 403 on POST /api/v1/admin/events', async () => {
      const res = await request(app)
        .post('/api/v1/admin/events')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`])
        .send({ title: 'Unauthorized Event' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Forbidden');
    });

    it('rejects unauthenticated PATCH /api/v1/admin/events/:id/publish with 401', async () => {
      const res = await request(app).patch('/api/v1/admin/events/123/publish');
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated PATCH /api/v1/admin/events/:id/archive with 401', async () => {
      const res = await request(app).patch('/api/v1/admin/events/123/archive');
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated DELETE /api/v1/admin/events/:id with 401', async () => {
      const res = await request(app).delete('/api/v1/admin/events/123');
      expect(res.status).toBe(401);
    });
  });

  describe('Event Input Validation & Upload Constraints', () => {
    it('validates required fields on event creation payload with 400', async () => {
      const res = await request(app)
        .post('/api/v1/admin/events')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .send({
          title: 'Ab', // less than 3 chars
          shortDescription: 'short',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('rejects event creation without a banner image with 400', async () => {
      const res = await request(app)
        .post('/api/v1/admin/events')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .send({
          title: 'Full Valid Title for Hackathon',
          category: 'Hackathon',
          shortDescription: 'Valid short description exceeding ten characters.',
          fullDescription: 'Valid full description text exceeding minimum character length requirements.',
          eventDate: new Date().toISOString(),
          time: '10:00 AM',
          venue: 'Auditorium Block A',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('banner');
    });

    it('rejects non-image file uploads via Multer with 400', async () => {
      const res = await request(app)
        .post('/api/v1/admin/events')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .field('title', 'Hackathon 2026')
        .attach('banner', Buffer.from('console.log("not an image")'), 'script.js');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid file type');
    });
  });

  describe('Computed Registration State & Lifecycle Rules', () => {
    const baseData = {
      title: 'State Calculation Test Event',
      slug: 'state-calculation-test-event',
      category: 'Workshop',
      shortDescription: 'A valid short description text for calculation.',
      fullDescription: 'Full rich text description for calculation test.',
      bannerMedia: { publicId: 'test_id', url: 'https://example.com/banner.jpg' },
      eventDate: new Date(Date.now() + 86400000 * 5), // 5 days in future
      time: '10:00 AM',
      venue: 'Main Hall',
      isPublished: true,
      isArchived: false,
      isDeleted: false,
      status: 'published' as const,
      registeredCount: 0,
      maxParticipants: 100,
    };

    it('evaluates status as "draft" if isPublished is false', () => {
      const event = new Event({ ...baseData, isPublished: false });
      expect(event.getComputedStatus()).toBe('draft');
    });

    it('evaluates status as "archived" if isArchived or isDeleted is true', () => {
      const eventArchived = new Event({ ...baseData, isArchived: true });
      expect(eventArchived.getComputedStatus()).toBe('archived');

      const eventDeleted = new Event({ ...baseData, isDeleted: true });
      expect(eventDeleted.getComputedStatus()).toBe('archived');
    });

    it('evaluates status as "completed" if eventDate has passed in time', () => {
      const pastEvent = new Event({
        ...baseData,
        eventDate: new Date(Date.now() - 86400000), // 1 day ago
      });
      expect(pastEvent.getComputedStatus()).toBe('completed');
    });

    it('evaluates status as "upcoming" if current time is before regOpenDate', () => {
      const upcomingEvent = new Event({
        ...baseData,
        regOpenDate: new Date(Date.now() + 3600000 * 2), // opens in 2 hours
      });
      expect(upcomingEvent.getComputedStatus()).toBe('upcoming');
      expect(upcomingEvent.isRegistrationOpen()).toBe(false);
    });

    it('evaluates status as "full" if registeredCount reaches maxParticipants', () => {
      const fullEvent = new Event({
        ...baseData,
        status: 'open',
        registeredCount: 100,
        maxParticipants: 100,
      });
      expect(fullEvent.getComputedStatus()).toBe('full');
      expect(fullEvent.isRegistrationOpen()).toBe(false);
      expect(fullEvent.canAcceptRegistrations().allowed).toBe(false);
    });

    it('evaluates status as "open" during active window with available capacity', () => {
      const openEvent = new Event({
        ...baseData,
        status: 'open',
        regOpenDate: new Date(Date.now() - 3600000),
        regCloseDate: new Date(Date.now() + 3600000),
        registeredCount: 42,
        maxParticipants: 100,
      });
      expect(openEvent.getComputedStatus()).toBe('open');
      expect(openEvent.isRegistrationOpen()).toBe(true);
      expect(openEvent.canAcceptRegistrations().allowed).toBe(true);
    });
  });
});
