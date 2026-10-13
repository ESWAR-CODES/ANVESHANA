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
import { requireAdmin } from '../middlewares/auth';
import { handleBannerUpload } from '../middlewares/upload';

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

export default router;
