import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Event } from '../models/Event';
import { EventGallery } from '../models/EventGallery';
import { getDbStatus } from '../config/db';
import { uploadImageBuffer, deleteCloudinaryImage } from '../config/cloudinary';

/**
 * Public: Retrieve gallery images for an event by slug.
 * GET /api/v1/events/:slug/gallery
 */
export const getPublicEventGallery = async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;
  const slugStr = Array.isArray(slug) ? slug[0] : slug;

  if (!slugStr || typeof slugStr !== 'string') {
    res.status(400).json({
      success: false,
      data: null,
      error: 'Event slug identifier is required.',
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
    const event = await Event.findOne({
      slug: slugStr.toLowerCase().trim(),
      isDeleted: false,
      isPublished: true,
    }).lean();

    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found or not published.',
      });
      return;
    }

    const gallery = await EventGallery.findOne({ eventId: event._id }).lean();
    const sortedImages = (gallery?.images || []).sort(
      (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
    );

    res.status(200).json({
      success: true,
      data: {
        event: {
          id: event._id,
          title: event.title,
          slug: event.slug,
          eventDate: event.eventDate,
        },
        title: gallery?.title || event.title,
        eventDate: gallery?.eventDate || event.eventDate,
        shortSummary: gallery?.shortSummary || '',
        fullStory: gallery?.fullStory || '',
        challenges: gallery?.challenges || '',
        highlights: gallery?.highlights || [],
        winners: gallery?.winners || [],
        coverImage: gallery?.coverImage || null,
        images: sortedImages,
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve event gallery.',
    });
  }
};

/**
 * Admin: Retrieve gallery images and story for an event by ID.
 * GET /api/v1/admin/events/:id/gallery
 */
export const getAdminEventGallery = async (req: Request, res: Response): Promise<void> => {
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
    const event = await Event.findOne({ _id: idStr, isDeleted: false }).lean();
    if (!event) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Event not found.',
      });
      return;
    }

    const gallery = await EventGallery.findOne({ eventId: event._id }).lean();
    const sortedImages = (gallery?.images || []).sort(
      (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
    );

    res.status(200).json({
      success: true,
      data: {
        eventId: event._id,
        eventTitle: event.title,
        title: gallery?.title || event.title,
        eventDate: gallery?.eventDate || event.eventDate,
        shortSummary: gallery?.shortSummary || '',
        fullStory: gallery?.fullStory || '',
        challenges: gallery?.challenges || '',
        highlights: gallery?.highlights || [],
        winners: gallery?.winners || [],
        coverImage: gallery?.coverImage || null,
        images: sortedImages,
      },
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to retrieve event gallery.',
    });
  }
};

/**
 * Admin: Upload a new photo to an event's retrospective gallery (5 MB Limit).
 * POST /api/v1/admin/events/:id/gallery
 */
export const uploadGalleryImage = async (req: Request, res: Response): Promise<void> => {
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

  if (!req.file) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'An image file is required for gallery upload (JPEG, PNG, or WebP up to 5MB).',
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

    // Upload memory buffer to Cloudinary gallery folder
    const uploadRes = await uploadImageBuffer(req.file.buffer, 'anveshana/gallery');

    const newImage = {
      publicId: uploadRes.publicId,
      url: uploadRes.url,
      caption: typeof req.body.caption === 'string' ? req.body.caption.trim().slice(0, 200) : '',
      altText: typeof req.body.altText === 'string' ? req.body.altText.trim().slice(0, 200) : (typeof req.body.caption === 'string' ? req.body.caption.trim().slice(0, 200) : ''),
      displayOrder: parseInt(req.body.displayOrder as string, 10) || 0,
    };

    const gallery = await EventGallery.findOneAndUpdate(
      { eventId: event._id },
      { $push: { images: newImage } },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      data: {
        image: newImage,
        totalImages: gallery.images.length,
      },
      message: 'Gallery photo uploaded and attached to event successfully.',
      error: null,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      data: null,
      error: error.message || 'Failed to upload gallery image.',
    });
  }
};

