import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Validation middleware factory
 * Creates middleware that validates request data against a Zod schema
 */
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate the request data
      const validatedData = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      // Replace request data with validated and transformed data
      req.body = validatedData.body || req.body;
      req.params = validatedData.params || req.params;
      req.query = validatedData.query || req.query;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          error: 'Validation failed',
          message: 'Request data is invalid',
          details: formattedErrors,
        });
        return;
      }

      // Handle unexpected errors
      import('../../config/logger').then(({ appLogger }) => {
        appLogger.logError(error as Error, req, { middleware: 'validation' });
      });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Validation service unavailable',
      });
    }
  };
};

/**
 * Validation middleware for request body only
 */
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedBody = schema.parse(req.body);
      req.body = validatedBody;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          error: 'Validation failed',
          message: 'Request body is invalid',
          details: formattedErrors,
        });
        return;
      }

      import('../../config/logger').then(({ appLogger }) => {
        appLogger.logError(error as Error, req, {
          middleware: 'bodyValidation',
        });
      });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Validation service unavailable',
      });
    }
  };
};

/**
 * Validation middleware for request parameters only
 */
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedParams = schema.parse(req.params);
      req.params = validatedParams;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          error: 'Validation failed',
          message: 'Request parameters are invalid',
          details: formattedErrors,
        });
        return;
      }

      import('../../config/logger').then(({ appLogger }) => {
        appLogger.logError(error as Error, req, {
          middleware: 'paramsValidation',
        });
      });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Validation service unavailable',
      });
    }
  };
};

/**
 * Validation middleware for query parameters only
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedQuery = schema.parse(req.query);
      req.query = validatedQuery;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        res.status(400).json({
          error: 'Validation failed',
          message: 'Query parameters are invalid',
          details: formattedErrors,
        });
        return;
      }

      import('../../config/logger').then(({ appLogger }) => {
        appLogger.logError(error as Error, req, {
          middleware: 'queryValidation',
        });
      });
      res.status(500).json({
        error: 'Internal server error',
        message: 'Validation service unavailable',
      });
    }
  };
};
