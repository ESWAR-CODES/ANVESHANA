import { Router } from 'express';
import {
  getAdminSettings,
  updateAdminSettings,
  uploadClubLogo,
  uploadUniversityLogo,
  deleteClubLogo,
  deleteUniversityLogo,
} from '../controllers/settingsController';
import { requireAdmin } from '../middlewares/auth';
import { handleLogoUpload } from '../middlewares/upload';

const router = Router();

// Protect all admin settings routes
router.use(requireAdmin);

router.get('/', getAdminSettings);
router.put('/', updateAdminSettings);

// Dual Logo Management Routes
router.post('/logo/club', handleLogoUpload, uploadClubLogo);
router.post('/logo/university', handleLogoUpload, uploadUniversityLogo);
router.delete('/logo/club', deleteClubLogo);
router.delete('/logo/university', deleteUniversityLogo);

export default router;
