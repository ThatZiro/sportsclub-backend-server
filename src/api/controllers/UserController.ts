/**
 * User Controller
 * Handles user profile management endpoints
 * Requirements: 2.3
 */

import { Response, NextFunction } from 'express';
import { UserService } from '../../application/services/UserService';
import { AuthenticatedRequest } from '../middleware/auth';
import { UpdateUserProfileRequest } from '../validators/user';

export class UserController {
  constructor(private userService: UserService) {}

  /**
   * GET /me
   * Get current user profile
   * Requirements: 2.3
   */
  getProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const userProfile = await this.userService.getUserProfile(req.user.id);

      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: {
          user: userProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /me
   * Update current user profile
   * Requirements: 2.3
   */
  updateProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const { body } = req as UpdateUserProfileRequest;

      const updatedProfile = await this.userService.updateUserProfile(
        req.user.id,
        body
      );

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: updatedProfile,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
