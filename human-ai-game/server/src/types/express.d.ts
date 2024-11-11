import { IUser } from '../models/User';

// Only augment Express namespace
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
export interface AuthRequest extends Express.Request {
  user?: IUser;
  token?: string;
  body: any;
}