/**
 * Admin: Remove a photo from an event's gallery.
 * DELETE /api/v1/admin/events/:id/gallery/:publicId
 * or DELETE /api/v1/admin/events/:id/gallery?publicId=...
 */
export const deleteGalleryImage = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const idStr = Array.isArray(id) ? id[0] : id;

  // Support publicId passed in route param, query param, or body
  const publicIdParam = req.params.publicId;
  const publicId = (
    publicIdParam ||
    (req.query.publicId as string) ||
    (req.body && req.body.publicId)
  )?.trim();

  if (!idStr || !mongoose.Types.ObjectId.isValid(idStr)) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'Invalid event identifier format.',
    });
    return;
  }

  if (!publicId) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'Cloudinary public ID is required to remove image.',
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

    const gallery = await EventGallery.findOne({ eventId: event._id });
    if (!gallery) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Gallery not found for this event.',
      });
      return;
    }

    const imageExists = gallery.images.some((img) => img.publicId === publicId);
    if (!imageExists) {
      res.status(404).json({
        success: false,
        data: null,
        error: 'Image not found in this event gallery.',
      });
      return;
    }

    // Pull image from document
    await EventGallery.updateOne(
      { eventId: event._id },
      { $pull: { images: { publicId } } }
    );

    // Asynchronously delete from Cloudinary
    deleteCloudinaryImage(publicId).catch(() => {});

    res.status(200).json({
      success: true,
      data: null,
      message: 'Gallery photo removed successfully.',
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to delete gallery image.',
    });
  }
};

/**
 * Admin: Update captions or display ordering of gallery images.
 * PUT /api/v1/admin/events/:id/gallery
 */
export const updateGalleryImages = async (req: Request, res: Response): Promise<void> => {
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

  const { images } = req.body;
  if (!Array.isArray(images)) {
    res.status(400).json({
      success: false,
      data: null,
      error: 'Images array is required.',
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

    const gallery = await EventGallery.findOneAndUpdate(
      { eventId: event._id },
      { $set: { images } },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: gallery,
      message: 'Gallery images updated successfully.',
      error: null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: 'Failed to update gallery.',
    });
  }
};

/**
 * Admin: Update rich event retrospective story (title, date, summary, full story, challenges, highlights, winners).
 * PUT /api/v1/admin/events/:id/gallery/story
 */
export const updateGalleryStory = async (req: Request, res: Response): Promise<void> => {
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

    const {
      title,
      eventDate,
      shortSummary,
      fullStory,
      challenges,
      highlights,
      winners,
      coverImage,
    } = req.body;

    const updatePayload: any = {};
    if (typeof title === 'string') updatePayload.title = title.trim();
    if (typeof eventDate === 'string') updatePayload.eventDate = eventDate.trim();
    if (typeof shortSummary === 'string') updatePayload.shortSummary = shortSummary.trim();
    if (typeof fullStory === 'string') updatePayload.fullStory = fullStory.trim();
    if (typeof challenges === 'string') updatePayload.challenges = challenges.trim();
    if (Array.isArray(highlights)) {
      updatePayload.highlights = highlights.map((h: any) => String(h).trim()).filter(Boolean);
    }
    if (Array.isArray(winners)) {
      updatePayload.winners = winners
        .map((w: any) => ({
          position: String(w.position || '').trim(),
          name: String(w.name || '').trim(),
          project: String(w.project || '').trim(),
        }))
        .filter((w) => w.position && w.name);
    }
    if (coverImage && typeof coverImage === 'object') {
      updatePayload.coverImage = {
        publicId: coverImage.publicId,
        url: coverImage.url,
      };
    }

    const gallery = await EventGallery.findOneAndUpdate(
      { eventId: event._id },
      { $set: updatePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      data: gallery,
      message: 'Event retrospective story updated successfully.',
      error: null,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      data: null,
      error: error.message || 'Failed to update event retrospective story.',
    });
  }
};
