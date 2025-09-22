/**
 * User Service
 * Handles user profile management operations
 */

import { IUserRepository } from '../../infrastructure/repositories/interfaces';
import {
  UpdateUserProfileDTO,
  UserProfileDTO,
  UpdateUserRoleDTO,
} from '../dtos/user.dto';
import { User, UpdateUserData } from '../../domain/entities';
import { UserRole } from '../../domain/enums';

/**
 * Custom error classes for user operations
 */
export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
    this.name = 'UserNotFoundError';
  }
}

export class UserValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserValidationError';
  }
}

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`Email ${email} is already in use`);
    this.name = 'DuplicateEmailError';
  }
}

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  /**
   * Get user profile by ID
   * Requirements: 2.3
   */
  async getUserProfile(userId: string): Promise<UserProfileDTO> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return this.mapToProfileDTO(user);
  }

  /**
   * Update user profile
   * Requirements: 2.3
   */
  async updateUserProfile(
    userId: string,
    updates: UpdateUserProfileDTO
  ): Promise<UserProfileDTO> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new UserNotFoundError(userId);
    }

    // If email is being updated, check for duplicates
    if (updates.email && updates.email !== existingUser.email) {
      const userWithEmail = await this.userRepository.findByEmail(
        updates.email
      );
      if (userWithEmail) {
        throw new DuplicateEmailError(updates.email);
      }
    }

    // Prepare update data
    const updateData: UpdateUserData = {};
    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.email !== undefined) {
      updateData.email = updates.email;
    }

    // Update user
    const updatedUser = await this.userRepository.update(userId, updateData);

    return this.mapToProfileDTO(updatedUser);
  }

  /**
   * Update user role (admin/organizer functionality)
   * Requirements: 1.4
   */
  async updateUserRole(
    userId: string,
    roleUpdate: UpdateUserRoleDTO,
    requestingUserId: string
  ): Promise<UserProfileDTO> {
    // Check if requesting user exists and has permission
    const requestingUser = await this.userRepository.findById(requestingUserId);
    if (!requestingUser) {
      throw new UserNotFoundError(requestingUserId);
    }

    // Only ADMIN and ORGANIZER can update roles
    if (
      requestingUser.role !== UserRole.ADMIN &&
      requestingUser.role !== UserRole.ORGANIZER
    ) {
      throw new UserValidationError(
        'Insufficient permissions to update user roles'
      );
    }

    // Check if target user exists
    const targetUser = await this.userRepository.findById(userId);
    if (!targetUser) {
      throw new UserNotFoundError(userId);
    }

    // Prevent users from demoting themselves
    if (requestingUserId === userId && roleUpdate.role === UserRole.USER) {
      throw new UserValidationError('Cannot demote yourself to USER role');
    }

    // Update user role
    const updateData: UpdateUserData = {
      role: roleUpdate.role,
    };

    const updatedUser = await this.userRepository.update(userId, updateData);

    return this.mapToProfileDTO(updatedUser);
  }

  /**
   * Get all users (admin/organizer functionality)
   * Requirements: Administrative access
   */
  async getAllUsers(requestingUserId: string): Promise<UserProfileDTO[]> {
    // Check if requesting user has permission
    const requestingUser = await this.userRepository.findById(requestingUserId);
    if (!requestingUser) {
      throw new UserNotFoundError(requestingUserId);
    }

    if (
      requestingUser.role !== UserRole.ADMIN &&
      requestingUser.role !== UserRole.ORGANIZER
    ) {
      throw new UserValidationError(
        'Insufficient permissions to view all users'
      );
    }

    const users = await this.userRepository.findAll();
    return users.map(user => this.mapToProfileDTO(user));
  }

  /**
   * Delete user (admin functionality)
   * Requirements: Administrative access
   */
  async deleteUser(userId: string, requestingUserId: string): Promise<void> {
    // Check if requesting user has permission
    const requestingUser = await this.userRepository.findById(requestingUserId);
    if (!requestingUser) {
      throw new UserNotFoundError(requestingUserId);
    }

    if (requestingUser.role !== UserRole.ADMIN) {
      throw new UserValidationError('Only ADMIN users can delete accounts');
    }

    // Prevent self-deletion
    if (requestingUserId === userId) {
      throw new UserValidationError('Cannot delete your own account');
    }

    // Check if target user exists
    const targetUser = await this.userRepository.findById(userId);
    if (!targetUser) {
      throw new UserNotFoundError(userId);
    }

    await this.userRepository.delete(userId);
  }

  /**
   * Map User entity to UserProfileDTO (excludes sensitive data)
   * Private helper method
   */
  private mapToProfileDTO(user: User): UserProfileDTO {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
