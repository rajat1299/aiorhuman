import { Request } from 'express';
import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
      body: any;
      headers: {
        authorization?: string;
      };
    }
  }
}

// Export our custom interface
export interface AuthRequest extends Request {
  user?: IUser;
  token?: string;
  body: any;
}