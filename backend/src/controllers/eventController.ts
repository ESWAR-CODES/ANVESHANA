import { Request, Response } from 'express';
import { z } from 'zod';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { slugify } from '../utils/slugify';
import { uploadImageBuffer, deleteCloudinaryImage, isCloudinaryConfigured } from '../config/cloudinary';
import { getDbStatus } from '../config/db';
import { validateFormSchemaDefinition } from '../utils/formValidator';

const eventInputSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
  category: z.string().optional().default('Workshop'),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters').max(200, 'Short description cannot exceed 200 characters'),
  fullDescription: z.string().min(10, 'Full description must be at least 10 characters'),
  eventDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid event date' }),
  time: z.string().min(2, 'Event time is required'),
  venue: z.string().min(2, 'Venue is required'),
  eligibility: z.string().optional().nullable(),
  registrationDeadline: z.string().optional().nullable(),
  registrationUrl: z.string().optional().nullable(),
  status: z.enum(['draft', 'published', 'upcoming', 'open', 'closed', 'completed', 'archived']).optional(),
  isPublished: z.union([z.boolean(), z.string().transform((v) => v === 'true')]).optional(),
  maxParticipants: z.union([z.number(), z.string().transform((v) => (v ? parseInt(v, 10) : null))]).optional().nullable(),
  regOpenDate: z.string().optional().nullable(),
  regCloseDate: z.string().optional().nullable(),
  deduplicationRule: z.enum(['studentId', 'email']).optional().default('studentId'),
});

/**
 * Generates an immutable, collision-free slug from a title.
 */
const generateUniqueSlug = async (title: string, excludeId?: string): Promise<string> => {
  const baseSlug = slugify(title) || 'event';
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const query: any = { slug: candidate };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const exists = await Event.findOne(query);
    if (!exists) {
      return candidate;
    }
    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }
};

/* =========================================================================
   PUBLIC EVENT HANDLERS
   ========================================================================= */

/**
 * Public: List published events with filtering, search, and pagination.
 * GET /api/v1/events
 */
export const getPublicEvents = async (req: Request, res: Response): Promise<void> => {
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
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 9));
    const skip = (page - 1) * limit;

    const { status, category, search, month, year } = req.query;

    const filter: any = {
      isPublished: true,
      isArchived: false,
      isDeleted: false,
    };

    if (category && typeof category === 'string' && category.trim()) {
      filter.category = { $regex: category.trim(), $options: 'i' };
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { shortDescription: { $regex: q, $options: 'i' } },
        { venue: { $regex: q, $options: 'i' } },
      ];
    }

    const now = new Date();
    if (status === 'upcoming') {
      filter.eventDate = { $gte: now };
    } else if (status === 'completed' || status === 'past') {
      filter.eventDate = { $lt: now };
    }

    if (month || year) {
      const y = year ? parseInt(year as string, 10) : now.getFullYear();
      if (month) {
        const m = parseInt(month as string, 10) - 1;
        const startDate = new Date(y, m, 1);
        const endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);
        filter.eventDate = { ...filter.eventDate, $gte: startDate, $lte: endDate };
      } else if (year) {
        const startDate = new Date(y, 0, 1);
        const endDate = new Date(y, 11, 31, 23, 59, 59, 999);
        filter.eventDate = { ...filter.eventDate, $gte: startDate, $lte: endDate };
      }
    }

    const sortOrder = status === 'completed' || status === 'past' ? { eventDate: -1 as const } : { eventDate: 1 as const };

    const [events, total] = await Promise.all([
      Event.find(filter)
        .select('-formSchema -formHistory') // Optimize payload and protect schema history
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    // Attach computed display state to each event
    const transformed = events.map((event) => {
      const doc = new Event(event);
      const cleanEvent = { ...event };
      delete (cleanEvent as any).formHistory;
      return {
        ...cleanEvent,
        computedStatus: doc.getComputedStatus(),
        isRegistrationOpen: doc.isRegistrationOpen(),
      };
    });

    res.status(200).json({
      success: true,
      data: transformed,
      error: null,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'An error occurred while fetching events',
    });
  }
};

