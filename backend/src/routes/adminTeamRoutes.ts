import { Router } from 'express';
import {
  getAdminTeamCategories,
  getAdminTeamMembers,
  createAdminTeamMember,
  updateAdminTeamMember,
  togglePublishTeamMember,
  deleteAdminTeamMember,
} from '../controllers/teamController';
import { requireAdmin } from '../middlewares/auth';
import { handleTeamPhotoUpload } from '../middlewares/upload';
import { uploadRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Protect all admin team routes
router.use(requireAdmin);

// The 7 predefined categories
router.get('/categories', getAdminTeamCategories);

// Member CRUD
router.get('/members', getAdminTeamMembers);
router.post('/members', uploadRateLimiter, handleTeamPhotoUpload, createAdminTeamMember);
router.put('/members/:id', uploadRateLimiter, handleTeamPhotoUpload, updateAdminTeamMember);
router.patch('/members/:id/publish', togglePublishTeamMember);
router.delete('/members/:id', deleteAdminTeamMember);

export default router;
