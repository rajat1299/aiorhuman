import { Request, Response } from 'express';
import { AuthRequest } from '../types/express';
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
      $or: [
        { 'player1.userId': user._id },
        { 'player2.userId': user._id }
      ],
      status: { $in: ['completed', 'abandoned'] }
    })
    .sort({ endTime: -1 })
    .limit(10);

    res.json(games);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching game history' });
  }
};

export const getLeaderboard = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leaderboard = await User.find({
      'stats.totalGames': { $gt: 0 },
      username: { $not: /^AI_/ }
    })
    .select('username avatar stats')
    .sort({
      'stats.winRate': -1,
      'stats.totalGames': -1
    })
    .limit(20);

    res.json(leaderboard);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching leaderboard' });
  }
};

export const getCurrentGame = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const activeGame = await GameSession.findOne({
      $or: [
        { 'player1.userId': user._id },
        { 'player2.userId': user._id }
      ],
      status: 'active'
    });

    if (!activeGame) {
      res.status(404).json({ error: 'No active game found' });
      return;
    }

    res.json(activeGame);
    return;
  } catch (error) {
    res.status(400).json({ error: 'Error fetching current game' });
    return;
  }
};

export const getGameStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const stats = {
      totalGames: user.stats.totalGames,
      gamesWon: user.stats.gamesWon,
      winRate: user.stats.winRate,
      correctGuesses: user.stats.correctGuesses,
      successfulDeceptions: user.stats.successfulDeceptions,
      recentGames: await GameSession.find({
        $or: [
          { 'player1.userId': user._id },
          { 'player2.userId': user._id }
        ],
        status: 'completed'
      })
      .sort({ endTime: -1 })
      .limit(5)
      .select('winner stats endTime')
    };

    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: 'Error fetching game stats' });
  }
}; 