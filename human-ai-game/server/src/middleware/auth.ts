import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/userUtils';
import { AuthenticationError } from '../utils/errors';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    next(new AuthenticationError('Invalid or expired token'));
  }
};
