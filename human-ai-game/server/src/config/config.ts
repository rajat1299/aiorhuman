import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
const result = dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

if (result.error) {
  console.error('Error loading .env file:', result.error);
  throw result.error;
}

// Log the environment variables (remove in production)
console.log('Environment variables loaded:', {
  MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
  JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set' : 'Not set'
});

interface Config {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  openaiApiKey: string;
  environment: 'development' | 'production' | 'test';
  corsOrigin: string;
  sessionTimeout: number;
  matchmakingTimeout: number;
  maxMessagesPerGame: number;
}

const config: Config = {
  port: parseInt(process.env.PORT || '3000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/human-ai-game',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  environment: (process.env.NODE_ENV as Config['environment']) || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '1800000', 10), // 30 minutes in milliseconds
  matchmakingTimeout: parseInt(process.env.MATCHMAKING_TIMEOUT || '10000', 10), // 10 seconds
  maxMessagesPerGame: parseInt(process.env.MAX_MESSAGES_PER_GAME || '10', 10),
};

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'OPENAI_API_KEY', 'MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

export default config;
