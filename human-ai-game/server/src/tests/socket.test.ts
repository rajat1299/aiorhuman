import { Server } from 'socket.io';
import { Socket as ClientSocket } from 'socket.io-client';
import { User } from '../models/User';
import { Game } from '../models/Game';
import { createTestServer, createSocketClient, waitForEvent } from './helpers/socketHelper';
import { setupSocketIO } from '../socket';

describe('Socket.IO Integration', () => {
  let server: Server;
  let serverAddress: string;
  let cleanup: () => Promise<void>;
  let player1Socket: ClientSocket;
  let player2Socket: ClientSocket;
  let player1: any;
  let player2: any;

  beforeAll(async () => {
    const setup = await createTestServer();
    server = setup.server;
    serverAddress = setup.serverAddress;
    cleanup = setup.cleanup;
    setupSocketIO(server);
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    // Create test users
    player1 = await User.create({
      username: 'player1',
      stats: { gamesPlayed: 0, gamesWon: 0, correctGuesses: 0, successfulDeceptions: 0, totalPoints: 0 }
    });
    player2 = await User.create({
      username: 'player2',
      stats: { gamesPlayed: 0, gamesWon: 0, correctGuesses: 0, successfulDeceptions: 0, totalPoints: 0 }
    });

    // Create socket connections
    player1Socket = await createSocketClient(serverAddress, player1._id.toString());
    player2Socket = await createSocketClient(serverAddress, player2._id.toString());
  });

  afterEach(async () => {
    player1Socket.close();
    player2Socket.close();
  });

  describe('Matchmaking', () => {
    it('should match two players and start a game', async () => {
      // Join queue
      player1Socket.emit('join-queue');
      player2Socket.emit('join-queue');

      // Wait for game-started events
      const [player1Game, player2Game] = await Promise.all([
        waitForEvent(player1Socket, 'game-started'),
        waitForEvent(player2Socket, 'game-started')
      ]);

      expect(player1Game.sessionId).toBeDefined();
      expect(player2Game.sessionId).toBeDefined();
      expect(player1Game.sessionId).toBe(player2Game.sessionId);

      // Verify game was created in database
      const game = await Game.findOne({ sessionId: player1Game.sessionId });
      expect(game).toBeDefined();
      expect(game!.player1Id).toBe(player1._id.toString());
      expect(game!.player2Id).toBe(player2._id.toString());
    });

    it('should create AI game when waiting too long', async () => {
      player1Socket.emit('join-queue');
      
      const gameStarted = await waitForEvent(player1Socket, 'game-started', 12000);
      
      expect(gameStarted.sessionId).toBeDefined();
      expect(gameStarted.opponent.id).toBe('AI');

      const game = await Game.findOne({ sessionId: gameStarted.sessionId });
      expect(game).toBeDefined();
      expect(game!.isAIOpponent).toBe(true);
    });
  });

  describe('Game Communication', () => {
    let gameSession: any;

    beforeEach(async () => {
      // Create a test game
      gameSession = await Game.create({
        sessionId: 'TEST123456',
        player1Id: player1._id,
        player2Id: player2._id,
        isAIOpponent: false,
        status: 'in_progress',
        messages: [],
        guesses: []
      });

      // Join game room
      player1Socket.emit('join-game', gameSession.sessionId);
      player2Socket.emit('join-game', gameSession.sessionId);
    });

    it('should handle message exchange between players', async () => {
      // Player 1 sends message
      player1Socket.emit('send-message', {
        sessionId: gameSession.sessionId,
        content: 'Hello there!'
      });

      // Player 2 should receive the message
      const message = await waitForEvent(player2Socket, 'new-message');
      expect(message.content).toBe('Hello there!');
      expect(message.senderId).toBe(player1._id.toString());

      // Check database
      const game = await Game.findOne({ sessionId: gameSession.sessionId });
      expect(game!.messages).toHaveLength(1);
      expect(game!.messages[0].content).toBe('Hello there!');
    });

    it('should handle game completion when both players guess', async () => {
      // Both players make guesses
      player1Socket.emit('make-guess', {
        sessionId: gameSession.sessionId,
        guessedAI: false
      });

      player2Socket.emit('make-guess', {
        sessionId: gameSession.sessionId,
        guessedAI: false
      });

      // Wait for game-ended event
      const gameEnded = await waitForEvent(player1Socket, 'game-ended');
      expect(gameEnded.score).toBeDefined();

      // Verify game status in database
      const game = await Game.findOne({ sessionId: gameSession.sessionId });
      expect(game!.status).toBe('completed');
      expect(game!.guesses).toHaveLength(2);
    });
  });
}); 