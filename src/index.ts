/**
 * Main Application Entry Point
 * Starts the Express server with database connection
 */

import dotenv from 'dotenv';
import app from './app';
import { PrismaClient } from '@prisma/client';
import { appLogger } from './config/logger';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Server configuration
const PORT = process.env['PORT'] || 3000;
const NODE_ENV = process.env['NODE_ENV'] || 'development';

// Graceful shutdown handler
const gracefulShutdown = async (signal: string): Promise<void> => {
  appLogger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    // Close database connection
    await prisma.$disconnect();
    appLogger.info('Database connection closed.');

    // Exit process
    process.exit(0);
  } catch (error) {
    appLogger.error('Error during graceful shutdown', undefined, {
      error: (error as Error).message,
    });
    process.exit(1);
  }
};

// Start server
const startServer = async (): Promise<any> => {
  try {
    // Test database connection
    await prisma.$connect();
    appLogger.info('Database connected successfully');

    // Start HTTP server
    const server = app.listen(PORT, () => {
      appLogger.info(`Server running on port ${PORT}`);
      appLogger.info(`API Documentation: http://localhost:${PORT}/docs`);
      appLogger.info(`Environment: ${NODE_ENV}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    appLogger.error('Failed to start server', undefined, {
      error: (error as Error).message,
    });
    process.exit(1);
  }
};

// Start the application
if (require.main === module) {
  startServer();
}

export default app;
