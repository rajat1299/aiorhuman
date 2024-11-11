// src/routes/game.ts

import { Router } from 'express';
import { auth } from '../middleware/auth';
import {
  getGameHistory,
  getLeaderboard,
  getCurrentGame,
  getGameStats,
} from '../controllers/gameController';

const router = Router();

// Use auth middleware for protected routes
router.get('/history', auth, getGameHistory);
router.get('/leaderboard', getLeaderboard);
router.get('/current', auth, getCurrentGame);
router.get('/stats', auth, getGameStats);

export default router;
