import express from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '../middleware/auth';
import { AuthRequest, Response } from '../types/express';

const router = express.Router();

router.post('/auto-login', async (req: AuthRequest, res: Response) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not set');
    }

    console.log('Auto-login request received');
    const username = `Player_${Math.random().toString(36).substr(2, 6)}`;
    const userId = uuidv4();

    const token = jwt.sign(
      { id: userId, username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Generated username:', username);
    res.json({ 
      success: true, 
      token, 
      user: { 
        id: userId, 
        username,
        stats: {
          totalGames: 0,
          gamesWon: 0,
          correctGuesses: 0,
          successfulDeceptions: 0,
          winRate: 0,
          totalPoints: 0,
          averagePoints: 0
        }
      } 
    });
  } catch (error) {
    console.error('Auto-login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.get('/profile', auth, (req: AuthRequest, res: Response) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
