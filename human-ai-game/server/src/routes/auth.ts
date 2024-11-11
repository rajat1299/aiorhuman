// src/routes/auth.ts

import express from 'express';
import { autoLogin } from '../controllers/authController';
import { auth } from '../middleware/auth';
import type { Request, Response } from 'express';
import { AuthRequest } from '../types/custom';

const router = express.Router();

router.post('/auto-login', autoLogin);

// Define profile endpoints directly here since they're not exported from authController
router.get('/profile', auth, async (req: AuthRequest, res: Response) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/profile', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }
    // Add profile update logic here
    res.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

