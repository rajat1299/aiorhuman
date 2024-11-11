// src/controllers/authController.ts

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { generateUsername } from '../utils/userUtils';
import { jwtConfig } from '../config/jwt';

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
        averagePoints: 0,
      },
      lastActive: new Date(),
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
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
        stats: user.stats,
      },
    });
  } catch (error) {
    console.warn('Auto-login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during auto-login',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};


