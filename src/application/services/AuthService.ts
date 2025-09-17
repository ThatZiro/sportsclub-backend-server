/**
 * Authentication Service
 * Handles user authentication operations including signup, login, logout, and token validation
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IUserRepository } from '../../infrastructure/repositories/interfaces';
import { SignupDTO, LoginDTO, AuthResult, JWTPayload } from '../dtos/auth.dto';
import { User, CreateUserData } from '../../domain/entities';
import { UserRole } from '../../domain/enums';

/**
 * Custom error classes for authentication
 */
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthService {
  private readonly saltRounds = 12;
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(private userRepository: IUserRepository) {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
    
    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET not set in environment variables, using fallback');
    }
  }

  /**
   * Sign up a new user
   * Requirements: 1.1, 1.2, 1.3, 11.2
   */
  async signup(userData: SignupDTO): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ValidationError('Email is already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(userData.password, this.saltRounds);

    // Create user data with default USER role
    const createUserData: CreateUserData = {
      name: userData.name,
      email: userData.email,
      passwordHash,
      role: UserRole.USER
    };

    // Create user
    const user = await this.userRepository.create(createUserData);

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user,
      token
    };
  }

  /**
   * Log in an existing user
   * Requirements: 2.1, 2.2, 11.3
   */
  async login(credentials: LoginDTO): Promise<AuthResult> {
    // Find user by email
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user,
      token
    };
  }

  /**
   * Logout functionality (mainly for clearing client-side tokens)
   * Requirements: 2.4
   */
  async logout(): Promise<void> {
    // In a stateless JWT implementation, logout is primarily handled client-side
    // by removing the token from cookies/storage
    // This method exists for consistency and future stateful token management
    return Promise.resolve();
  }

  /**
   * Validate JWT token and return user
   * Requirements: 2.3, 11.3
   */
  async validateToken(token: string): Promise<User> {
    try {
      // Verify and decode JWT token
      const decoded = jwt.verify(token, this.jwtSecret) as JWTPayload;
      
      // Find user by ID from token
      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expired');
      }
      throw error;
    }
  }

  /**
   * Generate JWT token for user
   * Private helper method
   */
  private generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    });
  }

  /**
   * Verify password hash (utility method for testing)
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Hash password (utility method for testing)
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }
}