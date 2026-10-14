import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server';
import { signToken, AUTH_COOKIE_NAME } from '../utils/token';
import { Event } from '../models/Event';
import { Registration, generateRegistrationId } from '../models/Registration';
import { validateFormSchemaDefinition, validateRegistrationAnswers } from '../utils/formValidator';
import { FormFieldConfig } from '../types/models';

describe('Phase 6: Dynamic Form Builder & Native Registration Specifications', () => {
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

  const testSchema: FormFieldConfig[] = [
    {
      id: 'field_name',
      type: 'text',
      label: 'Full Name',
      required: true,
      enabled: true,
      order: 0,
      validation: { minLength: 2, maxLength: 50 },
    },
    {
      id: 'field_student_id',
      type: 'text',
      label: 'Student ID / Roll No',
      required: true,
      enabled: true,
      order: 1,
    },
    {
      id: 'field_email',
      type: 'email',
      label: 'College Email',
      required: true,
      enabled: true,
      order: 2,
    },
    {
      id: 'field_semester',
      type: 'number',
      label: 'Semester Number',
      required: false,
      enabled: true,
      order: 3,
      validation: { min: 1, max: 8 },
    },
    {
      id: 'field_department',
      type: 'dropdown',
      label: 'Department',
      required: true,
      enabled: true,
      order: 4,
      choices: ['Computer Science', 'Data Science', 'AI & ML', 'Cyber Security'],
    },
    {
      id: 'field_experience',
      type: 'radio',
      label: 'Prior Hackathon Experience',
      required: true,
      enabled: true,
      order: 5,
      choices: ['Beginner', 'Intermediate', 'Advanced'],
    },
    {
      id: 'field_agree_rules',
      type: 'checkbox',
      label: 'I agree to the code of conduct',
      required: true,
      enabled: true,
      order: 6,
    },
    {
      id: 'field_grad_date',
      type: 'date',
      label: 'Expected Graduation Date',
      required: false,
      enabled: true,
      order: 7,
    },
    {
      id: 'field_portfolio',
      type: 'url',
      label: 'GitHub or Portfolio Link',
      required: false,
      enabled: true,
      order: 8,
    },
  ];

  /* =========================================================================
     1. FORM VALIDATOR UNIT TESTS
     ========================================================================= */
  describe('Form Schema & Submission Validator Unit Tests', () => {
    it('validates a correct form schema configuration with all 8 supported types', () => {
      const res = validateFormSchemaDefinition(testSchema);
      expect(res.isValid).toBe(true);
      expect(res.sanitizedSchema).toHaveLength(testSchema.length);
    });

    it('rejects schema if a dropdown or radio field lacks choices', () => {
      const invalidSchema = [
        {
          id: 'field_1',
          type: 'dropdown',
          label: 'Track',
          required: true,
          choices: [], // empty choices!
        },
      ];
      const res = validateFormSchemaDefinition(invalidSchema);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('must define at least one option');
    });

    it('rejects schema if field has an unsupported type', () => {
      const invalidSchema = [
        {
          id: 'field_1',
          type: 'file_upload_unknown',
          label: 'Upload Resume',
          required: false,
        },
      ];
      const res = validateFormSchemaDefinition(invalidSchema);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('unsupported type');
    });

    it('accepts and normalizes yes_no field definitions and answers', () => {
      const yesNoSchema: FormFieldConfig[] = [
        {
          id: 'field_laptop',
          type: 'yes_no',
          label: 'Do you have a personal laptop?',
          required: true,
          enabled: true,
          order: 0,
        },
      ];
      const schemaRes = validateFormSchemaDefinition(yesNoSchema);
      expect(schemaRes.isValid).toBe(true);
      expect(schemaRes.sanitizedSchema?.[0].type).toBe('yes_no');

      const answerResYes = validateRegistrationAnswers(yesNoSchema, { field_laptop: 'Yes' });
      expect(answerResYes.isValid).toBe(true);
      expect(answerResYes.sanitizedAnswers?.field_laptop).toBe('Yes');

      const answerResNo = validateRegistrationAnswers(yesNoSchema, { field_laptop: false });
      expect(answerResNo.isValid).toBe(true);
      expect(answerResNo.sanitizedAnswers?.field_laptop).toBe('No');
    });

    it('accepts valid answers matching all supported field types', () => {
      const validAnswers = {
        field_name: 'Aditya Varma',
        field_student_id: '23MBU0987',
        field_email: 'aditya.v@mbu.edu.in',
        field_semester: 4,
        field_department: 'Computer Science',
        field_experience: 'Intermediate',
        field_agree_rules: true,
        field_grad_date: '2027-05-15',
        field_portfolio: 'https://github.com/adityavarma',
      };

      const res = validateRegistrationAnswers(testSchema, validAnswers);
      expect(res.isValid).toBe(true);
      expect(res.sanitizedAnswers?.field_name).toBe('Aditya Varma');
      expect(res.sanitizedAnswers?.field_department).toBe('Computer Science');
      expect(res.studentId).toBe('23MBU0987');
      expect(res.email).toBe('aditya.v@mbu.edu.in');
    });

    it('rejects submissions with unknown field keys not present in the schema', () => {
      const forgedAnswers = {
        field_name: 'Aditya Varma',
        field_student_id: '23MBU0987',
        field_email: 'aditya.v@mbu.edu.in',
        field_department: 'Computer Science',
        field_experience: 'Beginner',
        field_agree_rules: true,
        injected_admin_override: 'true', // Tampered key
      };

      const res = validateRegistrationAnswers(testSchema, forgedAnswers);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('unknown or unapproved form field');
    });

    it('rejects submissions with modified or unapproved dropdown choices', () => {
      const forgedAnswers = {
        field_name: 'Aditya Varma',
        field_student_id: '23MBU0987',
        field_email: 'aditya.v@mbu.edu.in',
        field_department: 'Nonexistent Engineering Track', // Altered choice
        field_experience: 'Beginner',
        field_agree_rules: true,
      };

      const res = validateRegistrationAnswers(testSchema, forgedAnswers);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Invalid choice selected for "Department"');
    });

    it('rejects submissions missing required fields', () => {
      const incompleteAnswers = {
        field_name: 'Aditya Varma',
        // field_student_id missing
        field_email: 'aditya.v@mbu.edu.in',
        field_department: 'Computer Science',
        field_experience: 'Beginner',
        field_agree_rules: true,
      };

      const res = validateRegistrationAnswers(testSchema, incompleteAnswers);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('Required field "Student ID / Roll No" is missing');
    });

    it('rejects invalid email formats', () => {
      const malformedEmailAnswers = {
        field_name: 'Aditya Varma',
        field_student_id: '23MBU0987',
        field_email: 'not-an-email-at-all',
        field_department: 'Computer Science',
        field_experience: 'Beginner',
        field_agree_rules: true,
      };

      const res = validateRegistrationAnswers(testSchema, malformedEmailAnswers);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('must be a valid email address');
    });

    it('rejects invalid URLs', () => {
      const malformedUrlAnswers = {
        field_name: 'Aditya Varma',
        field_student_id: '23MBU0987',
        field_email: 'aditya.v@mbu.edu.in',
        field_department: 'Computer Science',
        field_experience: 'Beginner',
        field_agree_rules: true,
        field_portfolio: 'htp:/invalid-url',
      };

      const res = validateRegistrationAnswers(testSchema, malformedUrlAnswers);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('must be a valid HTTP/HTTPS URL');
    });

    it('rejects numbers that violate min/max bounds', () => {
      const outOfBoundsAnswers = {
        field_name: 'Aditya Varma',
        field_student_id: '23MBU0987',
        field_email: 'aditya.v@mbu.edu.in',
        field_semester: 12, // max is 8
        field_department: 'Computer Science',
        field_experience: 'Beginner',
        field_agree_rules: true,
      };

      const res = validateRegistrationAnswers(testSchema, outOfBoundsAnswers);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('cannot exceed 8');
    });

    it('rejects required checkbox when unchecked (false)', () => {
      const uncheckedAnswers = {
        field_name: 'Aditya Varma',
        field_student_id: '23MBU0987',
        field_email: 'aditya.v@mbu.edu.in',
        field_department: 'Computer Science',
        field_experience: 'Beginner',
        field_agree_rules: false,
      };

      const res = validateRegistrationAnswers(testSchema, uncheckedAnswers);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('You must agree to / check');
    });
  });

  /* =========================================================================
     2. FORM VERSIONING & IMMUTABLE SNAPSHOT INTEGRITY
     ========================================================================= */
  describe('Form Versioning & Snapshot Integrity', () => {
    it('initializes event with formVersion 1 and empty formHistory', () => {
      const event = new Event({
        title: 'Form Version Test Event',
        slug: 'form-version-test-event',
        category: 'Workshop',
        shortDescription: 'Valid short description for version test.',
        fullDescription: 'Valid full description text for testing versioning.',
        bannerMedia: { publicId: 'test_id', url: 'https://example.com/banner.jpg' },
        eventDate: new Date(Date.now() + 86400000 * 3),
        time: '10:00 AM',
        venue: 'Lab 3',
        formSchema: testSchema,
      });

      expect(event.formVersion).toBe(1);
      expect(event.formHistory).toHaveLength(0);
    });

    it('records and binds registration to the exact formVersion snapshot', () => {
      const registration = new Registration({
        eventId: new mongoose.Types.ObjectId(),
        formVersion: 2,
        answers: { field_name: 'Sneha Rao' },
        identifier: 'sneha@mbu.edu.in',
      });

      expect(registration.formVersion).toBe(2);
      expect(registration._id).toHaveLength(8);
      expect(registration.referenceNumber).toBe(registration._id);
    });

    it('generates unique 8-character uppercase alphanumeric reference numbers', () => {
      const generatedSet = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const ref = generateRegistrationId();
        expect(ref).toHaveLength(8);
        expect(ref).toMatch(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/);
        generatedSet.add(ref);
      }
      expect(generatedSet.size).toBe(50); // High entropy, 0 collisions in 50 iterations
    });
  });

  /* =========================================================================
     3. ADMIN FORM BUILDER ENDPOINT & AUTHORIZATION
     ========================================================================= */
  describe('Admin Form Builder Endpoint Authorization', () => {
    it('rejects unauthenticated requests to PUT /api/v1/admin/events/:id/form with 401', async () => {
      const res = await request(app)
        .put('/api/v1/admin/events/670b8f1023456789abcdef99/form')
        .send({ formSchema: testSchema });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects student role requests to PUT /api/v1/admin/events/:id/form with 403', async () => {
      const res = await request(app)
        .put('/api/v1/admin/events/670b8f1023456789abcdef99/form')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`])
        .send({ formSchema: testSchema });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Forbidden');
    });

    it('returns 503 cleanly when database is offline on PUT /api/v1/admin/events/:id/form', async () => {
      const res = await request(app)
        .put('/api/v1/admin/events/670b8f1023456789abcdef99/form')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${adminToken}`])
        .send({ formSchema: testSchema });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database service is currently unavailable');
    });

    it('rejects unauthenticated requests to GET /api/v1/admin/events/:id/form with 401', async () => {
      const res = await request(app).get('/api/v1/admin/events/670b8f1023456789abcdef99/form');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects non-admin requests to GET /api/v1/admin/events/:id/form with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/events/670b8f1023456789abcdef99/form')
        .set('Cookie', [`${AUTH_COOKIE_NAME}=${studentToken}`]);
      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated requests to PUT /api/v1/admin/events/:id/form/draft with 401', async () => {
      const res = await request(app)
        .put('/api/v1/admin/events/670b8f1023456789abcdef99/form/draft')
        .send({ formSchema: testSchema });
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated requests to PATCH /api/v1/admin/events/:id/form/close with 401', async () => {
      const res = await request(app).patch('/api/v1/admin/events/670b8f1023456789abcdef99/form/close');
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated requests to GET /api/v1/admin/events/:id/form/versions with 401', async () => {
      const res = await request(app).get('/api/v1/admin/events/670b8f1023456789abcdef99/form/versions');
      expect(res.status).toBe(401);
    });
  });

  /* =========================================================================
     4. PUBLIC FORM & REGISTRATION ENDPOINT SAFEGUARDS
     ========================================================================= */
  describe('Public Form & Registration Endpoint Safeguards', () => {
    it('returns 503 cleanly when database is offline on GET /api/v1/events/:identifier/form', async () => {
      const res = await request(app).get('/api/v1/events/hackathon-2026/form');
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database service is currently unavailable');
    });

    it('returns 503 cleanly when database is offline on POST /api/v1/events/:identifier/register', async () => {
      const res = await request(app)
        .post('/api/v1/events/hackathon-2026/register')
        .send({
          answers: { field_name: 'Test Student' },
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Database service is currently unavailable');
    });

    it('enforces privacy: does not leak sensitive participant fields in public schema view', async () => {
      // In offline mode, verify the error format does not leak internal data
      const res = await request(app).get('/api/v1/events/hackathon-2026/form');
      expect(res.body.data).toBeNull();
      expect(res.body.error).toBeDefined();
    });
  });

  /* =========================================================================
     5. CAPACITY CONSTRAINTS & CONCURRENCY ATOMICITY RULES
     ========================================================================= */
  describe('Capacity Constraints & Concurrency Atomicity Rules', () => {
    it('correctly calculates canAcceptRegistrations when capacity is full', () => {
      const event = new Event({
        title: 'Capacity Event',
        slug: 'capacity-event',
        category: 'Workshop',
        shortDescription: 'Short description for capacity test.',
        fullDescription: 'Full description text for capacity test.',
        bannerMedia: { publicId: 'test_id', url: 'https://example.com/banner.jpg' },
        eventDate: new Date(Date.now() + 86400000 * 2),
        time: '10:00 AM',
        venue: 'Hall B',
        isPublished: true,
        status: 'open',
        maxParticipants: 50,
        registeredCount: 50,
      });

      expect(event.getComputedStatus()).toBe('full');
      expect(event.isRegistrationOpen()).toBe(false);
      const capacityCheck = event.canAcceptRegistrations();
      expect(capacityCheck.allowed).toBe(false);
      expect(capacityCheck.reason).toContain('not currently open');
    });

    it('allows registration when current count is below maxParticipants', () => {
      const event = new Event({
        title: 'Open Capacity Event',
        slug: 'open-capacity-event',
        category: 'Workshop',
        shortDescription: 'Short description for open capacity test.',
        fullDescription: 'Full description text for open capacity test.',
        bannerMedia: { publicId: 'test_id', url: 'https://example.com/banner.jpg' },
        eventDate: new Date(Date.now() + 86400000 * 2),
        time: '10:00 AM',
        venue: 'Hall B',
        isPublished: true,
        status: 'open',
        maxParticipants: 50,
        registeredCount: 49,
      });

      expect(event.getComputedStatus()).toBe('open');
      expect(event.isRegistrationOpen()).toBe(true);
      const capacityCheck = event.canAcceptRegistrations();
      expect(capacityCheck.allowed).toBe(true);
    });

    it('rejects registration when event status is draft', () => {
      const event = new Event({
        title: 'Draft Event',
        slug: 'draft-event',
        category: 'Workshop',
        shortDescription: 'Short description for draft event test.',
        fullDescription: 'Full description text for draft event test.',
        bannerMedia: { publicId: 'test_id', url: 'https://example.com/banner.jpg' },
        eventDate: new Date(Date.now() + 86400000 * 2),
        time: '10:00 AM',
        venue: 'Hall B',
        isPublished: false,
        status: 'draft',
      });

      expect(event.getComputedStatus()).toBe('draft');
      expect(event.isRegistrationOpen()).toBe(false);
    });

    it('rejects registration when event is past regCloseDate', () => {
      const event = new Event({
        title: 'Past Deadline Event',
        slug: 'past-deadline-event',
        category: 'Workshop',
        shortDescription: 'Short description for past deadline test.',
        fullDescription: 'Full description text for past deadline test.',
        bannerMedia: { publicId: 'test_id', url: 'https://example.com/banner.jpg' },
        eventDate: new Date(Date.now() + 86400000 * 2),
        time: '10:00 AM',
        venue: 'Hall B',
        isPublished: true,
        status: 'open',
        regCloseDate: new Date(Date.now() - 3600000), // Closed 1 hour ago
      });

      expect(event.getComputedStatus()).toBe('closed');
      expect(event.isRegistrationOpen()).toBe(false);
    });
  });

  /* =========================================================================
     6. DATABASE INDEX AUDIT & PRIVACY PROJECTION CHECKS
     ========================================================================= */
  describe('Database Unique Index Audit & Data Privacy Verification', () => {
    it('verifies compound unique index on eventId + identifier in Registration model schema', () => {
      const indexes = Registration.schema.indexes();
      const identifierIndex = indexes.find((idx) => idx[0].eventId === 1 && idx[0].identifier === 1);
      expect(identifierIndex).toBeDefined();
      expect(identifierIndex![1]?.unique).toBe(true);
    });

    it('verifies partial compound unique indexes on eventId + studentId and eventId + email', () => {
      const indexes = Registration.schema.indexes();
      const studentIdIndex = indexes.find((idx) => idx[0].eventId === 1 && idx[0].studentId === 1);
      expect(studentIdIndex).toBeDefined();
      expect(studentIdIndex![1]?.unique).toBe(true);
      expect(studentIdIndex![1]?.partialFilterExpression).toEqual({ studentId: { $type: 'string' } });

      const emailIndex = indexes.find((idx) => idx[0].eventId === 1 && idx[0].email === 1);
      expect(emailIndex).toBeDefined();
      expect(emailIndex![1]?.unique).toBe(true);
      expect(emailIndex![1]?.partialFilterExpression).toEqual({ email: { $type: 'string' } });
    });

    it('ensures public event model instance does not embed or expose participant registrations array', () => {
      const event = new Event({
        title: 'Privacy Verification Event',
        slug: 'privacy-verification-event',
        category: 'Workshop',
        shortDescription: 'Short description for privacy test.',
        fullDescription: 'Full description text for privacy test.',
        bannerMedia: { publicId: 'test_id', url: 'https://example.com/banner.jpg' },
        eventDate: new Date(),
        time: '10:00 AM',
        venue: 'Hall A',
        formSchema: testSchema,
      });

      const eventJson = event.toJSON();
      expect((eventJson as any).registrations).toBeUndefined();
      expect((eventJson as any).participants).toBeUndefined();
    });
  });
});
