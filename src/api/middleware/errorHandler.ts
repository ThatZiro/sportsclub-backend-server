import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { appLogger } from '../../config/logger';

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

/**
 * Global error handling middleware
 * Handles all errors thrown in the application
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal server error';

  // Log the error with full context
  appLogger.logError(error, req, {
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Handle custom application errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // Handle Prisma errors
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        statusCode = 409;
        message = 'Resource already exists';
        if (error.meta?.['target']) {
          const field = Array.isArray(error.meta['target']) 
            ? error.meta['target'][0] 
            : error.meta['target'];
          message = `${field} already exists`;
        }
        break;
      case 'P2025':
        // Record not found
        statusCode = 404;
        message = 'Resource not found';
        break;
      case 'P2003':
        // Foreign key constraint violation
        statusCode = 400;
        message = 'Invalid reference to related resource';
        break;
      default:
        statusCode = 400;
        message = 'Database operation failed';
    }
  }
  // Handle Prisma validation errors
  else if (error instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
  }
  // Handle other Prisma errors
  else if (error instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = 'Database connection failed';
  }
  else if (error instanceof Prisma.PrismaClientRustPanicError) {
    statusCode = 500;
    message = 'Database error occurred';
  }

  // Sanitize error response for production
  const errorResponse = sanitizeErrorResponse(error, statusCode, message, req);

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Sanitize error response based on environment
 */
function sanitizeErrorResponse(
  error: Error,
  statusCode: number,
  message: string,
  req: Request
): any {
  const isDevelopment = process.env['NODE_ENV'] === 'development';
  const isProduction = process.env['NODE_ENV'] === 'production';

  const baseResponse = {
    error: getErrorType(statusCode),
    message: sanitizeErrorMessage(message, statusCode, isProduction),
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.url,
    requestId: req.headers['x-request-id'],
  };

  // In development, include additional debugging information
  if (isDevelopment) {
    return {
      ...baseResponse,
      details: {
        stack: error.stack,
        originalError: error.message,
        name: error.name,
      },
    };
  }

  // In production, only include safe information
  if (isProduction) {
    // For 5xx errors, use generic message to avoid leaking internal details
    if (statusCode >= 500) {
      return {
        ...baseResponse,
        message: 'An internal server error occurred',
      };
    }
  }

  return baseResponse;
}

/**
 * Sanitize error messages for production
 */
function sanitizeErrorMessage(
  message: string,
  statusCode: number,
  isProduction: boolean
): string {
  if (!isProduction) {
    return message;
  }

  // For server errors (5xx), use generic messages
  if (statusCode >= 500) {
    return 'An internal server error occurred';
  }

  // For client errors (4xx), sanitize but keep informative
  const sensitivePatterns = [
    /database/gi,
    /prisma/gi,
    /connection/gi,
    /internal/gi,
    /server/gi,
    /stack/gi,
    /error:/gi,
  ];

  let sanitized = message;
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  return sanitized;
}

/**
 * Get error type based on status code
 */
function getErrorType(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Unprocessable Entity';
    case 429:
      return 'Too Many Requests';
    case 500:
      return 'Internal Server Error';
    case 503:
      return 'Service Unavailable';
    default:
      return 'Error';
  }
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass them to error handler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};