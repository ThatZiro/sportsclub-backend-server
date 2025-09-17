import { Request, Response } from 'express';
import { errorHandler, AppError, ValidationError } from '../api/middleware/errorHandler';
import { requestLogger, requestId } from '../api/middleware/requestLogger';

// Mock Express request and response objects
const mockRequest = (overrides = {}) => {
  return {
    method: 'GET',
    url: '/test',
    originalUrl: '/test',
    headers: {},
    body: {},
    params: {},
    query: {},
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
    get: jest.fn(),
    ...overrides,
  } as unknown as Request;
};

const mockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    statusCode: 200,
  } as unknown as Response;
  return res;
};

const mockNext = jest.fn();

describe('Error Handling Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Error Handler Middleware', () => {
    it('should handle AppError correctly', () => {
      const req = mockRequest();
      const res = mockResponse();
      const error = new AppError('Test application error', 400);

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Bad Request',
          message: 'Test application error',
          timestamp: expect.any(String),
          path: '/test',
        })
      );
    });

    it('should handle ValidationError correctly', () => {
      const req = mockRequest();
      const res = mockResponse();
      const error = new ValidationError('Invalid input data');

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Bad Request',
          message: 'Invalid input data',
        })
      );
    });

    it('should handle generic errors', () => {
      const req = mockRequest();
      const res = mockResponse();
      const error = new Error('Generic error');

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal Server Error',
          message: 'Internal server error',
        })
      );
    });

    it('should include request ID in error response', () => {
      const req = mockRequest({
        headers: { 'x-request-id': 'test-request-123' }
      });
      const res = mockResponse();
      const error = new AppError('Test error', 400);

      errorHandler(error, req, res, mockNext);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          requestId: 'test-request-123',
        })
      );
    });

    it('should sanitize error messages in production', () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';

      try {
        const req = mockRequest();
        const res = mockResponse();
        const error = new Error('Database connection failed');

        errorHandler(error, req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'An internal server error occurred',
          })
        );
      } finally {
        process.env['NODE_ENV'] = originalEnv;
      }
    });
  });

  describe('Request Logging Middleware', () => {
    it('should add request ID if not present', () => {
      const req = mockRequest();
      const res = mockResponse();

      requestId(req, res, mockNext);

      expect(req.headers['x-request-id']).toBeDefined();
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should preserve existing request ID', () => {
      const req = mockRequest({
        headers: { 'x-request-id': 'existing-id-123' }
      });
      const res = mockResponse();

      requestId(req, res, mockNext);

      expect(req.headers['x-request-id']).toBe('existing-id-123');
      expect(res.setHeader).toHaveBeenCalledWith('X-Request-ID', 'existing-id-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should set up request logging', () => {
      const req = mockRequest();
      const res = mockResponse();

      // Mock the original end method
      const originalEnd = res.end;
      res.end = jest.fn().mockImplementation(function(chunk, encoding) {
        return originalEnd.call(this, chunk, encoding);
      });

      requestLogger(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(typeof res.end).toBe('function');
    });
  });

  describe('Error Sanitization', () => {
    it('should sanitize sensitive patterns in production', () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';

      try {
        const req = mockRequest();
        const res = mockResponse();
        const error = new AppError('Prisma database connection failed', 400);

        errorHandler(error, req, res, mockNext);

        const responseCall = (res.json as jest.Mock).mock.calls[0][0];
        expect(responseCall.message).not.toContain('Prisma');
        expect(responseCall.message).not.toContain('database');
      } finally {
        process.env['NODE_ENV'] = originalEnv;
      }
    });

    it('should preserve error details in development', () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'development';

      try {
        const req = mockRequest();
        const res = mockResponse();
        const error = new AppError('Detailed error message', 400);

        errorHandler(error, req, res, mockNext);

        const responseCall = (res.json as jest.Mock).mock.calls[0][0];
        expect(responseCall.message).toBe('Detailed error message');
        expect(responseCall.details).toBeDefined();
      } finally {
        process.env['NODE_ENV'] = originalEnv;
      }
    });
  });
});