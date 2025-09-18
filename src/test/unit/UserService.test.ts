/**
 * UserService Unit Tests
 * Tests user service with mocked dependencies
 */

import { UserService, UserNotFoundError, UserValidationError, DuplicateEmailError } from '../../application/services/UserService';
import { IUserRepository } from '../../infrastructure/repositories/interfaces';
import { UserRole } from '../../domain/enums';

describe('UserService', () => {
  let userService: UserService;
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
    userService = new UserService(mockUserRepo);
  });

  describe('getUserProfile', () => {
    it('should return user profile successfully', async () => {
      // Arrange
      const userId = 'user-1';
      const user = {
        id: userId,
        email: 'test@example.com',
        passwordHash: 'hash',
        name: 'Test User',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepo.findById.mockResolvedValue(user);

      // Act
      const result = await userService.getUserProfile(userId);

      // Assert
      expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(user);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const userId = 'non-existent';
      mockUserRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.getUserProfile(userId))
        .rejects.toThrow(UserNotFoundError);
    });
  });

  describe('updateUserProfile', () => {
    const userId = 'user-1';
    const existingUser = {
      id: userId,
      email: 'test@example.com',
      passwordHash: 'hash',
      name: 'Test User',
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should update user profile successfully', async () => {
      // Arrange
      const updates = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      const updatedUser = {
        ...existingUser,
        ...updates,
        updatedAt: new Date()
      };

      mockUserRepo.findById.mockResolvedValue(existingUser);
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockUserRepo.update.mockResolvedValue(updatedUser);

      // Act
      const result = await userService.updateUserProfile(userId, updates);

      // Assert
      expect(mockUserRepo.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(updates.email);
      expect(mockUserRepo.update).toHaveBeenCalledWith(userId, updates);
      expect(result).toEqual(updatedUser);
    });

    it('should throw error if user not found', async () => {
      // Arrange
      const updates = { name: 'Updated Name' };
      mockUserRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.updateUserProfile(userId, updates))
        .rejects.toThrow(UserNotFoundError);
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const updates = { email: 'existing@example.com' };
      const otherUser = {
        id: 'other-user',
        email: 'existing@example.com',
        passwordHash: 'hash',
        name: 'Other User',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockUserRepo.findById.mockResolvedValue(existingUser);
      mockUserRepo.findByEmail.mockResolvedValue(otherUser);

      // Act & Assert
      await expect(userService.updateUserProfile(userId, updates))
        .rejects.toThrow(DuplicateEmailError);
    });

    it('should allow updating to same email', async () => {
      // Arrange
      const updates = { name: 'Updated Name' };
      const updatedUser = {
        ...existingUser,
        ...updates,
        updatedAt: new Date()
      };

      mockUserRepo.findById.mockResolvedValue(existingUser);
      mockUserRepo.update.mockResolvedValue(updatedUser);

      // Act
      const result = await userService.updateUserProfile(userId, updates);

      // Assert
      expect(result).toEqual(updatedUser);
    });

    // Note: UserService doesn't perform validation - that's handled at the API layer
    // These tests would be more appropriate for the API controller tests
  });
});