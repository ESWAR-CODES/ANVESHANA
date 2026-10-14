import { Router } from 'express';
import {
  getAdminEvents,
  getAdminEventById,
  createAdminEvent,
  updateAdminEvent,
  togglePublishEvent,
  archiveAdminEvent,
  deleteAdminEvent,
  getAdminEventForm,
  saveAdminEventFormDraft,
  updateEventFormSchema,
  closeAdminEventRegistration,
  reopenAdminEventRegistration,
  removeAdminEventForm,
  getAdminEventFormVersions,
} from '../controllers/eventController';
import {
  getEventRegistrations,
  getRegistrationDetails,
  exportEventRegistrations,
  clearEventParticipants,
} from '../controllers/participantController';
import {
  getAdminEventGallery,
  uploadGalleryImage,
  deleteGalleryImage,
  updateGalleryImages,
  updateGalleryStory,
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

// Dynamic Registration Form Builder Endpoints
router.get('/:id/form', getAdminEventForm);
router.put('/:id/form/draft', saveAdminEventFormDraft);
router.put('/:id/form', updateEventFormSchema);
router.patch('/:id/form/close', closeAdminEventRegistration);
router.patch('/:id/form/reopen', reopenAdminEventRegistration);
router.delete('/:id/form', removeAdminEventForm);
router.get('/:id/form/versions', getAdminEventFormVersions);

router.patch('/:id/publish', togglePublishEvent);
router.patch('/:id/archive', archiveAdminEvent);
router.delete('/:id', deleteAdminEvent);

// Participant Management & Secure Export Endpoints
router.get('/:id/registrations', getEventRegistrations);
router.get('/:id/registrations/:registrationId', getRegistrationDetails);
router.get('/:id/export', exportEventRegistrations);
router.delete('/:id/participants', clearEventParticipants);

// Event Retrospective Gallery Endpoints (5MB per-photo limit)
router.get('/:id/gallery', getAdminEventGallery);
router.post('/:id/gallery', handleGalleryPhotoUpload, uploadGalleryImage);
router.delete('/:id/gallery/:publicId', deleteGalleryImage);
router.delete('/:id/gallery', deleteGalleryImage);
router.put('/:id/gallery', updateGalleryImages);
router.put('/:id/gallery/story', updateGalleryStory);

export default router;
