import { Router } from 'express';
import {
  getAdminEvents,
  getAdminEventById,
  createAdminEvent,
  updateAdminEvent,
  togglePublishEvent,
  archiveAdminEvent,
  deleteAdminEvent,
  updateEventFormSchema,
} from '../controllers/eventController';
import {
  getEventRegistrations,
  getRegistrationDetails,
  exportEventRegistrations,
} from '../controllers/participantController';
import {
  getAdminEventGallery,
  uploadGalleryImage,
  deleteGalleryImage,
  updateGalleryImages,
} from '../controllers/galleryController';
import { requireAdmin } from '../middlewares/auth';
import { handleBannerUpload, handleGalleryPhotoUpload } from '../middlewares/upload';

const router = Router();

// Protect all admin event routes with requireAdmin
router.use(requireAdmin);

router.get('/', getAdminEvents);
router.get('/:id', getAdminEventById);
router.post('/', handleBannerUpload, createAdminEvent);
router.put('/:id', handleBannerUpload, updateAdminEvent);
router.put('/:id/form', updateEventFormSchema);
router.patch('/:id/publish', togglePublishEvent);
router.patch('/:id/archive', archiveAdminEvent);
router.delete('/:id', deleteAdminEvent);

// Participant Management & Secure Export Endpoints
router.get('/:id/registrations', getEventRegistrations);
router.get('/:id/registrations/:registrationId', getRegistrationDetails);
router.get('/:id/export', exportEventRegistrations);

// Event Retrospective Gallery Endpoints (5MB per-photo limit)
router.get('/:id/gallery', getAdminEventGallery);
router.post('/:id/gallery', handleGalleryPhotoUpload, uploadGalleryImage);
router.delete('/:id/gallery/:publicId', deleteGalleryImage);
router.delete('/:id/gallery', deleteGalleryImage);
router.put('/:id/gallery', updateGalleryImages);

export default router;
