// src/types/index.d.ts

import { Request } from 'express';

// Define IUser interface with required fields
interface IUser {
  _id: string;  // Required field
  username: string;  // Required field
  email: string;  // Required field
  stats: {
    totalGames: number;
    gamesWon: number;
    correctGuesses: number;
    successfulDeceptions: number;
    winRate: number;
    totalPoints: number;
    averagePoints: number;
  };
  lastActive?: Date;  // Optional field
}

// Augment Express Request
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

// Export interfaces
export interface AuthRequest extends Request {
  user?: IUser;
  token?: string;
}

export type { IUser };  // Export IUser type for use in other files
