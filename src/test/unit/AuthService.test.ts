/**
 * AuthService Unit Tests
 * Tests authentication service with mocked dependencies
 */

import { AuthService, AuthenticationError, ValidationError } from '../../application/services/AuthService';
import { IUserRepository } from '../../infrastructure/repositories/interfaces';
import { UserRole } from '../../domain/enums';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockBcrypt = jest.mocked(bcrypt);
const mockJwt = jest.mocked(jwt);

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn()
    };
    authService = new AuthService(mockUserRepo);
  });

  describe('signup', () => {
    const validSignupData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    };

    it('should create a new user successfully', async () => {
      // Arrange
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      
      const createdUser = {
        id: 'user-1',
        email: validSignupData.email,
        passwordHash: 'hashedpassword',
        name: validSignupData.name,
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockUserRepo.create.mockResolvedValue(createdUser);
      mockJwt.sign.mockReturnValue('jwt-token' as never);

      // Act
      const result = await authService.signup(validSignupData);

      // Assert
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(validSignupData.email);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(validSignupData.password, 12);
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        email: validSignupData.email,
        passwordHash: 'hashedpassword',
        name: validSignupData.name
      });
      expect(result.user).toEqual(createdUser);
      expect(result.token).toBe('jwt-token');
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const existingUser = {
        id: 'existing-user',
        email: validSignupData.email,
        passwordHash: 'hash',
        name: 'Existing User',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      mockUserRepo.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(authService.signup(validSignupData))
        .rejects.toThrow(ValidationError);
      
      expect(mockUserRepo.create).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      // Arrange
      const invalidData = { ...validSignupData, email: 'invalid-email' };

      // Act & Assert
      await expect(authService.signup(invalidData))
        .rejects.toThrow(ValidationError);
    });

    it('should validate password strength', async () => {
      // Arrange
      const weakPasswordData = { ...validSignupData, password: 'weak' };

      // Act & Assert
      await expect(authService.signup(weakPasswordData))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should login successfully with valid credentials', async () => {
      // Arrange
      const user = {
        id: 'user-1',
        email: loginData.email,
        passwordHash: 'hashedpassword',
        name: 'Test User',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepo.findByEmail.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue('jwt-token' as never);

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(loginData.email);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(loginData.password, user.passwordHash);
      expect(result.user).toEqual(user);
      expect(result.token).toBe('jwt-token');
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      mockUserRepo.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginData))
        .rejects.toThrow(AuthenticationError);
    });

    it('should throw error for invalid password', async () => {
      // Arrange
      const user = {
        id: 'user-1',
        email: loginData.email,
        passwordHash: 'hashedpassword',
        name: 'Test User',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepo.findByEmail.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(authService.login(loginData))
        .rejects.toThrow(AuthenticationError);
    });
  });

  describe('validateToken', () => {
    it('should validate token and return user', async () => {
      // Arrange
      const payload = { userId: 'user-1' };
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hash',
        name: 'Test User',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockJwt.verify.mockReturnValue(payload as never);
      mockUserRepo.findById.mockResolvedValue(user);

      // Act
      const result = await authService.validateToken('valid-token');

      // Assert
      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(mockUserRepo.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(user);
    });

    it('should throw error for invalid token', async () => {
      // Arrange
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.validateToken('invalid-token'))
        .rejects.toThrow(AuthenticationError);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const payload = { userId: 'non-existent' };
      mockJwt.verify.mockReturnValue(payload as never);
      mockUserRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.validateToken('valid-token'))
        .rejects.toThrow(AuthenticationError);
    });
  });
});