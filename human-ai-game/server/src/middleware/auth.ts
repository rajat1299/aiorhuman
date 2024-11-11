// src/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('No Authorization header');
      res.status(401).json({ error: 'No Authorization header' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.log('No token provided');
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not set');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    if (!decoded) {
      console.log('Token verification failed');
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication failed:', error);
    res.status(401).json({ error: 'Please authenticate.' });
  }
};
