/**
 * Authentication Controller
 * Handles authentication endpoints: signup, login, logout
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.4
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../application/services/AuthService';
import { SignupRequest, LoginRequest } from '../validators/auth';

export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /auth/signup
   * Create new user account
   * Requirements: 1.1, 1.2, 1.3
   */
  signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { body } = req as SignupRequest;
      
      const result = await this.authService.signup(body);
      
      // Set JWT token in HTTP-only cookie
      res.cookie('authToken', result.token, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000 // 1 hour
      });

      // Return user data (without password hash)
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            createdAt: result.user.createdAt,
            updatedAt: result.user.updatedAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/login
   * Authenticate user and return JWT token
   * Requirements: 2.1, 2.2
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { body } = req as LoginRequest;
      
      const result = await this.authService.login(body);
      
      // Set JWT token in HTTP-only cookie
      res.cookie('authToken', result.token, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000 // 1 hour
      });

      // Return user data (without password hash)
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            createdAt: result.user.createdAt,
            updatedAt: result.user.updatedAt
          }
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/logout
   * Clear authentication token
   * Requirements: 2.4
   */
  logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.authService.logout();
      
      // Clear the JWT cookie
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'strict'
      });

      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      next(error);
    }
  };
}