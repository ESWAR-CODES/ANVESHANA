import { Request, Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Feedback } from '../models/Feedback';
import { getDbStatus } from '../config/db';
import { FeedbackStatus } from '../types/models';
import { escapeRegex } from '../utils/sanitize';

/**
 * Public: Submit rating and feedback for the club.
 * POST /api/v1/feedback
 */
export const submitPublicFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rating, feedbackText, comment, name, email, category } = req.body;
    const rawText = feedbackText !== undefined ? feedbackText : comment;

    // Validate rating
    const numRating = typeof rating === 'number' ? rating : Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Rating must be an integer between 1 and 5 stars.',
      });
      return;
    }

    // Validate feedback text / comment length (between 5 and 1000 characters)
    if (typeof rawText !== 'string' || rawText.trim().length < 5 || rawText.trim().length > 1000) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Feedback comment must be between 5 and 1000 characters.',
      });
      return;
    }

    const cleanText = rawText.trim();

    // Validate category if provided
    const validCategories = ['general', 'event', 'website', 'other'];
    const chosenCategory = category ? String(category).toLowerCase() : 'general';
    if (!validCategories.includes(chosenCategory)) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid category. Allowed values: general, event, website, other.',
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

    // Hash client IP for spam protection without storing raw PII
    const rawIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(rawIp).digest('hex');

    const feedback = new Feedback({
      name: typeof name === 'string' && name.trim() ? name.trim() : null,
      email: typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null,
      category: chosenCategory as 'general' | 'event' | 'website' | 'other',
      rating: numRating,
      feedbackText: cleanText,
      status: 'pending',
      ipHash,
      isDeleted: false,
    });
    await feedback.save();

    res.status(201).json({
      success: true,
      data: {
        id: feedback._id,
        rating: feedback.rating,
        feedbackText: feedback.feedbackText,
        name: feedback.name,
        category: feedback.category,
        createdAt: feedback.createdAt,
      },
      message: 'Thank you for your feedback! Your submission has been received for review.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'An unexpected error occurred while submitting feedback.',
    });
  }
};

/**
 * Public: Retrieve rating aggregates and reviewed public feedback.
 * GET /api/v1/feedback
 */
export const getPublicFeedback = async (_req: Request, res: Response): Promise<void> => {
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
    const filter: any = { status: 'reviewed', isDeleted: false };

    const [reviews, stats] = await Promise.all([
      Feedback.find(filter)
        .select('_id rating feedbackText name category createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Feedback.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const aggregate = stats[0] || { averageRating: 5.0, totalCount: 0 };
    const avgScore = Math.round(aggregate.averageRating * 10) / 10;
    const normalizedReviews = reviews.map((r: any) => ({
      ...r,
      comment: r.feedbackText,
    }));

    res.status(200).json({
      success: true,
      data: {
        averageRating: avgScore,
        totalCount: aggregate.totalCount,
        reviews: normalizedReviews,
        feedbacks: normalizedReviews,
        stats: {
          averageRating: avgScore,
          totalCount: aggregate.totalCount,
        },
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve feedback summary.',
    });
  }
};

/**
 * Admin: Retrieve paginated feedback with metrics and status filters.
 * GET /api/v1/admin/feedback
 */
export const getAdminFeedback = async (req: Request, res: Response): Promise<void> => {
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

    const { status, rating, search } = req.query;

    const filter: any = { isDeleted: false };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (rating) {
      const numR = parseInt(rating as string, 10);
      if (!isNaN(numR)) filter.rating = numR;
    }

    if (search && typeof search === 'string' && search.trim()) {
      filter.feedbackText = { $regex: escapeRegex(search.trim()), $options: 'i' };
    }

    const [feedbacks, total, pendingCount, reviewedCount, archivedCount, stats] = await Promise.all([
      Feedback.find(filter)
        .select('_id rating feedbackText name email category status moderatedAt createdAt isDeleted')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Feedback.countDocuments(filter),
      Feedback.countDocuments({ status: 'pending', isDeleted: false }),
      Feedback.countDocuments({ status: 'reviewed', isDeleted: false }),
      Feedback.countDocuments({ status: 'archived', isDeleted: false }),
      Feedback.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

    const avgRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 5.0;
    const normalizedFeedbacks = feedbacks.map((f: any) => ({
      ...f,
      comment: f.feedbackText,
    }));

    res.status(200).json({
      success: true,
      data: {
        feedbacks: normalizedFeedbacks,
        metrics: {
          total: stats.length > 0 ? stats[0].total : 0,
          totalSubmissions: stats.length > 0 ? stats[0].total : 0,
          pending: pendingCount,
          pendingCount,
          reviewed: reviewedCount,
          reviewedCount,
          archived: archivedCount,
          archivedCount,
          averageRating: avgRating,
        },
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
      error: 'Failed to retrieve feedback for moderation.',
    });
  }
};

/**
 * Admin: Moderate feedback status (reviewed, archived, pending).
 * PATCH /api/v1/admin/feedback/:id/status
 */
export const moderateFeedbackStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const idStr = Array.isArray(id) ? id[0] : id;

    if (!idStr || !mongoose.Types.ObjectId.isValid(idStr)) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid feedback identifier format.',
      });
      return;
    }

    const permittedStatuses: FeedbackStatus[] = ['pending', 'reviewed', 'archived'];
    if (!status || !permittedStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid moderation status. Permitted values: pending, reviewed, archived.',
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

    const feedback = await Feedback.findOne({ _id: idStr, isDeleted: false });
    if (!feedback) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Feedback record not found.',
      });
      return;
    }

    feedback.status = status;
    feedback.moderatedAt = new Date();
    if ((req as any).admin?._id) {
      feedback.moderatedBy = (req as any).admin._id;
    }

    await feedback.save();

    res.status(200).json({
      success: true,
      data: {
        id: feedback._id,
        status: feedback.status,
        moderatedAt: feedback.moderatedAt,
      },
      error: null,
      message: `Feedback status updated to ${status}.`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to update feedback status.',
    });
  }
};

/**
 * Admin: Soft-delete feedback submission (preserves record for audit).
 * DELETE /api/v1/admin/feedback/:id
 */
export const softDeleteFeedback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const idStr = Array.isArray(id) ? id[0] : id;

    if (!idStr || !mongoose.Types.ObjectId.isValid(idStr)) {
      res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid feedback identifier format.',
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

    const feedback = await Feedback.findOne({ _id: idStr, isDeleted: false });
    if (!feedback) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Feedback record not found.',
      });
      return;
    }

    feedback.isDeleted = true;
    feedback.status = 'archived';
    feedback.moderatedAt = new Date();
    if ((req as any).admin?._id) {
      feedback.moderatedBy = (req as any).admin._id;
    }

    await feedback.save();

    res.status(200).json({
      success: true,
      data: {
        id: feedback._id,
        isDeleted: true,
      },
      error: null,
      message: 'Feedback entry has been soft-deleted and archived.',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to soft-delete feedback entry.',
    });
  }
};
