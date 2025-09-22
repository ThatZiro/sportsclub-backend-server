/**
 * League Data Transfer Objects
 * Defines the structure for league-related data
 */

import { z } from 'zod';

/**
 * Create league DTO
 */
export const CreateLeagueDTOSchema = z.object({
  name: z
    .string()
    .min(1, 'League name is required')
    .max(100, 'League name must be less than 100 characters'),
  slug: z
    .string()
    .min(1, 'League slug is required')
    .max(50, 'League slug must be less than 50 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'League slug must contain only lowercase letters, numbers, and hyphens'
    ),
  season: z
    .string()
    .max(50, 'Season must be less than 50 characters')
    .optional(),
  isActive: z.boolean().default(true),
});

export type CreateLeagueDTO = z.infer<typeof CreateLeagueDTOSchema>;

/**
 * Update league DTO
 */
export const UpdateLeagueDTOSchema = z
  .object({
    name: z
      .string()
      .min(1, 'League name is required')
      .max(100, 'League name must be less than 100 characters')
      .optional(),
    slug: z
      .string()
      .min(1, 'League slug is required')
      .max(50, 'League slug must be less than 50 characters')
      .regex(
        /^[a-z0-9-]+$/,
        'League slug must contain only lowercase letters, numbers, and hyphens'
      )
      .optional(),
    season: z
      .string()
      .max(50, 'Season must be less than 50 characters')
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateLeagueDTO = z.infer<typeof UpdateLeagueDTOSchema>;

/**
 * League response DTO
 */
export interface LeagueDTO {
  id: string;
  name: string;
  slug: string;
  season?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Public league DTO (for public endpoints)
 */
export interface PublicLeagueDTO {
  id: string;
  name: string;
  slug: string;
  season?: string;
  isActive: boolean;
}
