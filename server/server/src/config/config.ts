import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  clientUrl: string;
}

export const config: Config = {
  port: Number(process.env.PORT) || 5001,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/human-ai-game',
  jwtSecret: process.env.JWT_SECRET || 'your-secure-jwt-secret-key-here',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
};
