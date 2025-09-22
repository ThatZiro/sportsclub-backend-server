import { z } from 'zod';

/**
 * Validation schema for creating a league
 */
export const createLeagueSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'League name must be at least 2 characters')
      .max(100, 'League name must not exceed 100 characters')
      .trim(),
    slug: z
      .string()
      .min(2, 'League slug must be at least 2 characters')
      .max(50, 'League slug must not exceed 50 characters')
      .regex(
        /^[a-z0-9-]+$/,
        'Slug must contain only lowercase letters, numbers, and hyphens'
      )
      .trim(),
    season: z
      .string()
      .min(1, 'Season must be at least 1 character')
      .max(50, 'Season must not exceed 50 characters')
      .trim()
      .optional(),
    isActive: z.boolean().optional().default(true),
  }),
});

/**
 * Validation schema for updating a league
 */
export const updateLeagueSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(2, 'League name must be at least 2 characters')
        .max(100, 'League name must not exceed 100 characters')
        .trim()
        .optional(),
      slug: z
        .string()
        .min(2, 'League slug must be at least 2 characters')
        .max(50, 'League slug must not exceed 50 characters')
        .regex(
          /^[a-z0-9-]+$/,
          'Slug must contain only lowercase letters, numbers, and hyphens'
        )
        .trim()
        .optional(),
      season: z
        .string()
        .min(1, 'Season must be at least 1 character')
        .max(50, 'Season must not exceed 50 characters')
        .trim()
        .optional(),
      isActive: z.boolean().optional(),
    })
    .refine(data => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
  params: z.object({
    id: z.string().cuid('Invalid league ID format'),
  }),
});

/**
 * Validation schema for league ID parameter
 */
export const leagueIdParamSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid league ID format'),
  }),
});

/**
 * Validation schema for league slug parameter
 */
export const leagueSlugParamSchema = z.object({
  params: z.object({
    slug: z
      .string()
      .min(2, 'League slug must be at least 2 characters')
      .max(50, 'League slug must not exceed 50 characters')
      .regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  }),
});

/**
 * Type definitions for validated league requests
 */
export type CreateLeagueRequest = z.infer<typeof createLeagueSchema>;
export type UpdateLeagueRequest = z.infer<typeof updateLeagueSchema>;
export type LeagueIdParamRequest = z.infer<typeof leagueIdParamSchema>;
export type LeagueSlugParamRequest = z.infer<typeof leagueSlugParamSchema>;
