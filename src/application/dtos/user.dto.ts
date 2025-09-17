/**
 * User Data Transfer Objects
 * Defines the structure for user-related data
 */

import { z } from 'zod';
import { UserRole } from '../../domain/enums';

/**
 * Update user profile DTO
 */
export const UpdateUserProfileDTOSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  email: z.string().email('Invalid email format').optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update'
});

export type UpdateUserProfileDTO = z.infer<typeof UpdateUserProfileDTOSchema>;

/**
 * User profile response DTO (excludes sensitive data)
 */
export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Update user role DTO (admin/organizer only)
 */
export const UpdateUserRoleDTOSchema = z.object({
  role: z.nativeEnum(UserRole, {
    errorMap: () => ({ message: 'Invalid user role' })
  })
});

export type UpdateUserRoleDTO = z.infer<typeof UpdateUserRoleDTOSchema>;