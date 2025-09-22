/**
 * TeamMember repository implementation
 * Handles membership management operations using Prisma
 */

import { prisma } from '../database';
import { ITeamMemberRepository } from './interfaces';
import {
  TeamMember,
  CreateTeamMemberData,
  UpdateTeamMemberData,
  TeamMemberWithUser,
  TeamMemberDomain,
} from '../../domain/entities';
import { MemberRole, MemberStatus } from '../../domain/enums';

export class TeamMemberRepository implements ITeamMemberRepository {
  /**
   * Creates a new team member
   */
  async create(data: CreateTeamMemberData): Promise<TeamMember> {
    // Validate and prepare data using domain logic
    const errors = TeamMemberDomain.validateCreateData(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const preparedData = TeamMemberDomain.prepareCreateData(data);

    const teamMember = await prisma.teamMember.create({
      data: {
        teamId: preparedData.teamId,
        userId: preparedData.userId,
        role: preparedData.role!,
        status: preparedData.status!,
      },
    });

    return this.mapPrismaTeamMemberToEntity(teamMember);
  }

  /**
   * Finds a team member by ID
   */
  async findById(id: string): Promise<TeamMember | null> {
    const teamMember = await prisma.teamMember.findUnique({
      where: { id },
    });

    return teamMember ? this.mapPrismaTeamMemberToEntity(teamMember) : null;
  }

  /**
   * Finds all team members by team ID
   */
  async findByTeamId(teamId: string): Promise<TeamMember[]> {
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId },
      orderBy: [
        { role: 'asc' }, // Captains first
        { createdAt: 'asc' },
      ],
    });

    return teamMembers.map(member => this.mapPrismaTeamMemberToEntity(member));
  }

  /**
   * Finds team members by team ID with user details
   */
  async findByTeamIdWithUsers(teamId: string): Promise<TeamMemberWithUser[]> {
    const teamMembers = await prisma.teamMember.findMany({
      where: { teamId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' }, // Captains first
        { createdAt: 'asc' },
      ],
    });

    return teamMembers.map(member => ({
      id: member.id,
      teamId: member.teamId,
      userId: member.userId,
      role: member.role as MemberRole,
      status: member.status as MemberStatus,
      createdAt: member.createdAt,
      userName: member.user.name,
      userEmail: member.user.email,
    }));
  }

  /**
   * Finds all team memberships by user ID
   */
  async findByUserId(userId: string): Promise<TeamMember[]> {
    const teamMembers = await prisma.teamMember.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return teamMembers.map(member => this.mapPrismaTeamMemberToEntity(member));
  }

  /**
   * Finds a specific team membership by team and user
   */
  async findByTeamAndUser(
    teamId: string,
    userId: string
  ): Promise<TeamMember | null> {
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        unique_team_membership: {
          teamId,
          userId,
        },
      },
    });

    return teamMember ? this.mapPrismaTeamMemberToEntity(teamMember) : null;
  }

  /**
   * Updates a team member
   */
  async update(id: string, data: UpdateTeamMemberData): Promise<TeamMember> {
    // Validate data using domain logic
    const errors = TeamMemberDomain.validateUpdateData(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const teamMember = await prisma.teamMember.update({
      where: { id },
      data: {
        ...(data.role && { role: data.role }),
        ...(data.status && { status: data.status }),
      },
    });

    return this.mapPrismaTeamMemberToEntity(teamMember);
  }

  /**
   * Deletes a team member
   */
  async delete(id: string): Promise<void> {
    await prisma.teamMember.delete({
      where: { id },
    });
  }

  /**
   * Deletes a team membership by team and user
   */
  async deleteByTeamAndUser(teamId: string, userId: string): Promise<void> {
    await prisma.teamMember.delete({
      where: {
        unique_team_membership: {
          teamId,
          userId,
        },
      },
    });
  }

  /**
   * Counts total members in a team
   */
  async countByTeamId(teamId: string): Promise<number> {
    return await prisma.teamMember.count({
      where: { teamId },
    });
  }

  /**
   * Counts approved members in a team
   */
  async countApprovedByTeamId(teamId: string): Promise<number> {
    return await prisma.teamMember.count({
      where: {
        teamId,
        status: MemberStatus.APPROVED,
      },
    });
  }

  /**
   * Maps Prisma team member object to domain entity
   */
  private mapPrismaTeamMemberToEntity(prismaTeamMember: any): TeamMember {
    return {
      id: prismaTeamMember.id,
      teamId: prismaTeamMember.teamId,
      userId: prismaTeamMember.userId,
      role: prismaTeamMember.role as MemberRole,
      status: prismaTeamMember.status as MemberStatus,
      createdAt: prismaTeamMember.createdAt,
    };
  }
}
