import { Router } from 'express';
import {
  getAllParticipants,
  exportAllParticipants,
  clearEventParticipants,
} from '../controllers/participantController';
import { requireAdmin } from '../middlewares/auth';

const router = Router();

// Protect all admin participant endpoints with requireAdmin
router.use(requireAdmin);

router.get('/', getAllParticipants);
router.get('/export', exportAllParticipants);
router.delete('/event/:id', clearEventParticipants);

export default router;
