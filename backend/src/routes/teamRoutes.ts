import { Router } from 'express';
import { getPublicTeam } from '../controllers/teamController';

const router = Router();

// Public: Core Team Directory
router.get('/', getPublicTeam);

export default router;
