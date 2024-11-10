import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request type
interface AuthRequest extends Request {
  user?: any;
  headers: {
    authorization?: string;
  };
}

export const verifyToken = (token: string): any => {
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set');
      return null;
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('No Authorization header');
      return res.status(401).json({ error: 'No Authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      console.log('Token verification failed');
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = decoded;
    return next();
  } catch (error) {
    console.error('Authentication failed:', error);
    return res.status(401).json({ error: 'Please authenticate.' });
  }
};

export { AuthRequest };
export const authMiddleware = auth;
