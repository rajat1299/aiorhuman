import * as express from 'express';
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