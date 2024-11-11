import { Request, Response, NextFunction, Router, RequestHandler } from 'express';
import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
      method: string;
      path: string;
      body: any;
      json: any;
    }
  }
}

export interface AuthRequest extends Request {
  user?: IUser;
  token?: string;
  body: any;
}

// Don't export express types, use them directly from 'express'