import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiter configuration for authentication endpoints
 * Limits to 10 requests per minute per IP for auth endpoints
 */
export const authRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many authentication attempts. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many authentication attempts. Please try again later.',
      retryAfter: 60
    });
  },
  skip: (_req: Request) => {
    // Skip rate limiting in test environment
    return process.env['NODE_ENV'] === 'test';
  }
});

/**
 * General API rate limiter
 * Limits to 100 requests per minute per IP for general API endpoints
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many API requests. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many API requests. Please try again later.',
      retryAfter: 60
    });
  },
  skip: (_req: Request) => {
    // Skip rate limiting in test environment
    return process.env['NODE_ENV'] === 'test';
  }
});

/**
 * Strict rate limiter for sensitive operations
 * Limits to 5 requests per minute per IP
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many requests for this sensitive operation. Please try again later.',
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many requests for this sensitive operation. Please try again later.',
      retryAfter: 60
    });
  },
  skip: (_req: Request) => {
    // Skip rate limiting in test environment
    return process.env['NODE_ENV'] === 'test';
  }
});

/**
 * Create a custom rate limiter with specific configuration
 */
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: 'Too many requests',
      message: options.message || 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, res: Response) => {
      res.status(429).json({
        error: 'Too many requests',
        message: options.message || 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000)
      });
    },
    skip: (_req: Request) => {
      return process.env['NODE_ENV'] === 'test';
    }
  });
};