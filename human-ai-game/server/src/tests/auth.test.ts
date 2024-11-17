import request from 'supertest';
import { app } from '../app';
import { User } from '../models/User';
import { generateToken } from '../utils/userUtils';

describe('Auth Controller', () => {
  describe('POST /api/auth/auto-login', () => {
    it('should create a temporary user and return token', async () => {
      const response = await request(app)
        .post('/api/auth/auto-login')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.username).toMatch(/^player_[a-z0-9]{8}$/);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile when authenticated', async () => {
      // Create a test user
      const user = await User.create({
        username: 'testuser',
        stats: {
          gamesPlayed: 0,
          gamesWon: 0,
          correctGuesses: 0,
          successfulDeceptions: 0,
          totalPoints: 0
        }
      });

      const token = generateToken(user._id.toString());

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('testuser');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app)
        .get('/api/auth/profile')
        .expect(401);
    });
  });
}); 