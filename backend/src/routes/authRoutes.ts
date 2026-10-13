import { Router } from 'express';
import { login, logout, me } from '../controllers/authController';
import { isAuth } from '../middlewares/auth';
import { loginRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/login', loginRateLimiter, login);
router.post('/logout', logout);
router.get('/me', isAuth, me);

export default router;