/**
 * Public: Retrieve detailed event view by unique slug.
 * GET /api/v1/events/:slug
 */
export const getPublicEventBySlug = async (req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Database service is currently unavailable.',
    });
    return;
  }

  try {
    const { slug } = req.params;
    const slugStr = Array.isArray(slug) ? slug[0] : slug;
    const event = await Event.findOne({
      slug: String(slugStr || '').toLowerCase().trim(),
      isPublished: true,
      isDeleted: false,
    }).select('-formHistory');

    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found or is currently private',
      });
      return;
    }

    const eventJson = event.toJSON();
    delete (eventJson as any).formHistory;
    const computedStatus = event.getComputedStatus();
    const isRegistrationOpen = event.isRegistrationOpen();

    res.status(200).json({
      success: true,
      data: {
        ...eventJson,
        computedStatus,
        isRegistrationOpen,
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'An error occurred while retrieving event details',
    });
  }
};

/* =========================================================================
   ADMINISTRATIVE EVENT HANDLERS
   ========================================================================= */

/**
 * Admin: List all events with drafts, pagination, and status filters.
 * GET /api/v1/admin/events
 */
export const getAdminEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const skip = (page - 1) * limit;

    const { status, search } = req.query;
    const filter: any = { isDeleted: false };

    if (status === 'draft') {
      filter.$or = [{ isPublished: false }, { status: 'draft' }];
    } else if (status === 'published') {
      filter.isPublished = true;
      filter.isArchived = false;
    } else if (status === 'archived') {
      filter.$or = [{ isArchived: true }, { status: 'archived' }];
    }

    if (search && typeof search === 'string' && search.trim()) {
      filter.title = { $regex: search.trim(), $options: 'i' };
    }

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    const transformed = events.map((event) => {
      const doc = new Event(event);
      return {
        ...event,
        computedStatus: doc.getComputedStatus(),
        formStatus: doc.getFormStatus(),
      };
    });

    res.status(200).json({
      success: true,
      data: transformed,
      error: null,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve admin events',
    });
  }
};

/**
 * Admin: Retrieve event by ID for editing.
 * GET /api/v1/admin/events/:id
 */
export const getAdminEventById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findOne({ _id: id, isDeleted: false });

    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: event,
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve event details',
    });
  }
};

/**
 * Admin: Create a new event with banner upload.
 * POST /api/v1/admin/events
 */
