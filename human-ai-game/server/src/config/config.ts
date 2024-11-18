import dotenv from 'dotenv';

// Try to load .env file, but don't fail if it doesn't exist
try {
  dotenv.config();
} catch (error) {
  console.log('No .env file found');
}

// Use environment variables with fallbacks
export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'production',
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  openaiApiKey: process.env.OPENAI_API_KEY,
  corsOrigin: process.env.CORS_ORIGIN || 'https://aiorhuman-six.vercel.app',
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '1800000'),
  matchmakingTimeout: parseInt(process.env.MATCHMAKING_TIMEOUT || '10000'),
  maxMessagesPerGame: parseInt(process.env.MAX_MESSAGES_PER_GAME || '10')
};

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'OPENAI_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
