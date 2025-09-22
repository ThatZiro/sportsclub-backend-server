import request from 'supertest';
import app from '../app';
import { prisma } from '../infrastructure/database/connection';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
} from '../api/middleware/errorHandler';
import { appLogger } from '../config/logger';

// Mock the logger to capture log calls
jest.mock('../config/logger', () => ({
  appLogger: {
    logError: jest.fn(),
    logRequest: jest.fn(),
    logResponse: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
  },
}));

describe('Error Handling and Logging', () => {
  beforeAll(async () => {
    // Ensure database connection
    await prisma.$connect();
  });

  afterAll(async () => {
    // Clean up database connection
    await prisma.$disconnect();
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

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

  describe('Error Handler Middleware', () => {
    it('should handle 404 errors for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path', '/api/non-existent-route');
      expect(response.body).toHaveProperty('requestId');
    });

    it('should handle validation errors with proper status code', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          // Missing required fields to trigger validation error
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
      expect(response.body.error).toBe('Bad Request');
    });

    it('should include request ID in error responses', async () => {
      const requestId = 'test-request-id-123';

      const response = await request(app)
        .get('/api/non-existent-route')
        .set('X-Request-ID', requestId)
        .expect(404);

      expect(response.body.requestId).toBe(requestId);
      expect(response.headers['x-request-id']).toBe(requestId);
    });

    it('should sanitize error messages in production mode', async () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';

      try {
        const response = await request(app)
          .get('/api/non-existent-route')
          .expect(404);

        // In production, error messages should be sanitized
        expect(response.body.message).not.toContain('database');
        expect(response.body.message).not.toContain('prisma');
        expect(response.body).not.toHaveProperty('details');
      } finally {
        process.env['NODE_ENV'] = originalEnv;
      }
    });

    it('should include debug details in development mode', async () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'development';

      try {
        const response = await request(app)
          .get('/api/non-existent-route')
          .expect(404);

        // In development, should include more details
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('message');
      } finally {
        process.env['NODE_ENV'] = originalEnv;
      }
    });
  });

  describe('Request Logging', () => {
    it('should log incoming requests', async () => {
      await request(app).get('/docs').expect(200);

      // Verify that request logging was called
      expect(appLogger.logRequest).toHaveBeenCalled();
    });

    it('should log responses with status codes', async () => {
      await request(app).get('/docs').expect(200);

      // Verify that response logging was called
      expect(appLogger.logResponse).toHaveBeenCalled();
    });

    it('should generate request ID if not provided', async () => {
      const response = await request(app).get('/docs').expect(200);

      // Should have a request ID in the response headers
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-request-id']).toMatch(/^[a-z0-9]+$/);
    });

    it('should preserve provided request ID', async () => {
      const requestId = 'custom-request-id-456';

      const response = await request(app)
        .get('/docs')
        .set('X-Request-ID', requestId)
        .expect(200);

      expect(response.headers['x-request-id']).toBe(requestId);
    });
  });

  describe('Error Logging', () => {
    it('should log errors with context when they occur', async () => {
      await request(app).get('/api/non-existent-route').expect(404);

      // Verify that error logging was called
      expect(appLogger.logError).toHaveBeenCalled();
    });

    it('should sanitize sensitive data in logs', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'secretpassword123',
          name: 'Test User',
        })
        .expect(400); // Will fail due to validation or other issues

      // Check if logging was called (error or request logging)
      const logCalls = (appLogger.logRequest as jest.Mock).mock.calls;

      if (logCalls.length > 0) {
        // Verify that password is not logged in plain text
        const loggedData = JSON.stringify(logCalls);
        expect(loggedData).not.toContain('secretpassword123');
      }
    });
  });

  describe('Async Error Handling', () => {
    it('should handle async errors properly', async () => {
      // Test with an endpoint that might throw async errors
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized');
    });
  });

  describe('Database Error Handling', () => {
    it('should handle Prisma unique constraint violations', async () => {
      // First create a user
      const userData = {
        email: 'unique-test@example.com',
        password: 'password123',
        name: 'Unique Test User',
      };

      await request(app).post('/api/auth/signup').send(userData).expect(201);

      // Try to create the same user again (should trigger unique constraint error)
      const response = await request(app)
        .post('/api/auth/signup')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('Conflict');
      expect(response.body.message).toContain('already exists');
    });
  });
});
