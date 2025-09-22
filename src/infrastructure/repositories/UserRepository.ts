/**
 * User repository implementation
 * Handles CRUD operations for users using Prisma
 */

import { prisma } from '../database';
import { IUserRepository } from './interfaces';
import {
  User,
  CreateUserData,
  UpdateUserData,
  UserDomain,
} from '../../domain/entities';
import { UserRole } from '../../domain/enums';

export class UserRepository implements IUserRepository {
  /**
   * Creates a new user
   */
  async create(data: CreateUserData): Promise<User> {
    // Validate data using domain logic
    const errors = UserDomain.validateCreateData(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role || UserRole.USER,
      },
    });

    return this.mapPrismaUserToEntity(user);
  }

  /**
   * Finds a user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? this.mapPrismaUserToEntity(user) : null;
  }

  /**
   * Finds a user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user ? this.mapPrismaUserToEntity(user) : null;
  }

  /**
   * Updates a user
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    // Validate data using domain logic
    const errors = UserDomain.validateUpdateData(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.name && { name: data.name }),
        ...(data.role && { role: data.role }),
      },
    });

    return this.mapPrismaUserToEntity(user);
  }

  /**
   * Deletes a user
   */
  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Finds all users
   */
  async findAll(): Promise<User[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map(user => this.mapPrismaUserToEntity(user));
  }

  /**
   * Maps Prisma user object to domain entity
   */
  private mapPrismaUserToEntity(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      passwordHash: prismaUser.passwordHash,
      name: prismaUser.name,
      role: prismaUser.role as UserRole,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}
