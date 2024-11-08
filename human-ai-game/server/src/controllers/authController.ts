import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { generateUsername } from '../utils/userUtils';
import { jwtConfig } from '../config/jwt';
import { AuthRequest } from '../types/express';

export const autoLogin = async (req: Request, res: Response) => {
  try {
    console.log('Auto-login request received');
    
    // Generate a random username
    const username = generateUsername();
    console.log('Generated username:', username);

    // Create a temporary email and password for auto-login users
    const tempEmail = `${username}@temp.com`;
    const tempPassword = Math.random().toString(36).slice(-8);

    // Create new user with temporary credentials
    const user = new User({
      username,
      email: tempEmail,
      password: tempPassword,
      stats: {
        totalGames: 0,
        gamesWon: 0,
        correctGuesses: 0,
        successfulDeceptions: 0,
        winRate: 0,
        totalPoints: 0,
        averagePoints: 0
      },
      lastActive: new Date()
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username 
      },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        stats: user.stats
      }
    });

  } catch (error) {
    console.warn('Auto-login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during auto-login',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        stats: user.stats,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get profile' 
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update allowed fields
    const allowedUpdates = ['username', 'email'];
    const updates = Object.keys(req.body)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {} as Partial<typeof User.prototype>);

    Object.assign(user, updates);
    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        stats: user.stats,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update profile' 
    });
  }
};