export const createAdminEvent = async (req: Request, res: Response): Promise<void> => {
  let bannerMedia: { publicId: string; url: string } | undefined;

  try {
    const parseResult = eventInputSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        data: null,
        error: parseResult.error.issues[0]?.message || 'Invalid event input payload',
      });
      return;
    }

    const input = parseResult.data;

    // Handle banner image
    if (req.file) {
      if (!isCloudinaryConfigured()) {
        res.status(503).json({
          success: false,
          data: null,
          error: 'Cloudinary media upload service is not configured in server environment. Please set CLOUDINARY credentials in .env.',
        });
        return;
      }

      try {
        bannerMedia = await uploadImageBuffer(req.file.buffer, 'anveshana/banners');
      } catch (uploadError: any) {
        console.error('[Event Creation] Cloudinary banner upload failed:', uploadError);
        const errMsg = uploadError?.message || 'Upload stream rejected by Cloudinary';
        const isForbidden =
          uploadError?.http_code === 403 ||
          errMsg.includes('403') ||
          errMsg.includes('permissions') ||
          errMsg.includes('forbidden');
        const isUnauthorized = uploadError?.http_code === 401 || errMsg.includes('401');

        let userFriendlyError = `Banner upload failed: ${errMsg}`;
        if (isForbidden || isUnauthorized) {
          userFriendlyError =
            'Banner upload rejected by Cloudinary: Missing read/write permissions or invalid API credentials. Please verify Cloudinary environment credentials.';
        }

        res.status(502).json({
          success: false,
          data: null,
          error: userFriendlyError,
        });
        return;
      }
    } else if (req.body.bannerMedia) {
      let bm = req.body.bannerMedia;
      if (typeof bm === 'string') {
        try {
          bm = JSON.parse(bm);
        } catch {
          bm = null;
        }
      }
      if (bm && typeof bm.publicId === 'string' && typeof bm.url === 'string') {
        bannerMedia = { publicId: bm.publicId, url: bm.url };
      }
    }

    if (!bannerMedia) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Event banner image is required. Please upload a JPEG, PNG, or WebP file.',
      });
      return;
    }

    // Verify database connectivity before database mutations
    const dbStatus = getDbStatus();
    if (!dbStatus.connected && process.env.NODE_ENV !== 'test') {
      res.status(503).json({
        success: false,
        data: null,
        error: 'Database service is currently unavailable. MongoDB is not connected.',
      });
      return;
    }

    const slug = await generateUniqueSlug(input.title);
    const isPublished = input.isPublished ?? (input.status === 'published' || input.status === 'open');

    const event = await Event.create({
      title: input.title,
      slug,
      category: input.category || 'Workshop',
      shortDescription: input.shortDescription,
      fullDescription: input.fullDescription,
      bannerMedia,
      eventDate: new Date(input.eventDate),
      time: input.time,
      venue: input.venue,
      eligibility: input.eligibility || null,
      registrationDeadline: input.registrationDeadline ? new Date(input.registrationDeadline) : null,
      registrationUrl: input.registrationUrl || null,
      status: input.status || (isPublished ? 'published' : 'draft'),
      isPublished,
      isArchived: false,
      isDeleted: false,
      maxParticipants: input.maxParticipants || null,
      regOpenDate: input.regOpenDate ? new Date(input.regOpenDate) : null,
      regCloseDate: input.regCloseDate ? new Date(input.regCloseDate) : null,
      deduplicationRule: input.deduplicationRule || 'studentId',
      formVersion: 1,
      formSchema: [],
    });

    res.status(201).json({
      success: true,
      data: event,
      error: null,
    });
  } catch (error: any) {
    console.error('[Event Creation] Database save failed:', error);

    // Clean up uploaded Cloudinary image if database creation failed
    if (bannerMedia?.publicId) {
      await deleteCloudinaryImage(bannerMedia.publicId).catch(() => {});
    }

    if (error?.code === 11000) {
      res.status(409).json({
        success: false,
        data: null,
        error: 'An event with this title or slug already exists in the database. Please provide a distinct title.',
      });
      return;
    }

    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors || {})
        .map((e: any) => e.message)
        .join('. ');
      res.status(400).json({
        success: false,
        data: null,
        error: messages || 'Event validation failed.',
      });
      return;
    }

    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : error?.message || 'Failed to create event in database';

    res.status(500).json({
      success: false,
      data: null,
      error: message,
    });
  }
};

/**
 * Admin: Update event details with optional banner replacement.
 * PUT /api/v1/admin/events/:id
 */
