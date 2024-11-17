import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User';
import { Game } from '../models/Game';
import { generateToken } from '../utils/userUtils';

describe('Game Controller', () => {
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testplayer',
      stats: {
        gamesPlayed: 5,
        gamesWon: 3,
        correctGuesses: 4,
        successfulDeceptions: 2,
        totalPoints: 500
      }
    });
    authToken = generateToken(testUser._id.toString());
  });

  describe('GET /api/game/history', () => {
    it('should return user game history', async () => {
      // Create some test games
      await Game.create({
        sessionId: 'TEST123456',
        player1Id: testUser._id,
        player2Id: 'AI',
        isAIOpponent: true,
        status: 'completed',
        messages: [],
        guesses: [],
        startTime: new Date(),
        endTime: new Date()
      });

      const response = await request(app)
        .get('/api/game/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.games).toHaveLength(1);
      expect(response.body.data.games[0].sessionId).toBe('TEST123456');
    });
  });

  describe('GET /api/game/stats', () => {
    it('should return user stats', async () => {
      const response = await request(app)
        .get('/api/game/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats).toEqual({
        gamesPlayed: 5,
        gamesWon: 3,
        correctGuesses: 4,
        successfulDeceptions: 2,
        totalPoints: 500
      });
    });
  });
}); 