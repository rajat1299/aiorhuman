import express, { Router, Request, Response, RequestHandler } from 'express';
import { auth } from '../middleware/auth';
import {
  getGameHistory,
  getLeaderboard,
  getCurrentGame,
  getGameStats
} from '../controllers/gameController';
import { AuthRequest } from '../types/express';

const router = Router();

router.get('/history', auth, getGameHistory);
router.get('/leaderboard', getLeaderboard);
router.get('/current', auth, getCurrentGame);
router.get('/stats', auth, getGameStats);

export default router; 