export const updateAdminEvent = async (req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();
  if (!dbStatus.connected && process.env.NODE_ENV !== 'test') {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Database service is currently unavailable. MongoDB is not connected.',
    });
    return;
  }

  try {
    const { id } = req.params;
    const event = await Event.findOne({ _id: id, isDeleted: false });

    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found',
      });
      return;
    }

    const parseResult = eventInputSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        data: null,
        error: parseResult.error.issues[0]?.message || 'Invalid update payload',
      });
      return;
    }

    const updates = parseResult.data;

    // Handle banner replacement
    if (req.file) {
      if (!isCloudinaryConfigured()) {
        res.status(503).json({
          success: false,
          data: null,
          error: 'Cloudinary media upload service is not configured in server environment.',
        });
        return;
      }
      try {
        const newBanner = await uploadImageBuffer(req.file.buffer, 'anveshana/banners');
        // Clean up previous Cloudinary banner asset safely
        if (event.bannerMedia?.publicId) {
          await deleteCloudinaryImage(event.bannerMedia.publicId).catch(() => {});
        }
        event.bannerMedia = newBanner;
      } catch (uploadError: any) {
        console.error('[Event Update] Cloudinary banner upload failed:', uploadError);
        res.status(502).json({
          success: false,
          data: null,
          error: `Banner upload failed: ${uploadError?.message || 'Media service error'}`,
        });
        return;
      }
    }

    if (updates.title && updates.title !== event.title) {
      event.title = updates.title;
      event.slug = await generateUniqueSlug(updates.title, event._id.toString());
    }

    if (updates.category !== undefined) event.category = updates.category;
    if (updates.shortDescription !== undefined) event.shortDescription = updates.shortDescription;
    if (updates.fullDescription !== undefined) event.fullDescription = updates.fullDescription;
    if (updates.eventDate !== undefined) event.eventDate = new Date(updates.eventDate);
    if (updates.time !== undefined) event.time = updates.time;
    if (updates.venue !== undefined) event.venue = updates.venue;
    if (updates.eligibility !== undefined) event.eligibility = updates.eligibility;
    if (updates.registrationDeadline !== undefined) {
      event.registrationDeadline = updates.registrationDeadline ? new Date(updates.registrationDeadline) : null;
    }
    if (updates.status !== undefined) event.status = updates.status;
    if (updates.isPublished !== undefined) event.isPublished = updates.isPublished;
    if (updates.maxParticipants !== undefined) event.maxParticipants = updates.maxParticipants;
    if (updates.regOpenDate !== undefined) {
      event.regOpenDate = updates.regOpenDate ? new Date(updates.regOpenDate) : null;
    }
    if (updates.regCloseDate !== undefined) {
      event.regCloseDate = updates.regCloseDate ? new Date(updates.regCloseDate) : null;
    }
    if (updates.deduplicationRule !== undefined) event.deduplicationRule = updates.deduplicationRule;

    await event.save();

    res.status(200).json({
      success: true,
      data: event,
      error: null,
    });
  } catch (error: any) {
    console.error('[Event Update] Save failed:', error);
    if (error?.code === 11000) {
      res.status(409).json({
        success: false,
        data: null,
        error: 'An event with this title or slug already exists in the database.',
      });
      return;
    }

    if (error?.name === 'ValidationError') {
      const messages = Object.values(error.errors || {})
        .map((e: any) => e.message)
        .join('. ');
      res.status(400).json({
        success: false,
        data: null,
        error: messages || 'Event validation failed.',
      });
      return;
    }

    res.status(500).json({
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update event',
    });
  }
};

/**
 * Admin: Toggle publication state (Draft vs Published).
 * PATCH /api/v1/admin/events/:id/publish
 */
export const togglePublishEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findOne({ _id: id, isDeleted: false });

    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found',
      });
      return;
    }

    event.isPublished = !event.isPublished;
    event.status = event.isPublished ? 'published' : 'draft';
    await event.save();

    res.status(200).json({
      success: true,
      data: {
        id: event._id,
        isPublished: event.isPublished,
        status: event.status,
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to toggle event publication',
    });
  }
};

/**
 * Admin: Archive event.
 * PATCH /api/v1/admin/events/:id/archive
 */
export const archiveAdminEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findOne({ _id: id, isDeleted: false });

    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found',
      });
      return;
    }

    event.isArchived = true;
    event.isPublished = false;
    event.status = 'archived';
    await event.save();

    res.status(200).json({
      success: true,
      data: {
        id: event._id,
        isArchived: true,
        message: 'Event has been archived and hidden from public views.',
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to archive event',
    });
  }
};

/**
 * Admin: Delete or soft-archive event.
 * Protects participant history: never hard-deletes if registrations exist!
 * DELETE /api/v1/admin/events/:id
 */
