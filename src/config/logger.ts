import winston from 'winston';
import { Request } from 'express';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which logs to print based on environment
const level = () => {
  const env = process.env['NODE_ENV'] || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different log formats
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info['timestamp']} ${info.level}: ${info.message}`
  ),
);

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Define transports
const transports = [];

// Console transport for development
if (process.env['NODE_ENV'] !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: developmentFormat,
    })
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: productionFormat,
    })
  );
}

// File transports for production
if (process.env['NODE_ENV'] === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: productionFormat,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: productionFormat,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Request context interface
export interface RequestContext {
  requestId?: string;
  userId?: string;
  method: string;
  url: string;
  userAgent?: string | undefined;
  ip: string;
  timestamp: string;
}

// Create request context from Express request
export const createRequestContext = (req: Request): RequestContext => {
  return {
    requestId: req.headers['x-request-id'] as string || generateRequestId(),
    userId: (req as any).user?.id,
    method: req.method,
    url: req.originalUrl || req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    timestamp: new Date().toISOString(),
  };
};

// Generate a simple request ID
const generateRequestId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Enhanced logger with context support
export class Logger {
  private static instance: Logger;
  private winston: winston.Logger;

  private constructor() {
    this.winston = logger;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Log with context
  public logWithContext(
    level: string,
    message: string,
    context?: RequestContext,
    meta?: any
  ): void {
    const logData = {
      message,
      context,
      ...meta,
    };

    this.winston.log(level, message, logData);
  }

  // Convenience methods
  public error(message: string, context?: RequestContext, meta?: any): void {
    this.logWithContext('error', message, context, meta);
  }

  public warn(message: string, context?: RequestContext, meta?: any): void {
    this.logWithContext('warn', message, context, meta);
  }

  public info(message: string, context?: RequestContext, meta?: any): void {
    this.logWithContext('info', message, context, meta);
  }

  public http(message: string, context?: RequestContext, meta?: any): void {
    this.logWithContext('http', message, context, meta);
  }

  public debug(message: string, context?: RequestContext, meta?: any): void {
    this.logWithContext('debug', message, context, meta);
  }

  // Log request start
  public logRequest(req: Request): void {
    const context = createRequestContext(req);
    this.http(`${req.method} ${req.originalUrl || req.url}`, context, {
      body: this.sanitizeBody(req.body),
      query: req.query,
      params: req.params,
    });
  }

  // Log request completion
  public logResponse(
    req: Request,
    statusCode: number,
    responseTime?: number
  ): void {
    const context = createRequestContext(req);
    const level = statusCode >= 400 ? 'warn' : 'http';
    
    this.logWithContext(
      level,
      `${req.method} ${req.originalUrl || req.url} - ${statusCode}`,
      context,
      {
        statusCode,
        responseTime: responseTime ? `${responseTime}ms` : undefined,
      }
    );
  }

  // Log errors with full context
  public logError(
    error: Error,
    req?: Request,
    additionalContext?: any
  ): void {
    const context = req ? createRequestContext(req) : undefined;
    
    this.error(error.message, context, {
      stack: error.stack,
      name: error.name,
      ...additionalContext,
    });
  }

  // Sanitize sensitive data from request body
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}

// Export singleton instance
export const appLogger = Logger.getInstance();

// Export the winston logger for direct access if needed
export { logger as winstonLogger };