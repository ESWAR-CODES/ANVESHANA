import { describe, it, expect } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '../server';
import { signToken, AUTH_COOKIE_NAME } from '../utils/token';
import { Feedback } from '../models/Feedback';

describe('Phase 7: Feedback Moderation, Privacy & Rating Aggregation Specifications', () => {
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

  const validObjectId = '670b8f1023456789abcdef55';

  /* =========================================================================
     1. FEEDBACK MONGOOSE MODEL SCHEMA SPECIFICATIONS
     ========================================================================= */
  describe('Feedback Mongoose Model Definition', () => {
    it('instantiates valid feedback document with correct default values', () => {
      const doc = new Feedback({
        rating: 5,
        feedbackText: 'Outstanding workshop on modern cloud architectures!',
        ipHash: crypto.createHash('sha256').update('127.0.0.1').digest('hex'),
      });

      expect(doc.status).toBe('pending');
      expect(doc.category).toBe('general');
      expect(doc.isDeleted).toBe(false);
      expect(doc.rating).toBe(5);
      expect(doc.ipHash).toHaveLength(64);
    });

    it('rejects feedback without required rating or feedbackText', async () => {
      const invalidDoc = new Feedback({
        category: 'event',
      });
      const err = invalidDoc.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors['rating']).toBeDefined();
      expect(err?.errors['feedbackText']).toBeDefined();
    });

    it('rejects invalid rating values outside 1-5 range', async () => {
      const docZero = new Feedback({ rating: 0, feedbackText: 'Too low' });
      const docSix = new Feedback({ rating: 6, feedbackText: 'Too high' });

      expect(docZero.validateSync()?.errors['rating']).toBeDefined();
      expect(docSix.validateSync()?.errors['rating']).toBeDefined();
    });
  });

  /* =========================================================================
     2. PUBLIC FEEDBACK SUBMISSION & PRIVACY HASHING
     ========================================================================= */
  describe('Public Feedback Submission Endpoint', () => {
    it('validates rating must be an integer between 1 and 5', async () => {
      const resZero = await request(app).post('/api/v1/feedback').send({
        rating: 0,
        comment: 'Testing invalid rating',
      });
      expect(resZero.status).toBe(400);
      expect(resZero.body.error).toContain('Rating must be an integer between 1 and 5');

      const resSix = await request(app).post('/api/v1/feedback').send({
        rating: 6,
        comment: 'Testing invalid rating',
      });
      expect(resSix.status).toBe(400);
      expect(resSix.body.error).toContain('Rating must be an integer between 1 and 5');

      const resFloat = await request(app).post('/api/v1/feedback').send({
        rating: 4.5,
        comment: 'Testing float rating',
      });
      expect(resFloat.status).toBe(400);
      expect(resFloat.body.error).toContain('Rating must be an integer between 1 and 5');
    });

    it('validates comment must be between 5 and 1000 characters', async () => {
      const resShort = await request(app).post('/api/v1/feedback').send({
        rating: 5,
        comment: 'Hi',
      });
      expect(resShort.status).toBe(400);
      expect(resShort.body.error).toContain('Feedback comment must be between 5 and 1000 characters');

      const resLong = await request(app).post('/api/v1/feedback').send({
        rating: 5,
        comment: 'A'.repeat(1001),
      });
      expect(resLong.status).toBe(400);
      expect(resLong.body.error).toContain('Feedback comment must be between 5 and 1000 characters');
    });

    it('validates category against allowed values', async () => {
      const resInvalidCategory = await request(app).post('/api/v1/feedback').send({
        rating: 4,
        comment: 'Great hackathon experience',
        category: 'unsupported_category',
      });
      expect(resInvalidCategory.status).toBe(400);
      expect(resInvalidCategory.body.error).toContain('Invalid category');
    });

    it('returns 503 fail-safe on feedback submission when database is disconnected', async () => {
      const res = await request(app).post('/api/v1/feedback').send({
        rating: 5,
        comment: 'Valid comment describing a great hackathon',
        category: 'event',
      });
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database service is currently unavailable');
    });

    it('returns 503 fail-safe on public feedback listing when database is disconnected', async () => {
      const res = await request(app).get('/api/v1/feedback');
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database service is currently unavailable');
    });
  });

  /* =========================================================================
     3. ADMIN FEEDBACK MODERATION & AUTHORIZATION
     ========================================================================= */
  describe('Admin Feedback Moderation Endpoints', () => {
    it('rejects unauthenticated requests to GET /api/v1/admin/feedback with 401', async () => {
      const res = await request(app).get('/api/v1/admin/feedback');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on admin feedback listing', async () => {
      const res = await request(app)
        .get('/api/v1/admin/feedback')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated requests to PATCH /api/v1/admin/feedback/:id/status with 401', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/feedback/${validObjectId}/status`)
        .send({ status: 'reviewed' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on status moderation endpoint', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/feedback/${validObjectId}/status`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`])
        .send({ status: 'reviewed' });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid ObjectId on status moderation with 400', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/feedback/invalid-id/status')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .send({ status: 'reviewed' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid feedback identifier format');
    });

    it('rejects invalid moderation status with 400', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/feedback/${validObjectId}/status`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .send({ status: 'hacked_status' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid moderation status');
    });

    it('rejects unauthenticated requests to DELETE /api/v1/admin/feedback/:id with 401', async () => {
      const res = await request(app).delete(`/api/v1/admin/feedback/${validObjectId}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on feedback soft-delete endpoint', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/feedback/${validObjectId}`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid ObjectId on soft-delete endpoint with 400', async () => {
      const res = await request(app)
        .delete('/api/v1/admin/feedback/invalid-id')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid feedback identifier format');
    });

    it('returns 503 fail-safe on admin feedback listing when database is disconnected', async () => {
      const res = await request(app)
        .get('/api/v1/admin/feedback')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database service is currently unavailable');
    });

    it('returns 503 fail-safe on status update when database is disconnected', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/feedback/${validObjectId}/status`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .send({ status: 'reviewed' });
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database service is currently unavailable');
    });

    it('returns 503 fail-safe on soft-delete when database is disconnected', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/feedback/${validObjectId}`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database service is currently unavailable');
    });
  });
});
