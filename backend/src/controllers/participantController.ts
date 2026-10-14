import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Event } from '../models/Event';
import { Registration } from '../models/Registration';
import { getDbStatus } from '../config/db';
import {
  generateParticipantCsv,
  generateParticipantXlsx,
  generateAllParticipantsCsv,
  generateAllParticipantsXlsx,
  ParticipantExportRecord,
} from '../utils/exportUtils';
import { FormFieldConfig } from '../types/models';

/**
 * Normalizes participant summary properties across different submission variations.
 */
export const extractParticipantSummary = (
  reg: any,
  formSchema?: FormFieldConfig[],
  eventTitle?: string
) => {
  const answers = reg.answers || {};

  // Resolve Full Name
  let fullName = '';
  if (typeof answers.fullName === 'string' && answers.fullName.trim()) fullName = answers.fullName.trim();
  else if (typeof answers.name === 'string' && answers.name.trim()) fullName = answers.name.trim();
  else if (typeof answers.studentName === 'string' && answers.studentName.trim()) fullName = answers.studentName.trim();

  if (!fullName && formSchema && formSchema.length > 0) {
    const nameField = formSchema.find((f) => /name/i.test(f.label) || /name/i.test(f.id));
    if (nameField && answers[nameField.id]) fullName = String(answers[nameField.id]).trim();
  }

  if (!fullName) {
    for (const [k, v] of Object.entries(answers)) {
      if (/name/i.test(k) && typeof v === 'string' && v.trim()) {
        fullName = v.trim();
        break;
      }
    }
  }

  // Resolve Email
  let email = reg.email || '';
  if (!email && typeof answers.email === 'string') email = answers.email.trim();
  if (!email && formSchema) {
    const emailField = formSchema.find((f) => f.type === 'email' || /email/i.test(f.label) || /email/i.test(f.id));
    if (emailField && answers[emailField.id]) email = String(answers[emailField.id]).trim();
  }

  // Resolve Student ID / College ID
  let studentId = reg.studentId || '';
  if (!studentId && answers.studentId) studentId = String(answers.studentId).trim();
  else if (!studentId && answers.collegeId) studentId = String(answers.collegeId).trim();
  else if (!studentId && answers.rollNo) studentId = String(answers.rollNo).trim();
  if (!studentId && formSchema) {
    const idField = formSchema.find((f) => /student|roll|college\s*id/i.test(f.label) || /student|roll/i.test(f.id));
    if (idField && answers[idField.id]) studentId = String(answers[idField.id]).trim();
  }

  // Resolve Phone
  let phone = '';
  if (answers.phone) phone = String(answers.phone).trim();
  else if (answers.phoneNumber) phone = String(answers.phoneNumber).trim();
  else if (answers.contact) phone = String(answers.contact).trim();
  if (!phone && formSchema) {
    const phoneField = formSchema.find((f) => f.type === 'phone' || /phone|mobile|contact/i.test(f.label) || /phone/i.test(f.id));
    if (phoneField && answers[phoneField.id]) phone = String(answers[phoneField.id]).trim();
  }

  return {
    _id: reg._id,
    referenceNumber: reg.referenceNumber || reg._id,
    eventId: reg.eventId,
    eventTitle: eventTitle || (reg.eventId && typeof reg.eventId === 'object' && reg.eventId.title ? reg.eventId.title : 'Event'),
    fullName: fullName || '—',
    email: email || '—',
    phone: phone || '—',
    collegeId: studentId || '—',
    studentId: studentId || '—',
    formVersion: reg.formVersion || 1,
    status: 'confirmed' as const,
    submittedAt: reg.submittedAt || reg.createdAt,
    createdAt: reg.createdAt || reg.submittedAt,
  };
};

