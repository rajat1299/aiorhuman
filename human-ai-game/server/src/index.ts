import { app, httpServer } from './app';
import { config } from './config/config';
import mongoose from 'mongoose';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri || '');
    console.log('Connected to MongoDB');

    // Start the server
    httpServer.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.environment} mode`);
    });

    // Handle server shutdown
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  try {
    console.log('Starting graceful shutdown...');
    
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    // Close HTTP server
    httpServer.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });

    // Force close after 10s
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

startServer();
