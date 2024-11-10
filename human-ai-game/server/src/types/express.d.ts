import { Request } from 'express';
import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
      body: any;
      header(name: string): string | undefined;
    }
  }
}

export interface AuthRequest extends Request {
  user?: IUser;
  token?: string;
  body: {
    [key: string]: any;
  };
  header(name: string): string | undefined;
} 