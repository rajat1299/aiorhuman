import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  senderId: string;
  content: string;
  timestamp: Date;
  isAI?: boolean;
}

export interface IGuess {
  playerId: string;
  guessedAI: boolean;
  timestamp: Date;
}

export interface IGame extends Document {
  sessionId: string;
  player1Id: string;
  player2Id: string;
  isAIOpponent: boolean;
  aiPersonality?: string;
  status: 'waiting' | 'in_progress' | 'completed';
  messages: IMessage[];
  guesses: IGuess[];
  player1Guess?: boolean;
  player2Guess?: boolean;
  winner?: string;
  createdAt: Date;
  updatedAt: Date;
  endTime?: Date;
  score?: number;
  guessingPhase: boolean;
}

const GameSchema = new Schema<IGame>({
  sessionId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  player1Id: { 
    type: String, 
    required: true,
    ref: 'User'
  },
  player2Id: { 
    type: String, 
    required: true,
    ref: 'User'
  },
  isAIOpponent: { 
    type: Boolean, 
    default: false 
  },
  aiPersonality: { 
    type: String 
  },
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'completed'],
    default: 'waiting'
  },
  messages: [{
    senderId: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    isAI: { type: Boolean, default: false }
  }],
  guesses: [{
    playerId: { type: String, required: true },
    guessedAI: { type: Boolean, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  player1Guess: { type: Boolean },
  player2Guess: { type: Boolean },
  winner: { 
    type: String,
    ref: 'User'
  },
  endTime: { type: Date },
  score: { type: Number },
  guessingPhase: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true
});

// Index for quick lookups
GameSchema.index({ sessionId: 1 });
GameSchema.index({ player1Id: 1, player2Id: 1 });
GameSchema.index({ status: 1 });

export const Game = mongoose.model<IGame>('Game', GameSchema); 