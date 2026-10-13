import { Router } from 'express';
import { getPublicEvents, getPublicEventBySlug } from '../controllers/eventController';
import { getEventFormSchema, submitRegistration } from '../controllers/registrationController';
import { getPublicEventGallery } from '../controllers/galleryController';
import { registrationRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Public Event Catalog Routes
router.get('/', getPublicEvents);
router.get('/:slug', getPublicEventBySlug);
router.get('/:slug/gallery', getPublicEventGallery);

// Public Dynamic Form & Registration Routes
router.get('/:identifier/form', getEventFormSchema);
router.post('/:identifier/register', registrationRateLimiter, submitRegistration);

export default router;
