import { Request, Response, NextFunction } from 'express';
import { appLogger } from '../../config/logger';

/**
 * Request logging middleware
 * Logs incoming requests and outgoing responses with timing information
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Log incoming request
  appLogger.logRequest(req);

  // Capture the original res.end method
  const originalEnd = res.end;

  // Override res.end to log response
  res.end = function(chunk?: any, encoding?: any): Response {
    const responseTime = Date.now() - startTime;
    
    // Log response
    appLogger.logResponse(req, res.statusCode, responseTime);

    // Call the original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Request ID middleware
 * Adds a unique request ID to each request for tracing
 */
export const requestId = (req: Request, res: Response, next: NextFunction): void => {
  // Generate request ID if not provided
  const reqId = req.headers['x-request-id'] as string || 
                Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);

  // Add to request headers
  req.headers['x-request-id'] = reqId;

  // Add to response headers for client tracing
  res.setHeader('X-Request-ID', reqId);

  next();
};