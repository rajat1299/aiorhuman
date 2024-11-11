import { IUser } from '../models/User';

// Only augment Express namespace, don't export anything
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