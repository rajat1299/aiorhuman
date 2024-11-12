// src/routes/game.ts

import express, { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import {
  getGameHistory,
  getLeaderboard,
  getCurrentGame,
  getGameStats,
} from '../controllers/gameController';

const router = Router();

// Use auth middleware for protected routes
router.get('/history', auth as express.RequestHandler, getGameHistory as express.RequestHandler);
router.get('/leaderboard', getLeaderboard as express.RequestHandler);
router.get('/current', auth as express.RequestHandler, getCurrentGame as express.RequestHandler);
router.get('/stats', auth as express.RequestHandler, getGameStats as express.RequestHandler);

export default router;
