import { Response, NextFunction } from 'express';
import { UserRole } from '../../domain/enums';
import { UserDomain } from '../../domain/entities';
import { AuthenticatedRequest } from './auth';

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks if user has required role(s)
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'User must be authenticated to access this resource'
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
      return;
    }

    next();
  };
};

/**
 * Middleware to require organizer privileges (ORGANIZER or ADMIN)
 */
export const requireOrganizer = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'User must be authenticated to access this resource'
    });
    return;
  }

  if (!UserDomain.hasOrganizerPrivileges(req.user)) {
    res.status(403).json({
      error: 'Insufficient permissions',
      message: 'Organizer privileges required'
    });
    return;
  }

  next();
};

/**
 * Middleware to require admin privileges
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'User must be authenticated to access this resource'
    });
    return;
  }

  if (!UserDomain.hasAdminPrivileges(req.user)) {
    res.status(403).json({
      error: 'Insufficient permissions',
      message: 'Administrator privileges required'
    });
    return;
  }

  next();
};

/**
 * Middleware to check if user is team captain or has organizer privileges
 * Requires teamId parameter in request params
 */
export const requireCaptainOrOrganizer = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'User must be authenticated to access this resource'
    });
    return;
  }

  // If user has organizer privileges, allow access
  if (UserDomain.hasOrganizerPrivileges(req.user)) {
    next();
    return;
  }

  // Check if user is team captain
  const teamId = req.params['teamId'] || req.params['id'];
  if (!teamId) {
    res.status(400).json({
      error: 'Bad request',
      message: 'Team ID is required'
    });
    return;
  }

  try {
    // Import here to avoid circular dependencies
    const { TeamRepository } = await import('../../infrastructure/repositories');
    const teamRepository = new TeamRepository();
    const team = await teamRepository.findById(teamId);

    if (!team) {
      res.status(404).json({
        error: 'Not found',
        message: 'Team not found'
      });
      return;
    }

    if (team.captainId !== req.user.id) {
      res.status(403).json({
        error: 'Insufficient permissions',
        message: 'Must be team captain or organizer to perform this action'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authorization service unavailable'
    });
  }
};

/**
 * Middleware to check if user owns the resource or has organizer privileges
 * Requires userId parameter in request params or body
 */
export const requireOwnerOrOrganizer = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'User must be authenticated to access this resource'
    });
    return;
  }

  // If user has organizer privileges, allow access
  if (UserDomain.hasOrganizerPrivileges(req.user)) {
    next();
    return;
  }

  // Check if user owns the resource
  const targetUserId = req.params['userId'] || req.body.userId || req.params['id'];
  
  if (targetUserId && targetUserId !== req.user.id) {
    res.status(403).json({
      error: 'Insufficient permissions',
      message: 'Can only access your own resources'
    });
    return;
  }

  next();
};