import { customAlphabet } from 'nanoid';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { User, IUser } from '../models/User';
import mongoose from 'mongoose';

// Create a custom nanoid instance for username generation
const generateId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);

export const generateUsername = async (): Promise<string> => {
  let username: string;
  let isUnique = false;

  while (!isUnique) {
    username = `player_${generateId()}`;
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      isUnique = true;
      return username;
    }
  }

  throw new Error('Could not generate unique username');
};

export const generateToken = (userId: string): string => {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '24h' });
};

export const verifyToken = (token: string): { userId: string } => {
  if (!config.jwtSecret) {
    throw new Error('JWT_SECRET is not defined');
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (typeof decoded === 'string' || !('userId' in decoded)) {
      throw new Error('Invalid token payload');
    }
    return { userId: decoded.userId };
  } catch (error) {
    throw new Error('Invalid token');
  }
};

export const createTemporaryUser = async (): Promise<{
  user: IUser;
  token: string;
}> => {
  const username = await generateUsername();
  const user = await User.create({
    username,
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      correctGuesses: 0,
      successfulDeceptions: 0,
      totalPoints: 0
    }
  }) as IUser & { _id: mongoose.Types.ObjectId };

  const token = generateToken(user._id.toString());
  await User.findByIdAndUpdate(user._id, { temporaryToken: token });

  return { user, token };
};
