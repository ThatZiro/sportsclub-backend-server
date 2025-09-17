/**
 * Authentication Data Transfer Objects
 * Defines the structure for authentication-related data
 */

import { z } from 'zod';
import { User } from '../../domain/entities';

/**
 * Signup request DTO
 */
export const SignupDTOSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be less than 100 characters')
});

export type SignupDTO = z.infer<typeof SignupDTOSchema>;

/**
 * Login request DTO
 */
export const LoginDTOSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export type LoginDTO = z.infer<typeof LoginDTOSchema>;

/**
 * Authentication result DTO
 */
export interface AuthResult {
  user: User;
  token: string;
}

/**
 * JWT payload interface
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}