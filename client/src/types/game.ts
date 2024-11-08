export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
}

export interface GameState {
  isPlaying: boolean;
  opponent: {
    id: string;
    isAI: boolean;
  } | null;
  messages: Message[];
  hasGuessed: boolean;
  guess: 'human' | 'ai' | null;
}

export interface GameResult {
  winner?: string;
  forfeitedBy?: string;
  error?: string;
  stats: {
    player1Correct: boolean;
    player2Correct: boolean;
    duration: number;
    messageCount: number;
  };
} 