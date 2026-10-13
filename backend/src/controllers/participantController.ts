import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { getDbStatus } from '../config/db';
import {
  generateParticipantCsv,
  generateParticipantXlsx,
  buildUnifiedFieldCatalog,
} from '../utils/exportUtils';
import { FormFieldConfig } from '../types/models';

/**
 * Admin: Retrieve paginated participant registrations for an event.
 * GET /api/v1/admin/events/:id/registrations
 */
export const getEventRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;

    if (!idStr || !mongoose.Types.ObjectId.isValid(idStr)) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid event identifier format.',
      });
      return;
    }

    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      res.status(503).json({
        success: false,
        data: null,
        error: 'Database service is currently unavailable. Please try again later.',
      });
      return;
    }

    const event = await Event.findOne({ _id: idStr, isDeleted: false });
    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found.',
      });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const { search, formVersion } = req.query;

    const filter: any = {
      eventId: event._id,
      isArchived: false,
    };

    if (formVersion) {
      const ver = parseInt(formVersion as string, 10);
      if (!isNaN(ver)) {
        filter.formVersion = ver;
      }
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { referenceNumber: { $regex: q, $options: 'i' } },
        { studentId: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { identifier: { $regex: q, $options: 'i' } },
      ];
    }

    const [registrations, total] = await Promise.all([
      Registration.find(filter)
        .select('_id referenceNumber eventId formVersion answers identifier studentId email submittedAt createdAt')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Registration.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        event: {
          id: event._id,
          title: event.title,
          slug: event.slug,
          currentFormVersion: event.formVersion || 1,
          registeredCount: event.registeredCount,
          maxParticipants: event.maxParticipants,
        },
        registrations,
      },
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
      error: 'An unexpected error occurred while retrieving event participants.',
    });
  }
};

/**
 * Admin: Retrieve single registration details mapped to its exact historical form schema snapshot.
 * GET /api/v1/admin/events/:id/registrations/:registrationId
 */
export const getRegistrationDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, registrationId } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const regIdStr = Array.isArray(registrationId) ? registrationId[0] : registrationId;

    if (!idStr || !mongoose.Types.ObjectId.isValid(idStr)) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid event identifier format.',
      });
      return;
    }

    if (!regIdStr) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Registration identifier is required.',
      });
      return;
    }

    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      res.status(503).json({
        success: false,
        data: null,
        error: 'Database service is currently unavailable.',
      });
      return;
    }

    const event = await Event.findOne({ _id: idStr, isDeleted: false });
    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found.',
      });
      return;
    }

    const registration = await Registration.findOne({
      $or: mongoose.Types.ObjectId.isValid(regIdStr)
        ? [{ _id: regIdStr }, { referenceNumber: regIdStr }]
        : [{ referenceNumber: regIdStr }],
      eventId: event._id,
    }).lean();

    if (!registration) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Registration record not found.',
      });
      return;
    }

    // Resolve exact historical schema snapshot used for this registration
    let historicalSchema: FormFieldConfig[] = [];
    if (registration.formVersion === event.formVersion) {
      historicalSchema = event.formSchema || [];
    } else if (Array.isArray(event.formHistory)) {
      const foundSnapshot = event.formHistory.find((h) => h.version === registration.formVersion);
      historicalSchema = foundSnapshot?.schema || event.formSchema || [];
    } else {
      historicalSchema = event.formSchema || [];
    }

    // Map each field to its label and student answer
    const answers = registration.answers || {};
    const mappedAnswers = historicalSchema.map((field) => {
      const rawAnswer = answers[field.id];
      return {
        fieldId: field.id,
        label: field.label,
        type: field.type,
        required: field.required,
        value: rawAnswer !== undefined && rawAnswer !== null ? rawAnswer : null,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        registration: {
          referenceNumber: registration.referenceNumber || registration._id,
          studentId: registration.studentId || null,
          email: registration.email || null,
          identifier: registration.identifier,
          formVersion: registration.formVersion,
          submittedAt: registration.submittedAt,
        },
        schemaVersion: registration.formVersion,
        mappedAnswers,
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve participant registration details.',
    });
  }
};

/**
 * Admin: Export event participants as CSV or XLSX with formula injection protection.
 * GET /api/v1/admin/events/:id/export?format=csv|xlsx
 */
export const exportEventRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;
    const format = ((req.query.format as string) || 'csv').toLowerCase();

    if (!idStr || !mongoose.Types.ObjectId.isValid(idStr)) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid event identifier format.',
      });
      return;
    }

    if (format !== 'csv' && format !== 'xlsx') {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Unsupported export format. Supported formats are "csv" and "xlsx".',
      });
      return;
    }

    const dbStatus = getDbStatus();
    if (!dbStatus.connected) {
      res.status(503).json({
        success: false,
        data: null,
        error: 'Database service is currently unavailable.',
      });
      return;
    }

    const event = await Event.findOne({ _id: idStr, isDeleted: false });
    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found.',
      });
      return;
    }

    // Query registrations up to bounded limit (5000 max) to protect server memory
    const registrations = await Registration.find({
      eventId: event._id,
      isArchived: false,
    })
      .sort({ submittedAt: 1 })
      .limit(5000)
      .lean();

    const dateStamp = new Date().toISOString().slice(0, 10);
    const safeSlug = (event.slug || 'event').replace(/[^a-zA-Z0-9_-]/g, '_');

    if (format === 'xlsx') {
      const buffer = await generateParticipantXlsx(event, registrations as any);
      const filename = `${safeSlug}_Participants_${dateStamp}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.status(200).send(buffer);
      return;
    }

    // CSV format default
    const csvContent = generateParticipantCsv(event, registrations as any);
    const filename = `${safeSlug}_Participants_${dateStamp}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'An error occurred during participant export generation.',
    });
  }
};
