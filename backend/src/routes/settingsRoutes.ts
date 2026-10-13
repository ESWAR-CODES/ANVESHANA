import { Router } from 'express';
import { getPublicSettings } from '../controllers/settingsController';

const router = Router();

// Public: Club Settings & Contact Details
router.get('/', getPublicSettings);

export default router;
