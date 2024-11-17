import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/userUtils';
import { MatchmakingService } from '../services/MatchmakingService';
import { AIService } from '../services/AIService';
import { GameController } from '../controllers/gameController';
import { Game, IGame } from '../models/Game';
import mongoose from 'mongoose';
import { config } from '../config/config';
import { User } from '../models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

interface GuessResult {
  gameComplete: boolean;
  score?: number;
  correct: boolean;
  wasFirst: boolean;
  fooledOpponent: boolean;
}

const MAX_MESSAGES_BEFORE_GUESS = 8;

export const setupSocketIO = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        console.error('No token provided');
        return next(new Error('Authentication error'));
      }

      const decoded = verifyToken(token);
      socket.userId = decoded.userId;
      console.log('Socket authenticated for user:', socket.userId);
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join game queue
    socket.on('join-queue', async () => {
      try {
        if (!socket.userId) {
          console.error('User not authenticated');
          throw new Error('Not authenticated');
        }
        
        console.log(`Player ${socket.userId} joining queue`);
        const matchmaking = MatchmakingService.getInstance();
        await matchmaking.addToQueue(socket.userId, socket);
        
        // Emit queue status to all players in queue
        const queueStatus = matchmaking.getQueueStatus();
        console.log('Queue status:', queueStatus);
        io.emit('queue-status', queueStatus);
      } catch (error) {
        console.error('Join queue error:', error);
        socket.emit('error', { message: 'Failed to join queue' });
      }
    });

    // Leave game queue
    socket.on('leave-queue', () => {
      if (!socket.userId) return;
      
      const matchmaking = MatchmakingService.getInstance();
      matchmaking.removeFromQueue(socket.userId);
    });

    // Handle sending messages
    socket.on('send-message', async (data: {
      sessionId: string;
      content: string;
    }) => {
      try {
        const game = await Game.findOne({ sessionId: data.sessionId });
        if (!game) throw new Error('Game not found');

        // Add message to game
        game.messages.push({
          senderId: socket.userId!,
          content: data.content,
          timestamp: new Date()
        });

        // Check if it's an AI game and message count threshold is reached
        if (game.isAIOpponent && 
            game.messages.length >= MAX_MESSAGES_BEFORE_GUESS && 
            !game.guesses.some(g => g.playerId === 'AI')) {
          
          // AI makes a guess
          const aiService = new AIService();
          const aiGuess = await aiService.makeGuess(game);
          
          game.guesses.push({
            playerId: 'AI',
            guessedAI: aiGuess,
            timestamp: new Date()
          });

          // Notify player that AI has made its guess
          io.to(data.sessionId).emit('opponent-made-guess');
        }

        await game.save();

        // Broadcast message to room
        io.to(data.sessionId).emit('new-message', {
          senderId: socket.userId,
          content: data.content,
          timestamp: new Date()
        });

        // If AI opponent, generate response
        if (game.isAIOpponent && game.player2Id === 'AI') {
          socket.emit('opponent-typing');
          
          const aiService = new AIService();
          const { content: aiResponse, delay } = await aiService.generateResponse(game);
          
          // Wait for the calculated delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          game.messages.push({
            senderId: 'AI',
            content: aiResponse,
            timestamp: new Date(),
            isAI: true
          });
          await game.save();

          io.to(data.sessionId).emit('new-message', {
            senderId: 'AI',
            content: aiResponse,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error('Message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Make guess
    socket.on('make-guess', async (data: {
      sessionId: string;
      guessedAI: boolean;
    }) => {
      try {
        if (!socket.userId) throw new Error('Not authenticated');

        const game = await Game.findOne({ sessionId: data.sessionId }).exec();
        if (!game) throw new Error('Game not found');
        
        const result = await GameController.updateGameState(
          game._id?.toString() ?? '',
          socket.userId,
          data.guessedAI
        ) as GuessResult;

        if (result.gameComplete) {
          // Get opponent's guess
          const opponentGuess = game.guesses.find(g => g.playerId !== socket.userId);
          const playerGuess = game.guesses.find(g => g.playerId === socket.userId);

          // For AI opponent, player2Correct should be false if AI guessed AI for a human player
          const player2IsCorrect = game.isAIOpponent ? 
            (opponentGuess?.guessedAI === false) : // AI's guess should match player's true nature (not AI)
            (opponentGuess?.guessedAI === game.isAIOpponent);

          io.to(data.sessionId).emit('game-ended', {
            winner: result.correct ? socket.userId : null,
            score: result.score,
            stats: {
              messageCount: game.messages.length,
              duration: Math.floor((Date.now() - game.createdAt.getTime()) / 1000),
              player1Correct: result.correct,
              player2Correct: player2IsCorrect, // Use the corrected logic
              guesses: {
                player: {
                  guessedAI: data.guessedAI,
                  timestamp: new Date()
                },
                opponent: opponentGuess ? {
                  guessedAI: opponentGuess.guessedAI,
                  timestamp: opponentGuess.timestamp
                } : undefined
              },
              isAIOpponent: game.isAIOpponent
            }
          });
        }
      } catch (error) {
        console.error('Make guess error:', error);
        socket.emit('error', { message: 'Failed to submit guess' });
      }
    });

    // Join game room
    socket.on('join-game', (sessionId: string) => {
      socket.join(sessionId);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (!socket.userId) return;
      
      const matchmaking = MatchmakingService.getInstance();
      matchmaking.removeFromQueue(socket.userId);
      console.log(`User disconnected: ${socket.userId}`);
    });

    // Add to existing socket handlers
    socket.on('get-leaderboard', async (timeframe: 'all' | 'monthly' | 'weekly') => {
      try {
        const leaderboardData = await User.aggregate([
          {
            $project: {
              username: 1,
              totalPoints: '$stats.totalPoints',
              winRate: {
                $multiply: [
                  { $cond: [
                    { $eq: ['$stats.gamesPlayed', 0] },
                    0,
                    { $divide: ['$stats.gamesWon', '$stats.gamesPlayed'] }
                  ]},
                  100
                ]
              },
              gamesPlayed: '$stats.gamesPlayed',
              correctGuesses: '$stats.correctGuesses',
              successfulDeceptions: '$stats.successfulDeceptions'
            }
          },
          { $sort: { totalPoints: -1 } }
        ]);

        // Get user's rank
        const userRank = leaderboardData.findIndex(entry => entry._id.toString() === socket.userId) + 1;

        socket.emit('leaderboard-update', {
          global: leaderboardData.map((entry, index) => ({
            ...entry,
            rank: index + 1
          })),
          userRank: {
            rank: userRank,
            total: leaderboardData.length
          },
          timeframe
        });
      } catch (error) {
        console.error('Leaderboard error:', error);
        socket.emit('error', { message: 'Failed to fetch leaderboard' });
      }
    });

    socket.on('get-profile', async () => {
      try {
        const user = await User.findById(socket.userId);
        if (!user) throw new Error('User not found');

        socket.emit('profile-update', {
          username: user.username,
          stats: {
            totalGames: user.stats.gamesPlayed,
            gamesWon: user.stats.gamesWon,
            winRate: user.stats.gamesPlayed ? 
              (user.stats.gamesWon / user.stats.gamesPlayed * 100).toFixed(1) : 0,
            totalPoints: user.stats.totalPoints,
            correctGuesses: user.stats.correctGuesses,
            successfulDeceptions: user.stats.successfulDeceptions,
            averagePoints: user.stats.gamesPlayed ? 
              (user.stats.totalPoints / user.stats.gamesPlayed).toFixed(1) : 0
          }
        });
      } catch (error) {
        console.error('Profile error:', error);
        socket.emit('error', { message: 'Failed to fetch profile' });
      }
    });
  });
}; 