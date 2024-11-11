// src/controllers/gameController.ts

import { Request, Response } from 'express';
import { AuthRequest } from '../types/custom';
import GameSession from '../models/GameSession';
import User from '../models/User';

export const getGameHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const games = await GameSession.find({
      $or: [{ 'player1.userId': user._id }, { 'player2.userId': user._id }],
      status: { $in: ['completed', 'abandoned'] },
    })
      .sort({ endTime: -1 })
      .limit(10);

    res.json(games);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching game history' });
  }
};

export const getLeaderboard = async (req: Request, res: Response): Promise<void> => {
  // ... rest of the code
};

export const getCurrentGame = async (req: AuthRequest, res: Response): Promise<void> => {
  // ... rest of the code
};

export const getGameStats = async (req: AuthRequest, res: Response): Promise<void> => {
  // ... rest of the code
};
