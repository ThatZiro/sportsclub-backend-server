/**
 * Middleware verification script
 * Ensures all middleware components are properly exported and can be imported
 */

// Test all middleware imports
import {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requireOrganizer,
  requireAdmin,
  requireCaptainOrOrganizer,
  requireOwnerOrOrganizer,
  authRateLimiter,
  apiRateLimiter,
  strictRateLimiter,
  createRateLimiter,
  validate,
  validateBody,
  validateParams,
  validateQuery,
  errorHandler,
  asyncHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
} from '../api/middleware';

// Test all validator imports
import {
  signupSchema,
  loginSchema,
  updateUserProfileSchema,
  updateUserRoleSchema,
  userIdParamSchema,
  createLeagueSchema,
  updateLeagueSchema,
  leagueIdParamSchema,
  leagueSlugParamSchema,
  createTeamSchema,
  updateTeamSchema,
  teamIdParamSchema,
  joinTeamSchema,
  approveMemberSchema,
  getTeamsByLeagueSchema,
} from '../api/validators';

console.log('✅ All middleware components imported successfully');
console.log('✅ All validation schemas imported successfully');

// Verify middleware functions exist
const middlewareComponents = {
  authMiddleware,
  optionalAuthMiddleware,
  requireRole,
  requireOrganizer,
  requireAdmin,
  requireCaptainOrOrganizer,
  requireOwnerOrOrganizer,
  authRateLimiter,
  apiRateLimiter,
  strictRateLimiter,
  createRateLimiter,
  validate,
  validateBody,
  validateParams,
  validateQuery,
  errorHandler,
  asyncHandler,
};

const errorClasses = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
};

const validationSchemas = {
  signupSchema,
  loginSchema,
  updateUserProfileSchema,
  updateUserRoleSchema,
  userIdParamSchema,
  createLeagueSchema,
  updateLeagueSchema,
  leagueIdParamSchema,
  leagueSlugParamSchema,
  createTeamSchema,
  updateTeamSchema,
  teamIdParamSchema,
  joinTeamSchema,
  approveMemberSchema,
  getTeamsByLeagueSchema,
};

console.log(
  `✅ ${Object.keys(middlewareComponents).length} middleware components verified`
);
console.log(`✅ ${Object.keys(errorClasses).length} error classes verified`);
console.log(
  `✅ ${Object.keys(validationSchemas).length} validation schemas verified`
);

export { middlewareComponents, errorClasses, validationSchemas };