/**
 * Admin: Retrieve paginated participant registrations for a specific event.
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
        { 'answers.fullName': { $regex: q, $options: 'i' } },
        { 'answers.name': { $regex: q, $options: 'i' } },
      ];
    }

    const [registrations, total] = await Promise.all([
      Registration.find(filter)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Registration.countDocuments(filter),
    ]);

    const mappedRegistrations = registrations.map((r) =>
      extractParticipantSummary(r, event.formSchema, event.title)
    );

    const distinctVersions = await Registration.distinct('formVersion', { eventId: event._id });
    if (event.formVersion && !distinctVersions.includes(event.formVersion)) {
      distinctVersions.push(event.formVersion);
    }
    distinctVersions.sort((a, b) => b - a);

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
        registrations: mappedRegistrations,
        formVersions: distinctVersions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
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

    // Query registration by string _id or referenceNumber (Registration._id is a custom string)
    const registration = await Registration.findOne({
      $or: [{ _id: regIdStr }, { referenceNumber: regIdStr }],
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

    // Map each field from historical schema to its label and student answer
    const answers = registration.answers || {};
    const mappedAnswers: Array<{
      fieldId: string;
      label: string;
      type: string;
      required: boolean;
      value: any;
    }> = [];

    for (const field of historicalSchema) {
      const rawAnswer = answers[field.id];
      mappedAnswers.push({
        fieldId: field.id,
        label: field.label,
        type: field.type,
        required: field.required,
        value: rawAnswer !== undefined && rawAnswer !== null ? rawAnswer : '—',
      });
    }

    // Include any additional answer keys that might exist outside schema
    for (const [key, val] of Object.entries(answers)) {
      if (!historicalSchema.some((f) => f.id === key) && val !== null && val !== undefined && val !== '') {
        mappedAnswers.push({
          fieldId: key,
          label: key.replace(/^field_/, '').replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          type: typeof val === 'boolean' ? 'yes_no' : typeof val === 'number' ? 'number' : 'text',
          required: false,
          value: val,
        });
      }
    }

    const summary = extractParticipantSummary(registration, historicalSchema, event.title);

    res.status(200).json({
      success: true,
      data: {
        _id: registration._id,
        referenceNumber: registration.referenceNumber || registration._id,
        fullName: summary.fullName,
        email: summary.email,
        phone: summary.phone,
        collegeId: summary.collegeId,
        studentId: summary.studentId,
        eventTitle: event.title,
        eventId: event._id,
        formVersion: registration.formVersion,
        historicalFormVersion: registration.formVersion,
        historicalFieldsCount: historicalSchema.length,
        submittedAt: registration.submittedAt,
        createdAt: registration.createdAt,
        answers: mappedAnswers,
        registration: {
          referenceNumber: registration.referenceNumber || registration._id,
          studentId: summary.studentId,
          email: summary.email,
          fullName: summary.fullName,
          phone: summary.phone,
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
 * Admin: Retrieve paginated participant registrations across all events.
 * GET /api/v1/admin/participants
 */
