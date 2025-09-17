import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../domain/entities';
import { UserRepository } from '../../infrastructure/repositories';

/**
 * Extended Request interface to include authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * JWT payload interface
 */
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * JWT authentication middleware
 * Validates JWT tokens from HTTP-only cookies and attaches user to request
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from HTTP-only cookie
    const token = req.cookies?.['authToken'];

    if (!token) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'No authentication token provided'
      });
      return;
    }

    // Verify JWT token
    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Get user from database to ensure they still exist and get latest data
    const userRepository = new UserRepository();
    const user = await userRepository.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'User not found'
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid token'
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Token expired'
      });
      return;
    }

    // Log unexpected errors
    import('../../config/logger').then(({ appLogger }) => {
      appLogger.logError(error as Error, req, { middleware: 'auth' });
    });
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication service unavailable'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is present, but doesn't require authentication
 */
export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.['authToken'];

    if (!token) {
      next();
      return;
    }

    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    const userRepository = new UserRepository();
    const user = await userRepository.findById(decoded.userId);

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on errors, just continue without user
    next();
  }
};