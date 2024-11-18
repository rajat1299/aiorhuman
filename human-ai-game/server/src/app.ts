import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config/config';
import { errorHandler } from './middleware/errorHandler';
import { ApiError } from './utils/ApiError';
import routes from './routes';
import { setupSocketIO } from './socket';

// Initialize express app
const app = express();
const httpServer = createServer(app);

// Connect to MongoDB with more detailed error logging
mongoose.connect(config.mongodbUri!, { 
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
})
.then(() => {
  console.log('Connected to MongoDB');
  console.log('Database connection string:', config.mongodbUri!.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Logs URI with hidden password
})
.catch((err) => {
  console.error('MongoDB connection error details:', {
    name: err.name,
    message: err.message,
    code: err.code,
    codeName: err.codeName,
    ...(err.reason && { reason: err.reason }),
    ...(err.errmsg && { errmsg: err.errmsg })
  });
  process.exit(1);
});

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  upgradeTimeout: 10000,
  cookie: false
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path} [${new Date().toISOString()}]`);
  next();
});

// Routes
app.use('/api', routes);

// Setup Socket.IO handlers
setupSocketIO(io);

// 404 handler
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, 'Resource not found'));
});

// Error handling
app.use(errorHandler);

export { app, httpServer }; 