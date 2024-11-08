import { Socket } from 'socket.io';
import { IUser } from '../models/User';
import { GameService } from './gameService';

export class GameEvents {
  constructor(private gameService: GameService) {}

  handleEvents(socket: Socket, user: IUser) {
    // Game state events
    socket.on('game:ready', () => this.handleReady(socket, user));
    socket.on('game:typing', () => this.handleTyping(socket));
    socket.on('game:stop-typing', () => this.handleStopTyping(socket));
    socket.on('game:forfeit', () => this.handleForfeit(socket, user));
    socket.on('game:report', (reason: string) => this.handleReport(socket, user, reason));
  }

  private handleReady(socket: Socket, user: IUser) {
    // Notify opponent that player is ready
    const sessionId = this.gameService.getPlayerSession(socket.id);
    if (sessionId) {
      socket.to(sessionId).emit('game:opponent-ready');
    }
  }

  private handleTyping(socket: Socket) {
    const sessionId = this.gameService.getPlayerSession(socket.id);
    if (sessionId) {
      socket.to(sessionId).emit('game:opponent-typing');
    }
  }

  private handleStopTyping(socket: Socket) {
    const sessionId = this.gameService.getPlayerSession(socket.id);
    if (sessionId) {
      socket.to(sessionId).emit('game:opponent-stop-typing');
    }
  }

  private async handleForfeit(socket: Socket, user: IUser) {
    const sessionId = this.gameService.getPlayerSession(socket.id);
    if (sessionId) {
      await this.gameService.endGameByForfeit(sessionId, user._id);
    }
  }

  private async handleReport(socket: Socket, user: IUser, reason: string) {
    const sessionId = this.gameService.getPlayerSession(socket.id);
    if (sessionId) {
      // TODO: Implement report handling
      console.log(`Report from ${user.username} in session ${sessionId}: ${reason}`);
    }
  }
} 