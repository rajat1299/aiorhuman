import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUserStats {
  totalGames: number;
  gamesWon: number;
  correctGuesses: number;
  successfulDeceptions: number;
  winRate: number;
  totalPoints: number;
  averagePoints: number;
  rank?: number;
}

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  stats: IUserStats;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  stats: {
    totalGames: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    correctGuesses: { type: Number, default: 0 },
    successfulDeceptions: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    averagePoints: { type: Number, default: 0 },
    rank: { type: Number }
  }
}, { 
  timestamps: true 
});

export default mongoose.model<IUser>('User', userSchema);

