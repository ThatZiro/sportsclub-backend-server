import { UserRole } from '../enums';

/**
 * User entity interface
 * Represents a user in the PBSportsClub system
 */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User creation data (without generated fields)
 */
export interface CreateUserData {
  email: string;
  passwordHash: string;
  name: string;
  role?: UserRole;
}

/**
 * User update data (partial fields that can be updated)
 */
export interface UpdateUserData {
  email?: string;
  name?: string;
  role?: UserRole;
}

/**
 * User domain validation rules and business logic
 */
export class UserDomain {
  /**
   * Validates email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates user name
   */
  static isValidName(name: string): boolean {
    return name.trim().length >= 2 && name.trim().length <= 100;
  }

  /**
   * Validates password requirements
   */
  static isValidPassword(password: string): boolean {
    // At least 8 characters, contains letter and number
    return (
      password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password)
    );
  }

  /**
   * Validates complete user creation data
   */
  static validateCreateData(data: CreateUserData): string[] {
    const errors: string[] = [];

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }

    if (!data.name || !this.isValidName(data.name)) {
      errors.push('Name must be between 2 and 100 characters');
    }

    if (!data.passwordHash) {
      errors.push('Password hash is required');
    }

    return errors;
  }

  /**
   * Validates user update data
   */
  static validateUpdateData(data: UpdateUserData): string[] {
    const errors: string[] = [];

    if (data.email !== undefined && !this.isValidEmail(data.email)) {
      errors.push('Valid email is required');
    }

    if (data.name !== undefined && !this.isValidName(data.name)) {
      errors.push('Name must be between 2 and 100 characters');
    }

    return errors;
  }

  /**
   * Checks if user has organizer privileges
   */
  static hasOrganizerPrivileges(user: User): boolean {
    return user.role === UserRole.ORGANIZER || user.role === UserRole.ADMIN;
  }

  /**
   * Checks if user has admin privileges
   */
  static hasAdminPrivileges(user: User): boolean {
    return user.role === UserRole.ADMIN;
  }

  /**
   * Creates a safe user object (without password hash)
   */
  static toSafeUser(user: User): Omit<User, 'passwordHash'> {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
