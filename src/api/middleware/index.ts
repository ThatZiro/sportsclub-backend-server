/**
 * Middleware barrel export
 * Centralizes all middleware exports for easy importing
 */

// Authentication middleware
export {
  authMiddleware,
  optionalAuthMiddleware,
  AuthenticatedRequest
} from './auth';

// Authorization middleware
export {
  requireRole,
  requireOrganizer,
  requireAdmin,
  requireCaptainOrOrganizer,
  requireOwnerOrOrganizer
} from './authorization';

// Rate limiting middleware
export {
  authRateLimiter,
  apiRateLimiter,
  strictRateLimiter,
  createRateLimiter
} from './rateLimiter';

// Validation middleware
export {
  validate,
  validateBody,
  validateParams,
  validateQuery
} from './validation';

// Error handling middleware
export {
  errorHandler,
  asyncHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError
} from './errorHandler';

// Request logging middleware
export {
  requestLogger,
  requestId
} from './requestLogger';