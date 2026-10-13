import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Event } from '../models/Event';
import { Registration, generateRegistrationId } from '../models/Registration';
import { validateRegistrationAnswers } from '../utils/formValidator';
import { getDbStatus } from '../config/db';

/**
 * Resolves an event by slug or MongoDB ObjectId.
 */
const findEventByIdentifier = async (identifier: string) => {
  const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
  const query: any = { isDeleted: false };

  if (isObjectId) {
    query.$or = [{ _id: identifier }, { slug: identifier.toLowerCase().trim() }];
  } else {
    query.slug = identifier.toLowerCase().trim();
  }

  return Event.findOne(query);
};

/**
 * Public: Fetch active registration form schema for an event.
 * GET /api/v1/events/:identifier/form
 */
export const getEventFormSchema = async (req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Database service is currently unavailable. Please try again later.',
    });
    return;
  }

  try {
    const { identifier } = req.params;
    const identifierStr = Array.isArray(identifier) ? identifier[0] : identifier;

    if (!identifierStr) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Event identifier is required',
      });
      return;
    }

    const event = await findEventByIdentifier(identifierStr);

    if (!event || !event.isPublished || event.status === 'draft') {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found or registration form is not publicly available',
      });
      return;
    }

    const isRegistrationOpen = event.isRegistrationOpen();
    const computedStatus = event.getComputedStatus();

    // Privacy safeguard: do not return formHistory, registrations, or internal metadata
    res.status(200).json({
      success: true,
      data: {
        eventId: event._id,
        eventSlug: event.slug,
        eventTitle: event.title,
        formVersion: event.formVersion || 1,
        formSchema: event.formSchema || [],
        isRegistrationOpen,
        computedStatus,
        maxParticipants: event.maxParticipants,
        registeredCount: event.registeredCount,
        deduplicationRule: event.deduplicationRule,
        regOpenDate: event.regOpenDate,
        regCloseDate: event.regCloseDate,
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve event registration form',
    });
  }
};

/**
 * Public: Submit native registration for an event.
 * POST /api/v1/events/:identifier/register
 */