export const getAllParticipants = async (req: Request, res: Response): Promise<void> => {
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
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const skip = (page - 1) * limit;

    const { eventId, search, formVersion, dateFrom, dateTo } = req.query;

    const filter: any = { isArchived: false };

    if (eventId && typeof eventId === 'string' && mongoose.Types.ObjectId.isValid(eventId)) {
      filter.eventId = new mongoose.Types.ObjectId(eventId);
    }

    if (formVersion) {
      const ver = parseInt(formVersion as string, 10);
      if (!isNaN(ver)) {
        filter.formVersion = ver;
      }
    }

    if (dateFrom || dateTo) {
      filter.submittedAt = {};
      if (dateFrom && typeof dateFrom === 'string') {
        filter.submittedAt.$gte = new Date(dateFrom);
      }
      if (dateTo && typeof dateTo === 'string') {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filter.submittedAt.$lte = toDate;
      }
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { referenceNumber: { $regex: q, $options: 'i' } },
        { studentId: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { identifier: { $regex: q, $options: 'i' } },
        { 'answers.fullName': { $regex: q, $options: 'i' } },
        { 'answers.name': { $regex: q, $options: 'i' } },
      ];
    }

    const [registrations, total, events] = await Promise.all([
      Registration.find(filter)
        .populate('eventId', 'title slug eventDate formSchema formVersion')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Registration.countDocuments(filter),
      Event.find({ isDeleted: false }).select('_id title slug eventDate').sort({ eventDate: -1 }).lean(),
    ]);

    const mappedRegistrations = registrations.map((r: any) => {
      const eventObj = r.eventId && typeof r.eventId === 'object' ? r.eventId : null;
      return {
        ...extractParticipantSummary(r, eventObj?.formSchema, eventObj?.title),
        eventTitle: eventObj?.title || 'Unknown Event',
        eventSlug: eventObj?.slug || '',
      };
    });

    res.status(200).json({
      success: true,
      data: {
        registrations: mappedRegistrations,
        events: events.map((e) => ({ id: e._id, title: e.title, slug: e.slug })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve participant records.',
    });
  }
};

/**
 * Admin: Clear all participant registrations for a specific event (event cleanup).
 * DELETE /api/v1/admin/events/:id/participants
 */
export const clearEventParticipants = async (req: Request, res: Response): Promise<void> => {
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
      error: 'Database service is currently unavailable.',
    });
    return;
  }

  try {
    const event = await Event.findOne({ _id: idStr, isDeleted: false });
    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found.',
      });
      return;
    }

    const countBefore = await Registration.countDocuments({ eventId: event._id });
    if (countBefore === 0) {
      res.status(200).json({
        success: true,
        data: { deletedCount: 0, eventId: event._id, eventTitle: event.title },
        message: `No participant records found for "${event.title}".`,
      });
      return;
    }

    // Atomically delete registrations for this event only
    const deleteResult = await Registration.deleteMany({ eventId: event._id });

    // Reset event registeredCount to 0
    event.registeredCount = 0;
    await event.save();

    res.status(200).json({
      success: true,
      data: {
        deletedCount: deleteResult.deletedCount,
        eventId: event._id,
        eventTitle: event.title,
      },
      message: `Successfully cleared ${deleteResult.deletedCount} participant registration(s) for "${event.title}".`,
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to clear event participant records.',
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

/**
 * Admin: Export participants across events as CSV or XLSX.
 * GET /api/v1/admin/participants/export?format=csv|xlsx&eventId=...
 */
export const exportAllParticipants = async (req: Request, res: Response): Promise<void> => {
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
    const format = ((req.query.format as string) || 'csv').toLowerCase();
    const { eventId } = req.query;

    if (format !== 'csv' && format !== 'xlsx') {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Unsupported export format. Supported formats are "csv" and "xlsx".',
      });
      return;
    }

    // If an individual event is requested, delegate to existing single-event export
    if (eventId && typeof eventId === 'string' && mongoose.Types.ObjectId.isValid(eventId)) {
      req.params.id = eventId;
      return exportEventRegistrations(req, res);
    }

    // Otherwise export all participants across all events
    const registrations = await Registration.find({ isArchived: false })
      .populate('eventId', 'title slug formSchema')
      .sort({ submittedAt: -1 })
      .limit(10000)
      .lean();

    const records: ParticipantExportRecord[] = registrations.map((r: any) => {
      const eventObj = r.eventId && typeof r.eventId === 'object' ? r.eventId : null;
      const summary = extractParticipantSummary(r, eventObj?.formSchema, eventObj?.title);
      const answersObj = r.answers || {};
      const answersSummary = Object.entries(answersObj)
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ');

      return {
        referenceNumber: summary.referenceNumber,
        eventTitle: eventObj?.title || 'Unknown Event',
        fullName: summary.fullName,
        studentId: summary.studentId,
        email: summary.email,
        phone: summary.phone,
        submittedAt: summary.submittedAt,
        formVersion: summary.formVersion,
        answersSummary,
      };
    });

    const dateStamp = new Date().toISOString().slice(0, 10);

    if (format === 'xlsx') {
      const buffer = await generateAllParticipantsXlsx(records);
      const filename = `All_Participants_${dateStamp}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.status(200).send(buffer);
      return;
    }

    // CSV format default
    const csvContent = generateAllParticipantsCsv(records);
    const filename = `All_Participants_${dateStamp}.csv`;

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
