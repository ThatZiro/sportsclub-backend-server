/**
 * User Routes
 * Defines routes for user profile management
 */

import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { UserService } from '../../application/services/UserService';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { updateUserProfileSchema } from '../validators/user';

// Create router
const router = Router();

// Initialize dependencies
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

// Apply authentication middleware to all user routes
router.use(authMiddleware);

// GET /me - Get current user profile
router.get('/me', userController.getProfile);

// PATCH /me - Update current user profile
router.patch('/me', validate(updateUserProfileSchema), userController.updateProfile);

export default router;