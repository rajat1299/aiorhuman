import User, { IUser } from '../models/User';
import { Types } from 'mongoose';

interface LeaderboardEntry {
  userId: Types.ObjectId;
  username: string;
  totalPoints: number;
  winRate: number;
  gamesPlayed: number;
  correctGuesses: number;
  successfulDeceptions: number;
  rank?: number;
}

interface LeaderboardResponse {
  global: LeaderboardEntry[];
  userRank: {
    rank: number;
    total: number;
  };
  timeframe: 'all' | 'monthly' | 'weekly';
}

export class LeaderboardService {
  private static readonly LEADERBOARD_LIMIT = 100;

  async getLeaderboard(
    userId?: string,
    timeframe: 'all' | 'monthly' | 'weekly' = 'all'
  ): Promise<LeaderboardResponse> {
    // Get date range based on timeframe
    const dateRange = this.getDateRange(timeframe);

    // Get top players
    const topPlayers = await User.find({
      'stats.totalGames': { $gt: 0 },
      ...(dateRange && { createdAt: { $gte: dateRange } })
    })
    .sort({
      'stats.totalPoints': -1,
      'stats.winRate': -1
    })
    .limit(LeaderboardService.LEADERBOARD_LIMIT)
    .select('username stats');

    // Map players to leaderboard entries
    const leaderboard = topPlayers.map((player, index) => ({
      userId: player._id,
      username: player.username,
      totalPoints: player.stats.totalPoints,
      winRate: player.stats.winRate,
      gamesPlayed: player.stats.totalGames,
      correctGuesses: player.stats.correctGuesses,
      successfulDeceptions: player.stats.successfulDeceptions,
      rank: index + 1
    }));

    // Get total number of ranked players
    const totalPlayers = await User.countDocuments({
      'stats.totalGames': { $gt: 0 },
      ...(dateRange && { createdAt: { $gte: dateRange } })
    });

    // Get requesting user's rank if userId provided
    let userRank = {
      rank: 0,
      total: totalPlayers
    };

    if (userId) {
      const userRankCount = await User.countDocuments({
        'stats.totalGames': { $gt: 0 },
        'stats.totalPoints': {
          $gt: (await User.findById(userId))?.stats.totalPoints || 0
        },
        ...(dateRange && { createdAt: { $gte: dateRange } })
      });
      userRank.rank = userRankCount + 1;
    }

    return {
      global: leaderboard,
      userRank,
      timeframe
    };
  }

  async getPlayerStats(userId: string): Promise<LeaderboardEntry | null> {
    const user = await User.findById(userId).select('username stats');
    if (!user) return null;

    const rank = await User.countDocuments({
      'stats.totalGames': { $gt: 0 },
      'stats.totalPoints': { $gt: user.stats.totalPoints }
    }) + 1;

    return {
      userId: user._id,
      username: user.username,
      totalPoints: user.stats.totalPoints,
      winRate: user.stats.winRate,
      gamesPlayed: user.stats.totalGames,
      correctGuesses: user.stats.correctGuesses,
      successfulDeceptions: user.stats.successfulDeceptions,
      rank
    };
  }

  private getDateRange(timeframe: 'all' | 'monthly' | 'weekly'): Date | null {
    switch (timeframe) {
      case 'monthly':
        return new Date(new Date().setMonth(new Date().getMonth() - 1));
      case 'weekly':
        return new Date(new Date().setDate(new Date().getDate() - 7));
      default:
        return null;
    }
  }

  // Helper method to update ranks after game completion
  async updateRanks(): Promise<void> {
    const users = await User.find({
      'stats.totalGames': { $gt: 0 }
    })
    .sort({
      'stats.totalPoints': -1,
      'stats.winRate': -1
    });

    // Batch update ranks
    const bulkOps = users.map((user, index) => ({
      updateOne: {
        filter: { _id: user._id },
        update: { $set: { 'stats.rank': index + 1 } }
      }
    }));

    if (bulkOps.length > 0) {
      await User.bulkWrite(bulkOps);
    }
  }
} 