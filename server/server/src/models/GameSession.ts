import mongoose, { Document, Schema, Types } from 'mongoose';
import { IUser } from './User';

export interface IMessage {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
}

interface IGameStats {
  duration: number;
  messageCount: number;
  player1Correct: boolean;
  player2Correct: boolean;
}

interface IGuess {
  playerId: string;
  guess: 'human' | 'ai';
  timestamp: Date;
}

export interface IGameSession extends Document {
  sessionId: string;
  player1: {
    userId: Types.ObjectId;
    isAI: boolean;
  };
  player2: {
    userId: Types.ObjectId;
    isAI: boolean;
  };
  status: 'active' | 'completed' | 'abandoned';
  startTime: Date;
  endTime?: Date;
  messages: IMessage[];
  player1Guess?: 'human' | 'ai';
  player2Guess?: 'human' | 'ai';
  player1Points?: number;
  player2Points?: number;
  stats: IGameStats;
  guesses: IGuess[];
  winner?: Types.ObjectId;
}

const gameSessionSchema = new Schema<IGameSession>({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  player1: {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isAI: { type: Boolean, default: false }
  },
  player2: {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isAI: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  messages: [{
    id: String,
    content: String,
    senderId: String,
    timestamp: Date
  }],
  player1Guess: { type: String, enum: ['human', 'ai'] },
  player2Guess: { type: String, enum: ['human', 'ai'] },
  player1Points: { type: Number },
  player2Points: { type: Number },
  stats: {
    duration: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
    player1Correct: { type: Boolean },
    player2Correct: { type: Boolean }
  },
  guesses: [{
    playerId: String,
    guess: { type: String, enum: ['human', 'ai'] },
    timestamp: Date
  }],
  winner: { type: Schema.Types.ObjectId, ref: 'User' }
});

// Calculate stats before saving
gameSessionSchema.pre('save', function(next) {
  if (this.status === 'completed' && this.endTime) {
    // Calculate duration in seconds
    this.stats.duration = Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000);
    this.stats.messageCount = this.messages.length;

    // Calculate correctness of guesses
    const player1Guess = this.guesses.find(g => g.playerId === this.player1.userId.toString());
    const player2Guess = this.guesses.find(g => g.playerId === this.player2.userId.toString());

    if (player1Guess && player2Guess) {
      this.stats.player1Correct = player1Guess.guess === (this.player2.isAI ? 'ai' : 'human');
      this.stats.player2Correct = player2Guess.guess === (this.player1.isAI ? 'ai' : 'human');

      // Determine winner
      if (this.stats.player1Correct && !this.stats.player2Correct) {
        this.winner = this.player1.userId;
      } else if (!this.stats.player1Correct && this.stats.player2Correct) {
        this.winner = this.player2.userId;
      }
      // If both correct or both wrong, no winner is set
    }
  }
  next();
});

export default mongoose.model<IGameSession>('GameSession', gameSessionSchema); 