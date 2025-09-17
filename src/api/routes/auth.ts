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

// POST /auth/signup - User registration
router.post('/signup', validate(signupSchema), authController.signup);

// POST /auth/login - User authentication
router.post('/login', validate(loginSchema), authController.login);

// POST /auth/logout - Clear authentication
router.post('/logout', authController.logout);

export default router;