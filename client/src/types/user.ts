export interface User {
  id: string;
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
    rank?: number;
  };
  lastActive: Date;
} 