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

/**
 * @swagger
 * /me:
 *   get:
 *     tags: [User Profile]
 *     summary: Get current user profile
 *     description: Retrieves the authenticated user's profile information
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', userController.getProfile);

/**
 * @swagger
 * /me:
 *   patch:
 *     tags: [User Profile]
 *     summary: Update current user profile
 *     description: Updates the authenticated user's profile information (name and/or email)
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Email already exists
 */
router.patch('/me', validate(updateUserProfileSchema), userController.updateProfile);

export default router;