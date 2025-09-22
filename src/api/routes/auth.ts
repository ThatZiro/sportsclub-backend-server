/**
 * Authentication Routes
 * Defines routes for user authentication: signup, login, logout
 */

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../../application/services/AuthService';
import { UserRepository } from '../../infrastructure/repositories/UserRepository';
import { validate } from '../middleware/validation';
import { authRateLimiter } from '../middleware/rateLimiter';
import { signupSchema, loginSchema } from '../validators/auth';

// Create router
const router = Router();

// Initialize dependencies
const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

// Apply rate limiting to all auth routes
router.use(authRateLimiter);

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user account
 *     description: Creates a new user account with email, password, and name. Automatically assigns USER role.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: User account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *         headers:
 *           Set-Cookie:
 *             description: JWT token set in HTTP-only cookie
 *             schema:
 *               type: string
 *               example: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Path=/
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Email already exists
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/signup', validate(signupSchema), authController.signup);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Authenticate user and create session
 *     description: Validates user credentials and returns JWT token in HTTP-only cookie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *         headers:
 *           Set-Cookie:
 *             description: JWT token set in HTTP-only cookie
 *             schema:
 *               type: string
 *               example: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Path=/
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: Invalid credentials
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Clear user session
 *     description: Clears the JWT token cookie to log out the user
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: Logout successful
 *         headers:
 *           Set-Cookie:
 *             description: JWT token cookie cleared
 *             schema:
 *               type: string
 *               example: token=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
 *       429:
 *         $ref: '#/components/responses/RateLimitError'
 */
router.post('/logout', authController.logout);

export default router;
