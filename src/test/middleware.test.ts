import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../domain/enums';
import { User } from '../domain/entities';
import {
  authMiddleware,
  requireRole,
  requireOrganizer,
  validate,
  ValidationError,
  errorHandler,
  AuthenticatedRequest
} from '../api/middleware';
import { signupSchema } from '../api/validators';

// Mock UserRepository
jest.mock('../infrastructure/repositories', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    findById: jest.fn()
  }))
}));

describe('Middleware Tests', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: NextFunction;
  let mockUser: User;

  beforeEach(() => {
    req = {
      cookies: {},
      body: {},
      params: {},
      query: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();

    mockUser = {
      id: 'user123',
      email: 'test@example.com',
      passwordHash: 'hashedpassword',
      name: 'Test User',
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Set up environment variable
    process.env['JWT_SECRET'] = 'test-secret';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should authenticate user with valid token', async () => {
      const token = jwt.sign(
        { userId: mockUser.id, email: mockUser.email, role: mockUser.role },
        process.env['JWT_SECRET']!
      );
      req.cookies = { authToken: token };

      const { UserRepository } = require('../infrastructure/repositories');
      const mockFindById = jest.fn().mockResolvedValue(mockUser);
      UserRepository.mockImplementation(() => ({
        findById: mockFindById
      }));

      await authMiddleware(req as AuthenticatedRequest, res as Response, next);

      expect(mockFindById).toHaveBeenCalledWith(mockUser.id);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 when no token provided', async () => {
      req.cookies = {};

      await authMiddleware(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'No authentication token provided'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', async () => {
      req.cookies = { authToken: 'invalid-token' };

      await authMiddleware(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'Invalid token'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user not found', async () => {
      const token = jwt.sign(
        { userId: 'nonexistent', email: 'test@example.com', role: UserRole.USER },
        process.env['JWT_SECRET']!
      );
      req.cookies = { authToken: token };

      const { UserRepository } = require('../infrastructure/repositories');
      const mockFindById = jest.fn().mockResolvedValue(null);
      UserRepository.mockImplementation(() => ({
        findById: mockFindById
      }));

      await authMiddleware(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication failed',
        message: 'User not found'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access for user with required role', () => {
      req.user = mockUser;
      const middleware = requireRole(UserRole.USER);

      middleware(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for user without required role', () => {
      req.user = mockUser;
      const middleware = requireRole(UserRole.ORGANIZER);

      middleware(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        message: 'Access denied. Required role: ORGANIZER'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when user not authenticated', () => {
      delete req.user;
      const middleware = requireRole(UserRole.USER);

      middleware(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireOrganizer', () => {
    it('should allow access for organizer', () => {
      req.user = { ...mockUser, role: UserRole.ORGANIZER };

      requireOrganizer(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow access for admin', () => {
      req.user = { ...mockUser, role: UserRole.ADMIN };

      requireOrganizer(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for regular user', () => {
      req.user = mockUser;

      requireOrganizer(req as AuthenticatedRequest, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Insufficient permissions',
        message: 'Organizer privileges required'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validate middleware', () => {
    it('should validate and transform valid signup data', () => {
      req.body = {
        name: 'John Doe',
        email: 'JOHN@EXAMPLE.COM',
        password: 'password123'
      };

      const middleware = validate(signupSchema);
      middleware(req as Request, res as Response, next);

      expect(req.body.email).toBe('john@example.com'); // Should be lowercase
      expect(next).toHaveBeenCalled();
    });

    it('should return validation errors for invalid data', () => {
      req.body = {
        name: 'J', // Too short
        email: 'invalid-email',
        password: '123' // Too short and no letters
      };

      const middleware = validate(signupSchema);
      middleware(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation failed',
          message: 'Request data is invalid',
          details: expect.arrayContaining([
            expect.objectContaining({
              field: expect.stringContaining('name'),
              message: expect.stringContaining('at least 2 characters')
            }),
            expect.objectContaining({
              field: expect.stringContaining('email'),
              message: expect.stringContaining('Invalid email format')
            }),
            expect.objectContaining({
              field: expect.stringContaining('password'),
              message: expect.stringContaining('at least 8 characters')
            })
          ])
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      const error = new ValidationError('Test validation error');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Bad Request',
        message: 'Test validation error'
      });
    });

    it('should handle generic errors', () => {
      const error = new Error('Generic error');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
        message: 'Internal server error'
      });
    });

    it('should include error details in development', () => {
      process.env['NODE_ENV'] = 'development';
      const error = new Error('Test error');

      errorHandler(error, req as Request, res as Response, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            stack: expect.any(String),
            originalError: 'Test error'
          })
        })
      );

      // Clean up
      delete process.env['NODE_ENV'];
    });
  });
});