export const deleteAdminEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findOne({ _id: id, isDeleted: false });

    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found',
      });
      return;
    }

    // Verify if registrations exist for this event
    const registrationCount = await Registration.countDocuments({ eventId: event._id });

    if (registrationCount > 0) {
      // Soft-archive to preserve participant data & audit records
      event.isDeleted = true;
      event.isArchived = true;
      event.isPublished = false;
      event.status = 'archived';
      await event.save();

      res.status(200).json({
        success: true,
        data: {
          id: event._id,
          action: 'soft-archived',
          registrationsPreserved: registrationCount,
          message: `Event contains ${registrationCount} participant registration(s). It has been safely soft-archived to preserve student records.`,
        },
        error: null,
      });
      return;
    }

    // If zero registrations exist, safely soft-delete and clean up media
    if (event.bannerMedia?.publicId) {
      await deleteCloudinaryImage(event.bannerMedia.publicId);
    }

    event.isDeleted = true;
    event.isPublished = false;
    await event.save();

    res.status(200).json({
      success: true,
      data: {
        id: event._id,
        action: 'deleted',
        message: 'Event has been deleted.',
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to delete event',
    });
  }
};

/**
 * Admin: Retrieve full form definition including draft, published schema, and version history.
 * GET /api/v1/admin/events/:id/form
 */
export const getAdminEventForm = async (req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Database service is currently unavailable.',
    });
    return;
  }

  try {
    const { id } = req.params;
    const event = await Event.findOne({ _id: id, isDeleted: false });

    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        eventId: event._id,
        eventTitle: event.title,
        formTitle: event.formTitle || `${event.title} Registration`,
        formDescription: event.formDescription || '',
        formVersion: event.formVersion || 1,
        formSchema: event.formSchema || [],
        formDraft: event.formDraft || null,
        formDraftTitle: event.formDraftTitle || '',
        formDraftDescription: event.formDraftDescription || '',
        formStatus: event.getFormStatus(),
        isRegistrationOpen: event.isRegistrationOpen(),
        computedStatus: event.getComputedStatus(),
        registeredCount: event.registeredCount || 0,
        maxParticipants: event.maxParticipants || null,
        formHistory: event.formHistory || [],
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
 * Admin: Save registration form as a working draft without publishing.
 * PUT /api/v1/admin/events/:id/form/draft
 */
export const saveAdminEventFormDraft = async (req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Database service is currently unavailable.',
    });
    return;
  }

  try {
    const { id } = req.params;
    const { formTitle, formDescription, formSchema } = req.body;

    const validationResult = validateFormSchemaDefinition(formSchema || []);
    if (!validationResult.isValid || !validationResult.sanitizedSchema) {
      res.status(400).json({
        success: false,
        data: null,
        error: validationResult.error || 'Invalid form schema configuration',
      });
      return;
    }

    const event = await Event.findOne({ _id: id, isDeleted: false });
    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found',
      });
      return;
    }

    event.formDraft = validationResult.sanitizedSchema;
    if (typeof formTitle === 'string') event.formDraftTitle = formTitle.trim();
    if (typeof formDescription === 'string') event.formDraftDescription = formDescription.trim();

    if (!event.formSchema || event.formSchema.length === 0) {
      event.formStatus = 'draft';
    }

    await event.save();

    res.status(200).json({
      success: true,
      data: {
        eventId: event._id,
        formDraft: event.formDraft,
        formDraftTitle: event.formDraftTitle,
        formDraftDescription: event.formDraftDescription,
        formStatus: event.getFormStatus(),
      },
      message: 'Registration form draft saved successfully. Ready to publish when finalized.',
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to save registration form draft',
    });
  }
};

/**
 * Admin: Update and publish event dynamic form schema.
 * Enforces immutable form versioning and historical snapshotting.
 * PUT /api/v1/admin/events/:id/form
 */
