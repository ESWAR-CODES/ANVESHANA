import { Router } from 'express';
import {
  getAdminFeedback,
  moderateFeedbackStatus,
  softDeleteFeedback,
} from '../controllers/feedbackController';
import { requireAdmin } from '../middlewares/auth';

const router = Router();

// Protect all admin feedback routes with requireAdmin
router.use(requireAdmin);

router.get('/', getAdminFeedback);
router.patch('/:id/status', moderateFeedbackStatus);
router.delete('/:id', softDeleteFeedback);

export default router;
