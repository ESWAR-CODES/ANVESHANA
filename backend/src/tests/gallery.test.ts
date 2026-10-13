import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';
import { signToken, AUTH_COOKIE_NAME } from '../utils/token';
import { EventGallery } from '../models/EventGallery';
import mongoose from 'mongoose';

describe('Phase 8: Event Galleries Specifications & Security', () => {
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
     1. EVENT GALLERY MONGOOSE MODEL SPECIFICATIONS
     ========================================================================= */
  describe('EventGallery Mongoose Model Definition', () => {
    it('instantiates valid gallery document with default empty images array', () => {
      const doc = new EventGallery({
        eventId: new mongoose.Types.ObjectId(),
        images: [],
      });

      expect(doc.eventId).toBeDefined();
      expect(Array.isArray(doc.images)).toBe(true);
      expect(doc.images).toHaveLength(0);
    });

    it('rejects gallery instantiation without required eventId', () => {
      const doc = new EventGallery({
        images: [],
      });
      const err = doc.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors['eventId']).toBeDefined();
    });

    it('validates image item structure within images array', () => {
      const doc = new EventGallery({
        eventId: new mongoose.Types.ObjectId(),
        images: [
          {
            publicId: 'anveshana/gallery/img1',
            url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
            caption: 'Opening Keynote at Mohan Babu University',
            displayOrder: 1,
          },
        ],
      });

      const err = doc.validateSync();
      expect(err).toBeUndefined();
      expect(doc.images[0].publicId).toBe('anveshana/gallery/img1');
      expect(doc.images[0].displayOrder).toBe(1);
    });
  });

  /* =========================================================================
     2. PUBLIC EVENT GALLERY RETRIEVAL
     ========================================================================= */
  describe('Public Event Gallery Endpoint', () => {
    it('returns 503 fail-safe on public gallery listing when database is disconnected', async () => {
      const res = await request(app).get('/api/v1/events/mbu-hackathon-2026/gallery');
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database service is currently unavailable');
    });
  });

  /* =========================================================================
     3. ADMIN GALLERY ENDPOINTS AUTHORIZATION & ACCESS CONTROL
     ========================================================================= */
  describe('Admin Gallery Endpoints Authorization', () => {
    it('rejects unauthenticated requests to GET /api/v1/admin/events/:id/gallery with 401', async () => {
      const res = await request(app).get(`/api/v1/admin/events/${validObjectId}/gallery`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on GET /api/v1/admin/events/:id/gallery', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/events/${validObjectId}/gallery`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated requests to POST /api/v1/admin/events/:id/gallery with 401', async () => {
      const res = await request(app).post(`/api/v1/admin/events/${validObjectId}/gallery`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on POST /api/v1/admin/events/:id/gallery', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/events/${validObjectId}/gallery`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated requests to DELETE /api/v1/admin/events/:id/gallery with 401', async () => {
      const res = await request(app).delete(`/api/v1/admin/events/${validObjectId}/gallery`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on DELETE /api/v1/admin/events/:id/gallery', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/events/${validObjectId}/gallery`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated requests to PUT /api/v1/admin/events/:id/gallery with 401', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/events/${validObjectId}/gallery`)
        .send({ images: [] });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on PUT /api/v1/admin/events/:id/gallery', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/events/${validObjectId}/gallery`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`])
        .send({ images: [] });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  /* =========================================================================
     4. INPUT VALIDATION & FILE UPLOAD CONSTRAINTS
     ========================================================================= */
  describe('Admin Gallery Input Validation & File Constraints', () => {
    it('returns 400 when invalid event ID format is passed to admin gallery GET', async () => {
      const res = await request(app)
        .get('/api/v1/admin/events/invalid-event-id/gallery')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid event identifier format');
    });

    it('returns 400 when invalid event ID format is passed to admin gallery POST', async () => {
      const res = await request(app)
        .post('/api/v1/admin/events/invalid-event-id/gallery')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid event identifier format');
    });

    it('returns 400 when no photo file is provided on admin gallery POST', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/events/${validObjectId}/gallery`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('An image file is required for gallery upload');
    });

    it('rejects non-image mime types when uploading to gallery', async () => {
      const dummyTextBuffer = Buffer.from('This is a text file, not an image.');
      const res = await request(app)
        .post(`/api/v1/admin/events/${validObjectId}/gallery`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .attach('image', dummyTextBuffer, {
          filename: 'test.txt',
          contentType: 'text/plain',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Only JPEG, PNG, and WebP images are allowed');
    });

    it('returns 400 when publicId is missing on admin gallery DELETE', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/events/${validObjectId}/gallery`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Cloudinary public ID is required');
    });

    it('returns 400 when images payload is not an array on admin gallery PUT', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/events/${validObjectId}/gallery`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .send({ images: 'not-an-array' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Images array is required');
    });
  });
});
