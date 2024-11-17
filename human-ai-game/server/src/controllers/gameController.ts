import { Request, Response } from 'express';
import { Game } from '../models/Game';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { calculateScore } from '../utils/gameUtils';
import config from '../config/config';

export class GameController {
  // Get user's game history
  static async getHistory(req: Request, res: Response) {
    try {
      const games = await Game.find({
        $or: [
          { player1Id: req.user!.userId },
          { player2Id: req.user!.userId }
        ],
        status: 'completed'
      })
      .sort({ endTime: -1 })
      .limit(10);

      res.status(200).json({
        success: true,
        data: { games }
      });
    } catch (error) {
      throw new ApiError(500, 'Error fetching game history');
    }
  }

  // Get current game
  static async getCurrentGame(req: Request, res: Response) {
    try {
      const game = await Game.findOne({
        $or: [
          { player1Id: req.user!.userId },
          { player2Id: req.user!.userId }
        ],
        status: { $in: ['waiting', 'in_progress', 'guessing'] }
      });

      if (!game) {
        throw new ApiError(404, 'No active game found');
      }

      res.status(200).json({
        success: true,
        data: { game }
      });
    } catch (error) {
      throw new ApiError(500, 'Error fetching current game');
    }
  }

  // Get leaderboard
  static async getLeaderboard(req: Request, res: Response) {
    try {
      const topPlayers = await User.find({
        'stats.gamesPlayed': { $gt: 0 }
      })
      .sort({
        'stats.totalPoints': -1,
        'stats.winRate': -1
      })
      .limit(10)
      .select('username stats');

      res.status(200).json({
        success: true,
        data: { leaderboard: topPlayers }
      });
    } catch (error) {
      throw new ApiError(500, 'Error fetching leaderboard');
    }
  }

  // Get player stats
  static async getStats(req: Request, res: Response) {
    try {
      const user = await User.findById(req.user!.userId)
        .select('username stats');

      if (!user) {
        throw new ApiError(404, 'User not found');
      }

      res.status(200).json({
        success: true,
        data: { stats: user.stats }
      });
    } catch (error) {
      throw new ApiError(500, 'Error fetching player stats');
    }
  }

  // Update game state (internal method)
  static async updateGameState(
    gameId: string,
    playerId: string,
    guessedAI: boolean
  ): Promise<{
    gameComplete: boolean;
    score?: number;
    correct?: boolean;
  }> {
    const game = await Game.findById(gameId);
    
    if (!game) {
      throw new ApiError(404, 'Game not found');
    }

    // Add player's guess
    game.guesses.push({
      playerId,
      guessedAI,
      timestamp: new Date()
    });

    // Check if game is complete
    const allPlayersGuessed = game.guesses.length === 2;
    const maxMessagesReached = game.messages.length >= config.maxMessagesPerGame;

    if (allPlayersGuessed || maxMessagesReached) {
      game.status = 'completed';
      game.endTime = new Date();

      // Calculate results
      const correct = guessedAI === game.isAIOpponent;
      const score = calculateScore(
        game.isAIOpponent,
        correct,
        game.messages.length
      );

      // Update player stats
      const user = await User.findById(playerId);
      if (user) {
        user.stats.gamesPlayed += 1;
        if (correct) {
          user.stats.correctGuesses += 1;
          user.stats.gamesWon += 1;
        }
        user.stats.totalPoints += score;
        await user.save();
      }

      await game.save();
      return { gameComplete: true, score, correct };
    }

    await game.save();
    return { gameComplete: false };
  }
} 