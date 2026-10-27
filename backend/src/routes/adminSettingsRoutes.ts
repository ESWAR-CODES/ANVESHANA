import { Router } from 'express';
import {
  getAdminSettings,
  updateAdminSettings,
  uploadClubLogo,
  uploadUniversityLogo,
  deleteClubLogo,
  deleteUniversityLogo,
  uploadHeroBackground,
  deleteHeroBackground,
} from '../controllers/settingsController';
import { requireAdmin } from '../middlewares/auth';
import { handleLogoUpload, handleHeroBackgroundUpload } from '../middlewares/upload';
import { uploadRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Protect all admin settings routes
router.use(requireAdmin);

router.get('/', getAdminSettings);
router.put('/', updateAdminSettings);

// Dual Logo Management Routes
router.post('/logo/club', uploadRateLimiter, handleLogoUpload, uploadClubLogo);
router.post('/logo/university', uploadRateLimiter, handleLogoUpload, uploadUniversityLogo);
router.delete('/logo/club', deleteClubLogo);
router.delete('/logo/university', deleteUniversityLogo);

// Homepage Hero Background Routes
router.post('/hero/background', uploadRateLimiter, handleHeroBackgroundUpload, uploadHeroBackground);
router.delete('/hero/background', deleteHeroBackground);

export default router;
