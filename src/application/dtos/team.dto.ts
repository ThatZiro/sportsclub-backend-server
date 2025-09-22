/**
 * Team Data Transfer Objects
 * Defines the structure for team-related data
 */

import { z } from 'zod';
import { MemberRole, MemberStatus } from '../../domain/enums';

/**
 * Create team DTO
 */
export const CreateTeamDTOSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .max(100, 'Team name must be less than 100 characters'),
  color: z
    .string()
    .max(50, 'Team color must be less than 50 characters')
    .optional(),
  leagueId: z.string().min(1, 'League ID is required'),
});

export type CreateTeamDTO = z.infer<typeof CreateTeamDTOSchema>;

/**
 * Update team DTO
 */
export const UpdateTeamDTOSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Team name is required')
      .max(100, 'Team name must be less than 100 characters')
      .optional(),
    color: z
      .string()
      .max(50, 'Team color must be less than 50 characters')
      .optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export type UpdateTeamDTO = z.infer<typeof UpdateTeamDTOSchema>;

/**
 * Team member DTO
 */
export interface TeamMemberDTO {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: Date;
}

/**
 * Team with members DTO
 */
export interface TeamWithMembersDTO {
  id: string;
  name: string;
  color?: string;
  leagueId: string;
  captainId: string;
  captainName: string;
  createdAt: Date;
  members: TeamMemberDTO[];
  memberCount: number;
  approvedMemberCount: number;
}

/**
 * Team summary DTO (for listings)
 */
export interface TeamSummaryDTO {
  id: string;
  name: string;
  color?: string;
  leagueId: string;
  captainId: string;
  captainName: string;
  memberCount: number;
  approvedMemberCount: number;
  createdAt: Date;
}

/**
 * Join team request DTO
 */
export const JoinTeamDTOSchema = z.object({
  // No additional fields needed - user ID comes from auth context
});

export type JoinTeamDTO = z.infer<typeof JoinTeamDTOSchema>;

/**
 * Approve member DTO
 */
export const ApproveMemberDTOSchema = z.object({
  approve: z.boolean().default(true),
});

export type ApproveMemberDTO = z.infer<typeof ApproveMemberDTOSchema>;

/**
 * Team membership result DTO
 */
export interface TeamMembershipDTO {
  id: string;
  teamId: string;
  teamName: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  createdAt: Date;
}
