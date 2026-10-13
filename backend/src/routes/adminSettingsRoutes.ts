import { Router } from 'express';
import {
  getAdminSettings,
  updateAdminSettings,
} from '../controllers/settingsController';
import { requireAdmin } from '../middlewares/auth';

const router = Router();

// Protect all admin settings routes
router.use(requireAdmin);

router.get('/', getAdminSettings);
router.put('/', updateAdminSettings);

export default router;
