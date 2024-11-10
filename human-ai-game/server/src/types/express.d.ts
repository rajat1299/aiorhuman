import { Request, Response } from 'express';
import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
    }
  }
}

export interface AuthRequest extends Request {
  user?: IUser;
  token?: string;
  body: {
    [key: string]: any;
  };
} 