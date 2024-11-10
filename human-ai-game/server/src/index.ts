import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import { config } from 'dotenv';
import { GameService } from './services/gameService';
import { verifyToken, authMiddleware } from './middleware/auth';
import { autoLogin, getProfile, updateProfile } from './controllers/authController';
import { AuthRequest } from './types/express';
import { requestLogger } from './middleware/logging';

config();

const app = express();
const httpServer = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://aiorhuman-six.vercel.app'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(requestLogger);

// Create Socket.IO server with CORS config
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 
      ['https://aiorhuman-six.vercel.app'],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["my-custom-header", "Content-Type", "Authorization"],
  }
});

// Group all auth routes
const router = express.Router();
app.use('/auth', router);

// Public auth routes
router.post('/auto-login', autoLogin);

// Protected auth routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

// Initialize game service
const gameService = new GameService(io);

// Socket authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const user = await verifyToken(token);
    if (!user) {
      return next(new Error('Invalid token'));
    }

    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// Socket connection handling
io.on('connection', async (socket) => {
  try {
    const user = socket.data.user;
    if (!user) {
      socket.disconnect();
      return;
    }

    await gameService.handleConnection(socket, user);
  } catch (error) {
    console.error('Socket connection error:', error);
    socket.disconnect();
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    const PORT = process.env.PORT || 5001;
    httpServer.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('MongoDB connection error:', error);
    console.error('Connection string:', process.env.MONGODB_URI?.replace(/\/\/.*@/, '//<credentials>@'));
    process.exit(1);
  });

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
