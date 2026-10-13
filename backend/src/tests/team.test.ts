import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';
import { signToken, AUTH_COOKIE_NAME } from '../utils/token';
import { TeamCategory } from '../models/TeamCategory';
import { TeamMember } from '../models/TeamMember';
import { REQUIRED_TEAM_CATEGORIES } from '../scripts/seedCategories';
import mongoose from 'mongoose';

describe('Phase 8: Team Management & 7 Predefined Wings Specifications', () => {
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
     1. PREDEFINED 7 CATEGORIES INVARIANCE SPECIFICATION
     ========================================================================= */
  describe('7 Predefined Categories Specification', () => {
    it('defines exactly the 7 mandated university wings', () => {
      expect(REQUIRED_TEAM_CATEGORIES).toHaveLength(7);

      const categoryNames = REQUIRED_TEAM_CATEGORIES.map((c) => c.name);
      expect(categoryNames).toContain('Team Leads');
      expect(categoryNames).toContain('Infrastructure');
      expect(categoryNames).toContain('Design');
      expect(categoryNames).toContain('Data Management');
      expect(categoryNames).toContain('Social Media');
      expect(categoryNames).toContain('Public Relations');
      expect(categoryNames).toContain('Technical');
    });

    it('assigns unique displayOrders from 1 to 7 to all categories', () => {
      const orders = REQUIRED_TEAM_CATEGORIES.map((c) => c.displayOrder);
      const uniqueOrders = new Set(orders);
      expect(uniqueOrders.size).toBe(7);
      expect(Math.min(...orders)).toBe(1);
      expect(Math.max(...orders)).toBe(7);
    });

    it('assigns unique slugs to all 7 categories', () => {
      const slugs = REQUIRED_TEAM_CATEGORIES.map((c) => c.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(7);
    });
  });

  /* =========================================================================
     2. TEAM MEMBER & CATEGORY MONGOOSE MODEL SPECIFICATIONS
     ========================================================================= */
  describe('Team Mongoose Models Definition', () => {
    it('instantiates valid TeamMember with default isPublished true and isDeleted false', () => {
      const member = new TeamMember({
        categoryId: new mongoose.Types.ObjectId(),
        name: 'Aarav Patel',
        designation: 'Vice President',
        biography: 'Engineering lead specializing in autonomous systems.',
        displayOrder: 2,
      });

      const err = member.validateSync();
      expect(err).toBeUndefined();
      expect(member.isPublished).toBe(true);
      expect(member.isDeleted).toBe(false);
      expect(member.displayOrder).toBe(2);
    });

    it('rejects TeamMember without required name or designation or categoryId', () => {
      const invalidMember = new TeamMember({
        biography: 'Missing required credentials',
      });
      const err = invalidMember.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors['name']).toBeDefined();
      expect(err?.errors['designation']).toBeDefined();
      expect(err?.errors['categoryId']).toBeDefined();
    });

    it('instantiates valid TeamCategory document', () => {
      const category = new TeamCategory({
        name: 'Technical',
        slug: 'technical',
        description: 'Web development and hackathon systems.',
        displayOrder: 7,
      });

      const err = category.validateSync();
      expect(err).toBeUndefined();
      expect(category.isActive).toBe(true);
    });

    it('rejects TeamCategory without required name or slug', () => {
      const invalidCategory = new TeamCategory({
        displayOrder: 1,
      });
      const err = invalidCategory.validateSync();
      expect(err).toBeDefined();
      expect(err?.errors['name']).toBeDefined();
      expect(err?.errors['slug']).toBeDefined();
    });
  });

  /* =========================================================================
     3. PUBLIC TEAM DIRECTORY ENDPOINT
     ========================================================================= */
  describe('Public Team Directory Endpoint', () => {
    it('returns 503 fail-safe on public team listing when database is disconnected', async () => {
      const res = await request(app).get('/api/v1/team');
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database service is currently unavailable');
    });
  });

  /* =========================================================================
     4. ADMIN TEAM ENDPOINTS AUTHORIZATION & ACCESS CONTROL
     ========================================================================= */
  describe('Admin Team Endpoints Authorization', () => {
    it('rejects unauthenticated requests to GET /api/v1/admin/team/categories with 401', async () => {
      const res = await request(app).get('/api/v1/admin/team/categories');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on GET /api/v1/admin/team/categories', async () => {
      const res = await request(app)
        .get('/api/v1/admin/team/categories')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated requests to GET /api/v1/admin/team/members with 401', async () => {
      const res = await request(app).get('/api/v1/admin/team/members');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on GET /api/v1/admin/team/members', async () => {
      const res = await request(app)
        .get('/api/v1/admin/team/members')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated requests to POST /api/v1/admin/team/members with 401', async () => {
      const res = await request(app).post('/api/v1/admin/team/members');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on POST /api/v1/admin/team/members', async () => {
      const res = await request(app)
        .post('/api/v1/admin/team/members')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated requests to PUT /api/v1/admin/team/members/:id with 401', async () => {
      const res = await request(app).put(`/api/v1/admin/team/members/${validObjectId}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on PUT /api/v1/admin/team/members/:id', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/team/members/${validObjectId}`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated requests to PATCH /api/v1/admin/team/members/:id/publish with 401', async () => {
      const res = await request(app).patch(`/api/v1/admin/team/members/${validObjectId}/publish`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on PATCH /api/v1/admin/team/members/:id/publish', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/team/members/${validObjectId}/publish`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated requests to DELETE /api/v1/admin/team/members/:id with 401', async () => {
      const res = await request(app).delete(`/api/v1/admin/team/members/${validObjectId}`);
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role with 403 on DELETE /api/v1/admin/team/members/:id', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/team/members/${validObjectId}`)
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  /* =========================================================================
     5. INPUT VALIDATION & PROFILE PHOTO CONSTRAINTS
     ========================================================================= */
  describe('Admin Team Input Validation & Constraints', () => {
    it('returns 400 when invalid member ID format is provided', async () => {
      const res = await request(app)
        .put('/api/v1/admin/team/members/invalid-member-id')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`]);
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid team member identifier format');
    });

    it('validates required fields (name, designation, categoryId) when creating a team member', async () => {
      const res = await request(app)
        .post('/api/v1/admin/team/members')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .field('name', 'John Doe');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Member designation / role title is required');
    });

    it('validates categoryId format when creating a team member', async () => {
      const res = await request(app)
        .post('/api/v1/admin/team/members')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .field('name', 'John Doe')
        .field('designation', 'Lead Developer')
        .field('categoryId', 'not-a-valid-category-object-id');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Valid team category reference is required');
    });

    it('rejects non-image file uploads for team member photo', async () => {
      const dummyPdfBuffer = Buffer.from('%PDF-1.4 dummy pdf document content');
      const res = await request(app)
        .post('/api/v1/admin/team/members')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .field('name', 'John Doe')
        .field('designation', 'Lead Developer')
        .field('categoryId', validObjectId)
        .attach('profileImage', dummyPdfBuffer, {
          filename: 'resume.pdf',
          contentType: 'application/pdf',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Only JPEG, PNG, and WebP images are allowed');
    });
  });
});
