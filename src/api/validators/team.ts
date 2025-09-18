import { z } from 'zod';

/**
 * Validation schema for creating a team
 */
export const createTeamSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Team name must be at least 2 characters')
      .max(100, 'Team name must not exceed 100 characters')
      .trim(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF0000)')
      .optional(),
    leagueId: z
      .string()
      .cuid('Invalid league ID format')
  })
});

/**
 * Validation schema for updating a team
 */
export const updateTeamSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Team name must be at least 2 characters')
      .max(100, 'Team name must not exceed 100 characters')
      .trim()
      .optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF0000)')
      .optional(),
    captainId: z
      .string()
      .cuid('Invalid captain ID format')
      .optional()
  }).refine(
    (data) => Object.keys(data).length > 0,
    {
      message: 'At least one field must be provided for update'
    }
  ),
  params: z.object({
    id: z.string().cuid('Invalid team ID format')
  })
});

/**
 * Validation schema for team ID parameter
 */
export const teamIdParamSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid team ID format')
  })
});

/**
 * Validation schema for joining a team
 */
export const joinTeamSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid team ID format')
  })
});

/**
 * Validation schema for approving a team member
 */
export const approveMemberSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid team ID format'),
    userId: z.string().cuid('Invalid user ID format')
  })
});

/**
 * Validation schema for getting teams by league
 */
export const getTeamsByLeagueSchema = z.object({
  params: z.object({
    leagueId: z.string().cuid('Invalid league ID format')
  })
});

/**
 * Type definitions for validated team requests
 */
export type CreateTeamRequest = z.infer<typeof createTeamSchema>;
export type UpdateTeamRequest = z.infer<typeof updateTeamSchema>;
export type TeamIdParamRequest = z.infer<typeof teamIdParamSchema>;
export type JoinTeamRequest = z.infer<typeof joinTeamSchema>;
export type ApproveMemberRequest = z.infer<typeof approveMemberSchema>;
export type GetTeamsByLeagueRequest = z.infer<typeof getTeamsByLeagueSchema>;