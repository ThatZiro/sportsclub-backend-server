import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
} from '../api/middleware/errorHandler';
import { appLogger } from '../config/logger';

describe('Error Handling - Simple Tests', () => {
  describe('Custom Error Classes', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError('Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('Error');
    });

    it('should create ValidationError with 400 status', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should create AuthenticationError with 401 status', () => {
      const error = new AuthenticationError();

      expect(error.message).toBe('Authentication failed');
      expect(error.statusCode).toBe(401);
      expect(error.isOperational).toBe(true);
    });

    it('should create AuthorizationError with 403 status', () => {
      const error = new AuthorizationError();

      expect(error.message).toBe('Insufficient permissions');
      expect(error.statusCode).toBe(403);
      expect(error.isOperational).toBe(true);
    });

    it('should create NotFoundError with 404 status', () => {
      const error = new NotFoundError('User');

      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.isOperational).toBe(true);
    });

    it('should create ConflictError with 409 status', () => {
      const error = new ConflictError('Resource already exists');

      expect(error.message).toBe('Resource already exists');
      expect(error.statusCode).toBe(409);
      expect(error.isOperational).toBe(true);
    });
  });

  describe('Logger Configuration', () => {
    it('should have logger instance available', () => {
      expect(appLogger).toBeDefined();
      expect(typeof appLogger.error).toBe('function');
      expect(typeof appLogger.info).toBe('function');
      expect(typeof appLogger.warn).toBe('function');
      expect(typeof appLogger.debug).toBe('function');
    });

    it('should be able to log messages', () => {
      // This test just ensures the logger doesn't throw errors
      expect(() => {
        appLogger.info('Test info message');
        appLogger.error('Test error message');
        appLogger.warn('Test warning message');
        appLogger.debug('Test debug message');
      }).not.toThrow();
    });
  });
});
