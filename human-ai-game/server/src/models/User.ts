import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  temporaryToken?: string;
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    correctGuesses: number;
    successfulDeceptions: number;
    totalPoints: number;
  };
  createdAt: Date;
  lastActive: Date;
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  temporaryToken: {
    type: String,
    index: true,
  },
  stats: {
    gamesPlayed: { type: Number, default: 0 },
    gamesWon: { type: Number, default: 0 },
    correctGuesses: { type: Number, default: 0 },
    successfulDeceptions: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
});

// Virtual for win rate
UserSchema.virtual('stats.winRate').get(function (this: IUser) {
  return this.stats.gamesPlayed > 0
    ? (this.stats.gamesWon / this.stats.gamesPlayed) * 100
    : 0;
});

// Virtual for average points
UserSchema.virtual('stats.averagePoints').get(function (this: IUser) {
  return this.stats.gamesPlayed > 0
    ? this.stats.totalPoints / this.stats.gamesPlayed
    : 0;
});

// Update lastActive timestamp on each interaction
UserSchema.pre('save', function (next) {
  this.lastActive = new Date();
  next();
});

export const User = mongoose.model<IUser>('User', UserSchema);
