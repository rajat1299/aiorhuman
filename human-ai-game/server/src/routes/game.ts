import { Router } from 'express';
import { GameController } from '../controllers/gameController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/history', authenticate, asyncHandler(GameController.getHistory));
router.get('/current', authenticate, asyncHandler(GameController.getCurrentGame));
router.get('/leaderboard', authenticate, asyncHandler(GameController.getLeaderboard));
router.get('/stats', authenticate, asyncHandler(GameController.getStats));

export default router; 