export const updateEventFormSchema = async (req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Database service is currently unavailable.',
    });
    return;
  }

  try {
    const { id } = req.params;
    const { formSchema, formTitle, formDescription } = req.body;

    const validationResult = validateFormSchemaDefinition(formSchema);
    if (!validationResult.isValid || !validationResult.sanitizedSchema) {
      res.status(400).json({
        success: false,
        data: null,
        error: validationResult.error || 'Invalid form schema configuration',
      });
      return;
    }

    if (validationResult.sanitizedSchema.length === 0) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'A published registration form must contain at least one question.',
      });
      return;
    }

    const event = await Event.findOne({ _id: id, isDeleted: false });
    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found',
      });
      return;
    }

    const sanitizedSchema = validationResult.sanitizedSchema;
    const newTitle =
      typeof formTitle === 'string' && formTitle.trim()
        ? formTitle.trim()
        : event.formTitle || `${event.title} Registration`;
    const newDescription =
      typeof formDescription === 'string'
        ? formDescription.trim()
        : event.formDescription || '';

    // Compare new schema against current event.formSchema
    const currentSerialized = JSON.stringify(
      (event.formSchema || []).map((f) => ({
        id: f.id,
        type: f.type,
        label: f.label,
        required: f.required,
        choices: f.choices,
        validation: f.validation,
      }))
    );
    const newSerialized = JSON.stringify(
      sanitizedSchema.map((f) => ({
        id: f.id,
        type: f.type,
        label: f.label,
        required: f.required,
        choices: f.choices,
        validation: f.validation,
      }))
    );
    const hasChanged = currentSerialized !== newSerialized || event.formSchema.length === 0;

    if (hasChanged) {
      // If formHistory is empty and we had a previous non-empty schema, snapshot v1 first
      if ((!event.formHistory || event.formHistory.length === 0) && event.formSchema && event.formSchema.length > 0) {
        event.formHistory = [
          {
            version: event.formVersion || 1,
            schema: event.formSchema,
            title: event.formTitle || event.title,
            description: event.formDescription || '',
            publishedAt: new Date(),
          },
        ];
      }

      const nextVersion = event.formSchema.length > 0 ? (event.formVersion || 1) + 1 : (event.formVersion || 1);
      event.formVersion = nextVersion;
      event.formSchema = sanitizedSchema;
      event.formTitle = newTitle;
      event.formDescription = newDescription;

      // Clear draft since it is now published
      event.formDraft = null;
      event.formDraftTitle = '';
      event.formDraftDescription = '';

      if (!event.formHistory) {
        event.formHistory = [];
      }
      event.formHistory.push({
        version: nextVersion,
        schema: sanitizedSchema,
        title: newTitle,
        description: newDescription,
        publishedAt: new Date(),
      });

      // Ensure form status is published
      event.formStatus = 'published';

      await event.save();
    } else {
      // Just update metadata if questions didn't change
      event.formTitle = newTitle;
      event.formDescription = newDescription;
      event.formDraft = null;
      await event.save();
    }

    res.status(200).json({
      success: true,
      data: {
        id: event._id,
        formTitle: event.formTitle,
        formDescription: event.formDescription,
        formVersion: event.formVersion,
        formSchema: event.formSchema,
        formStatus: event.getFormStatus(),
        versionIncremented: hasChanged,
      },
      error: null,
      message: `Form schema published as version ${event.formVersion}.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to update event registration form',
    });
  }
};

/**
 * Admin: Close registration for an event.
 * PATCH /api/v1/admin/events/:id/form/close
 */
export const closeAdminEventRegistration = async (req: Request, res: Response): Promise<void> => {
  const dbStatus = getDbStatus();
  if (!dbStatus.connected) {
    res.status(503).json({
      success: false,
      data: null,
      error: 'Database service is currently unavailable.',
    });
    return;
  }

  try {
    const { id } = req.params;
    const event = await Event.findOne({ _id: id, isDeleted: false });

    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found',
      });
      return;
    }

    event.status = 'closed';
    event.formStatus = 'closed';
    await event.save();

    res.status(200).json({
      success: true,
      data: {
        id: event._id,
        status: event.status,
        formStatus: event.getFormStatus(),
        isRegistrationOpen: false,
      },
      message: `Registration has been closed for "${event.title}".`,
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to close event registration',
    });
  }
};

/**
 * Admin: Retrieve published form version history snapshots.
 * GET /api/v1/admin/events/:id/form/versions
 */
export const getAdminEventFormVersions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const event = await Event.findOne({ _id: id, isDeleted: false });

    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: event.formHistory || [],
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve form version history',
    });
  }
};
