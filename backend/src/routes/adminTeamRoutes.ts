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

const router = Router();

// Protect all admin team routes
router.use(requireAdmin);

// The 7 predefined categories
router.get('/categories', getAdminTeamCategories);

// Member CRUD
router.get('/members', getAdminTeamMembers);
router.post('/members', handleTeamPhotoUpload, createAdminTeamMember);
router.put('/members/:id', handleTeamPhotoUpload, updateAdminTeamMember);
router.patch('/members/:id/publish', togglePublishTeamMember);
router.delete('/members/:id', deleteAdminTeamMember);

export default router;