export const submitRegistration = async (req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Database service is currently unavailable. Please try again later.',
    });
    return;
  }

  try {
    const { identifier } = req.params;
    const identifierStr = Array.isArray(identifier) ? identifier[0] : identifier;
    const { answers } = req.body;

    if (!identifierStr) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Event identifier is required',
      });
      return;
    }

    const event = await findEventByIdentifier(identifierStr);

    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found',
      });
      return;
    }

    // 1. Validate Event State & Publication
    if (!event.isPublished || event.status === 'draft') {
      res.status(400).json({
        success: false,
        data: null,
        error: 'This event is not published and cannot accept registrations.',
      });
      return;
    }

    if (event.isArchived || event.status === 'archived') {
      res.status(400).json({
        success: false,
        data: null,
        error: 'This event is archived and is no longer accepting registrations.',
      });
      return;
    }

    if (event.status === 'completed') {
      res.status(400).json({
        success: false,
        data: null,
        error: 'This event has concluded.',
      });
      return;
    }

    // 2. Validate Registration Schedule
    const now = new Date();
    if (event.regOpenDate && now < event.regOpenDate) {
      res.status(400).json({
        success: false,
        data: null,
        error: `Registration has not opened yet. Registration opens on ${event.regOpenDate.toLocaleDateString()}.`,
      });
      return;
    }

    if (event.regCloseDate && now > event.regCloseDate) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Registration is closed for this event.',
      });
      return;
    }

    if (event.registrationDeadline && now > event.registrationDeadline) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'The registration deadline has passed for this event.',
      });
      return;
    }

    if (event.status === 'closed') {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Registration is currently closed for this event.',
      });
      return;
    }

    // 3. Validate Form Configuration
    if (!event.formSchema || event.formSchema.length === 0) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Registration form is not configured for this event.',
      });
      return;
    }

    // 4. Validate Submitted Answers Against Active Form Schema
    const validationResult = validateRegistrationAnswers(event.formSchema, answers);
    if (!validationResult.isValid || !validationResult.sanitizedAnswers) {
      res.status(400).json({
        success: false,
        data: null,
        error: validationResult.error || 'Invalid form submission.',
      });
      return;
    }

    // 5. Deduplication Identifier Resolution & Normalization
    const explicitStudentId = req.body.studentId ? String(req.body.studentId).trim().toUpperCase() : undefined;
    const explicitEmail = req.body.email ? String(req.body.email).trim().toLowerCase() : undefined;

    const studentId = validationResult.studentId || explicitStudentId;
    const email = validationResult.email || explicitEmail;

    let deduplicationKey = '';
    if (event.deduplicationRule === 'studentId') {
      deduplicationKey = studentId || email || '';
    } else {
      deduplicationKey = email || studentId || '';
    }

    if (!deduplicationKey) {
      // Fallback: build composite key from answers if neither studentId nor email is auto-detected
      const answersStr = JSON.stringify(validationResult.sanitizedAnswers);
      deduplicationKey = Buffer.from(answersStr).toString('base64').slice(0, 32);
    }

    const normalizedIdentifier = deduplicationKey.toLowerCase();

    // 6. Pre-validation for Duplicate Registrations
    const duplicateQuery: any[] = [{ eventId: event._id, identifier: normalizedIdentifier }];
    if (studentId) {
      duplicateQuery.push({ eventId: event._id, studentId });
    }
    if (email) {
      duplicateQuery.push({ eventId: event._id, email });
    }

    const existingReg = await Registration.findOne({ $or: duplicateQuery });
    if (existingReg) {
      res.status(409).json({
        success: false,
        data: null,
        error: 'A registration with this Student ID or Email already exists for this event.',
      });
      return;
    }

    // 7. Atomic Capacity Check & Reservation
    let updatedEvent = null;
    const hasCapacityLimit =
      event.maxParticipants !== null &&
      event.maxParticipants !== undefined &&
      event.maxParticipants > 0;

    if (hasCapacityLimit) {
      updatedEvent = await Event.findOneAndUpdate(
        {
          _id: event._id,
          isPublished: true,
          isDeleted: false,
          isArchived: false,
          status: { $nin: ['draft', 'archived', 'closed', 'completed'] },
          registeredCount: { $lt: event.maxParticipants! },
        },
        { $inc: { registeredCount: 1 } },
        { new: true }
      );

      if (!updatedEvent) {
        res.status(409).json({
          success: false,
          data: null,
          error: 'This event has reached maximum capacity and can no longer accept registrations.',
        });
        return;
      }
    } else {
      updatedEvent = await Event.findOneAndUpdate(
        {
          _id: event._id,
          isPublished: true,
          isDeleted: false,
          isArchived: false,
          status: { $nin: ['draft', 'archived', 'closed', 'completed'] },
        },
        { $inc: { registeredCount: 1 } },
        { new: true }
      );

      if (!updatedEvent) {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Registration is not currently open for this event.',
        });
        return;
      }
    }

    // 8. Generate Unique 8-Character Confirmation Reference & Persist Registration
    const referenceNumber = generateRegistrationId();

    try {
      const registration = await Registration.create({
        _id: referenceNumber,
        referenceNumber,
        eventId: event._id,
        formVersion: event.formVersion || 1,
        answers: validationResult.sanitizedAnswers,
        identifier: normalizedIdentifier,
        studentId: studentId ? studentId.toUpperCase().trim() : undefined,
        email: email ? email.toLowerCase().trim() : undefined,
        submittedAt: new Date(),
      });

      // Strict privacy: only return reference number, eventId, eventTitle, submittedAt
      res.status(201).json({
        success: true,
        data: {
          referenceNumber: registration.referenceNumber,
          eventId: event._id,
          eventTitle: event.title,
          formVersion: registration.formVersion,
          submittedAt: registration.submittedAt,
        },
        error: null,
        message: 'Registration confirmed successfully',
      });
    } catch (saveError: any) {
      // Safe rollback of reserved seat capacity on failure (guarantee count never negative)
      await Event.updateOne(
        { _id: event._id, registeredCount: { $gt: 0 } },
        { $inc: { registeredCount: -1 } }
      );

      // Duplicate key error handler (concurrent duplicate submission)
      if (saveError && saveError.code === 11000) {
        res.status(409).json({
          success: false,
          data: null,
          error: 'A registration with this Student ID or Email already exists for this event.',
        });
        return;
      }

      res.status(500).json({
        success: false,
        data: null,
        error: 'An unexpected error occurred while saving your registration. Please try again.',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'An error occurred while processing registration',
    });
  }
};
