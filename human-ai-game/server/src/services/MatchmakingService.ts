import { User } from '../models/User';
import { Game } from '../models/Game';
import { ApiError } from '../utils/ApiError';
import { config } from '../config/config';
import { generateId } from '../utils/gameUtils';

interface QueuedPlayer {
  userId: string;
  joinedAt: Date;
  socket: any; // Socket.IO socket instance
}

export class MatchmakingService {
  private static instance: MatchmakingService;
  private queue: QueuedPlayer[] = [];
  private matchmakingInterval: NodeJS.Timeout;

  private constructor() {
    this.matchmakingInterval = setInterval(
      () => this.processQueue(),
      1000 // Check queue every second
    );
  }

  static getInstance(): MatchmakingService {
    if (!MatchmakingService.instance) {
      MatchmakingService.instance = new MatchmakingService();
    }
    return MatchmakingService.instance;
  }

  async addToQueue(userId: string, socket: any): Promise<void> {
    // Check if player is already in queue
    if (this.queue.some(player => player.userId === userId)) {
      throw new ApiError(400, 'Already in queue');
    }

    this.queue.push({
      userId,
      joinedAt: new Date(),
      socket
    });

    // Notify player they've joined the queue
    socket.emit('queue-status', { position: this.queue.length });
  }

  removeFromQueue(userId: string): void {
    this.queue = this.queue.filter(player => player.userId !== userId);
  }

  private async processQueue(): Promise<void> {
    // Emit current queue status to all players
    this.queue.forEach(player => {
      player.socket.emit('queue-status', this.getQueueStatus());
    });

    if (this.queue.length === 0) return;

    // Check for players waiting too long
    const now = Date.now();
    const timeoutPlayers = this.queue.filter(
      player => now - player.joinedAt.getTime() > config.matchmakingTimeout
    );

    // Create AI games for players waiting too long
    for (const player of timeoutPlayers) {
      console.log(`Creating AI game for player ${player.userId} due to timeout`);
      await this.createAIGame(player);
      this.removeFromQueue(player.userId);
    }

    // If we still have 2+ players, match them
    if (this.queue.length >= 2) {
      const [player1, player2] = this.queue.splice(0, 2);
      await this.createGame(player1, player2);
    }
  }

  private async createGame(player1: QueuedPlayer, player2: QueuedPlayer): Promise<void> {
    const sessionId = generateId();
    
    const game = new Game({
      sessionId,
      player1Id: player1.userId,
      player2Id: player2.userId,
      isAIOpponent: false,
      status: 'in_progress'
    });

    await game.save();

    // Notify both players
    const gameData = {
      sessionId,
      opponent: null // Will be populated differently for each player
    };

    const [user1, user2] = await Promise.all([
      User.findById(player1.userId),
      User.findById(player2.userId)
    ]);

    player1.socket.emit('game-started', {
      ...gameData,
      opponent: { id: user2!._id, username: user2!.username }
    });

    player2.socket.emit('game-started', {
      ...gameData,
      opponent: { id: user1!._id, username: user1!.username }
    });
  }

  private async createAIGame(player: QueuedPlayer): Promise<void> {
    const sessionId = generateId();
    
    const game = new Game({
      sessionId,
      player1Id: player.userId,
      player2Id: 'AI',
      isAIOpponent: true,
      status: 'in_progress',
      aiPersonality: this.selectRandomPersonality()
    });

    await game.save();

    player.socket.emit('game-started', {
      sessionId,
      opponent: { id: 'AI', username: 'Anonymous Player' }
    });
  }

  private selectRandomPersonality(): string {
    const personalities = ['casual-gamer', 'music-enthusiast', 'sports-fan', 'student'];
    return personalities[Math.floor(Math.random() * personalities.length)];
  }

  public getQueueStatus(): { playersInQueue: number } {
    return {
      playersInQueue: this.queue.length
    };
  }

  public async requestAIOpponent(userId: string, socket: any): Promise<void> {
    console.log(`Creating AI game for player ${userId} by request`);
    // Remove from regular queue if they're in it
    this.removeFromQueue(userId);
    
    // Create AI game immediately
    await this.createAIGame({ userId, socket, joinedAt: new Date() });
  }
} 