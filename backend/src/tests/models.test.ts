import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import {
  Administrator,
  Event,
  Registration,
  generateRegistrationId,
  EventGallery,
  TeamCategory,
  TeamMember,
  Feedback,
  ClubSettings,
} from '../models';

describe('Mongoose Models Schema & Validation Tests', () => {
  describe('Administrator Model', () => {
    it('validates a correct administrator document', async () => {
      const admin = new Administrator({
        email: 'lead@anveshana-mbu.in',
        passwordHash: '$2a$12$eMockHashedPasswordValueForTesting1234567890',
        role: 'admin',
        isActive: true,
      });

      const err = await admin.validate();
      expect(err).toBeUndefined();
    });

    it('rejects invalid email addresses', async () => {
      const admin = new Administrator({
        email: 'invalid-email-string',
        passwordHash: 'hash',
        role: 'admin',
      });

      await expect(admin.validate()).rejects.toThrow();
    });

    it('rejects invalid role enums', async () => {
      const admin = new Administrator({
        email: 'test@example.com',
        passwordHash: 'hash',
        role: 'unauthorized_role' as any,
      });

      await expect(admin.validate()).rejects.toThrow();
    });
  });

  describe('Event Model', () => {
    const validEventData = {
      title: 'Anveshana Hackathon 2026',
      slug: 'anveshana-hackathon-2026',
      shortDescription: 'A 24-hour national hackathon bridging School of Computing and School of Engineering.',
      fullDescription: '<p>Full rich-text description with rules and schedule.</p>',
      bannerMedia: {
        publicId: 'events/banner_hackathon_2026',
        url: 'https://res.cloudinary.com/anveshana/image/upload/v1/banner.jpg',
      },
      eventDate: new Date('2026-11-20T09:00:00Z'),
      time: '09:00 AM IST',
      venue: 'Auditorium Block A, MBU Campus',
      status: 'upcoming' as const,
      isPublished: true,
      deduplicationRule: 'studentId' as const,
      formVersion: 1,
      formSchema: [
        {
          id: 'field-name-uuid',
          type: 'text' as const,
          label: 'Full Name',
          required: true,
          enabled: true,
          order: 1,
        },
        {
          id: 'field-id-uuid',
          type: 'text' as const,
          label: 'Student ID Number',
          required: true,
          enabled: true,
          order: 2,
        },
      ],
    };

    it('validates a valid event document with dynamic form schema', async () => {
      const event = new Event(validEventData);
      const err = await event.validate();
      expect(err).toBeUndefined();
    });

    it('rejects events missing mandatory fields', async () => {
      const event = new Event({
        title: 'Incomplete Event',
      });

      await expect(event.validate()).rejects.toThrow();
    });

    it('enforces status enum constraints', async () => {
      const event = new Event({
        ...validEventData,
        status: 'invalid_status' as any,
      });

      await expect(event.validate()).rejects.toThrow();
    });

    it('correctly calculates isRegistrationOpen() based on status and dates', () => {
      const event = new Event({
        ...validEventData,
        status: 'open',
        isPublished: true,
        isArchived: false,
        regOpenDate: new Date(Date.now() - 3600000), // 1 hour ago
        regCloseDate: new Date(Date.now() + 3600000), // 1 hour in future
      });

      expect(event.isRegistrationOpen()).toBe(true);

      // When archived, registration is closed
      event.isArchived = true;
      expect(event.isRegistrationOpen()).toBe(false);
      event.isArchived = false;

      // When status is closed
      event.status = 'closed';
      expect(event.isRegistrationOpen()).toBe(false);

      // When registration window has passed
      event.status = 'open';
      event.regCloseDate = new Date(Date.now() - 1000);
      expect(event.isRegistrationOpen()).toBe(false);
    });

    it('evaluates capacity constraints via canAcceptRegistrations()', () => {
      const event = new Event({
        ...validEventData,
        status: 'open',
        isPublished: true,
        maxParticipants: 50,
      });

      // Under capacity
      expect(event.canAcceptRegistrations(49).allowed).toBe(true);

      // At capacity
      const fullCheck = event.canAcceptRegistrations(50);
      expect(fullCheck.allowed).toBe(false);
      expect(fullCheck.reason).toContain('maximum participant capacity');

      // Unlimited capacity
      event.maxParticipants = null as any;
      expect(event.canAcceptRegistrations(1000).allowed).toBe(true);
    });
  });

  describe('Registration Model', () => {
    it('generates properly formatted registration reference numbers', () => {
      const regId = generateRegistrationId();
      expect(regId).toHaveLength(8);
      expect(regId).toMatch(/^[A-Z0-9]{8}$/);
    });

    it('validates a complete registration payload with answers snapshot', async () => {
      const registration = new Registration({
        eventId: new mongoose.Types.ObjectId(),
        formVersion: 1,
        answers: {
          'field-name-uuid': 'John Doe',
          'field-id-uuid': '23MBU0123',
        },
        identifier: '23mbu0123',
        submittedAt: new Date(),
      });

      const err = await registration.validate();
      expect(err).toBeUndefined();
      expect(registration._id).toHaveLength(8);
      expect(registration._id).toMatch(/^[A-Z0-9]{8}$/);
    });

    it('rejects registrations missing required identifiers', async () => {
      const registration = new Registration({
        eventId: new mongoose.Types.ObjectId(),
        formVersion: 1,
      });

      await expect(registration.validate()).rejects.toThrow();
    });
  });

  describe('EventGallery Model', () => {
    it('validates gallery structure with image assets', async () => {
      const gallery = new EventGallery({
        eventId: new mongoose.Types.ObjectId(),
        images: [
          {
            publicId: 'galleries/photo1',
            url: 'https://res.cloudinary.com/anveshana/photo1.jpg',
            caption: 'Opening ceremony',
            displayOrder: 1,
          },
        ],
      });

      const err = await gallery.validate();
      expect(err).toBeUndefined();
    });
  });

  describe('TeamCategory Model', () => {
    it('validates category definition with order', async () => {
      const category = new TeamCategory({
        name: 'Technical',
        slug: 'tech',
        displayOrder: 7,
        isActive: true,
      });

      const err = await category.validate();
      expect(err).toBeUndefined();
    });
  });

  describe('TeamMember Model', () => {
    it('validates member profile linked to category', async () => {
      const member = new TeamMember({
        categoryId: new mongoose.Types.ObjectId(),
        name: 'Eswar M',
        designation: 'Technical Lead',
        biography: 'Full stack developer passionate about open source.',
        displayOrder: 1,
        isPublished: true,
      });

      const err = await member.validate();
      expect(err).toBeUndefined();
    });

    it('rejects member biography exceeding 300 characters', async () => {
      const member = new TeamMember({
        categoryId: new mongoose.Types.ObjectId(),
        name: 'Eswar M',
        designation: 'Lead',
        biography: 'A'.repeat(301),
      });

      await expect(member.validate()).rejects.toThrow();
    });
  });

  describe('Feedback Model', () => {
    it('validates rating within 1 to 5 stars', async () => {
      const feedback = new Feedback({
        rating: 5,
        feedbackText: 'Great hackathon organization!',
        ipHash: 'mock-sha256-hash-value',
      });

      const err = await feedback.validate();
      expect(err).toBeUndefined();
    });

    it('rejects rating outside 1 to 5', async () => {
      const feedback = new Feedback({
        rating: 6,
        ipHash: 'mock-hash',
      });

      await expect(feedback.validate()).rejects.toThrow();
    });
  });

  describe('ClubSettings Model', () => {
    it('initializes default singleton settings with MBU details', async () => {
      const settings = new ClubSettings();
      const err = await settings.validate();
      expect(err).toBeUndefined();
      expect(settings.clubName).toBe('Anveshana Club');
      expect(settings.tagline).toContain('Bring Ideas to Life');
      expect(settings.isSingleton).toBe(true);
    });
  });
});
