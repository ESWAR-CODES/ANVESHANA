import { Router } from 'express';
import {
  submitPublicFeedback,
  getPublicFeedback,
} from '../controllers/feedbackController';
import { feedbackRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Public feedback submission (rate-limited) and public rating summary
router.post('/', feedbackRateLimiter, submitPublicFeedback);
router.get('/', getPublicFeedback);

export default router;
