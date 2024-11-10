import { Request, Response, NextFunction, Router, RequestHandler } from 'express';
import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
      header(name: string): string | undefined;
      body: any;
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

export type { Request, Response, NextFunction, Router, RequestHandler }; 