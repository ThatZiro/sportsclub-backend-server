import { z } from 'zod';
import { UserRole } from '../../domain/enums';

/**
 * Validation schema for updating user profile
 */
export const updateUserProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters')
      .trim()
      .optional(),
    email: z
      .string()
      .email('Invalid email format')
      .toLowerCase()
      .trim()
      .optional()
  }).refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one field must be provided for update'
    }
  )
});

/**
 * Validation schema for updating user role (admin only)
 */
export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.nativeEnum(UserRole, {
      errorMap: () => ({ message: 'Invalid user role' })
    })
  }),
  params: z.object({
    userId: z.string().cuid('Invalid user ID format')
  })
});

/**
 * Validation schema for user ID parameter
 */
export const userIdParamSchema = z.object({
  params: z.object({
    userId: z.string().cuid('Invalid user ID format')
  })
});

/**
 * Type definitions for validated user requests
 */
export type UpdateUserProfileRequest = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserRoleRequest = z.infer<typeof updateUserRoleSchema>;
export type UserIdParamRequest = z.infer<typeof userIdParamSchema>;