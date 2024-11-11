import { Request, Response, NextFunction, Router, RequestHandler } from 'express';
import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
      method: string;
      path: string;
    }
  }
}

export interface AuthRequest extends Request {
  user?: IUser;
  token?: string;
}

// Export express types that we need
export type { Request, Response, NextFunction, Router, RequestHandler };