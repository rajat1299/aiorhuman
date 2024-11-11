import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';

// Only augment the Express namespace
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
    }
  }
}

// Export our custom interface
export interface AuthRequest extends Request {
  user?: IUser;
  token?: string;
}