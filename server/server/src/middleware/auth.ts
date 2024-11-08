import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import User from '../models/User';
import { AuthRequest } from '../types/express';

export const verifyToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, jwtConfig.secret) as { userId: string };
    const user = await User.findById(decoded.userId);
    if (!user) {
      return null;
    }
    
    // Update last active timestamp
    user.lastActive = new Date();
    await user.save();
    
    return user;
  } catch (error) {
    return null;
  }
};

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const user = await verifyToken(token);
    if (!user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.user = user;
    req.token = token;
    next();
    return;
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ error: 'Authentication failed' });
    return;
  }
};

export const socketAuthMiddleware = async (socket: any, next: (err?: Error) => void): Promise<void> => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      next(new Error('Authentication error'));
      return;
    }

    const user = await verifyToken(token);
    if (!user) {
      next(new Error('Invalid token'));
      return;
    }

    socket.user = user;
    next();
    return;
  } catch (error) {
    next(new Error('Authentication error'));
    return;
  }
};
