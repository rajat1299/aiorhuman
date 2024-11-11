// src/types/index.d.ts

import * as express from 'express';

// Define IUser interface here instead of importing it
interface IUser {
  _id: string;
  username: string;
  email: string;
  stats: {
    totalGames: number;
    gamesWon: number;
    correctGuesses: number;
    successfulDeceptions: number;
    winRate: number;
    totalPoints: number;
    averagePoints: number;
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      token?: string;
    }
  }
}
