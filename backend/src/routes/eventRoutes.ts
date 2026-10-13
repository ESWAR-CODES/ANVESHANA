import { Router } from 'express';
import { getPublicEvents, getPublicEventBySlug } from '../controllers/eventController';

const router = Router();

// Public Event Routes
router.get('/', getPublicEvents);
router.get('/:slug', getPublicEventBySlug);

export default router;
