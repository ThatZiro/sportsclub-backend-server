/**
 * Team repository implementation
 * Handles CRUD operations for teams using Prisma
 */

import { prisma } from '../database';
import { ITeamRepository } from './interfaces';
import {
  Team,
  CreateTeamData,
  UpdateTeamData,
  TeamSummary,
  TeamDomain,
} from '../../domain/entities';
import { MemberStatus } from '../../domain/enums';

export class TeamRepository implements ITeamRepository {
  /**
   * Creates a new team
   */
  async create(data: CreateTeamData): Promise<Team> {
    // Validate and prepare data using domain logic
    const errors = TeamDomain.validateCreateData(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const preparedData = TeamDomain.prepareCreateData(data);

    const team = await prisma.team.create({
      data: {
        name: preparedData.name,
        color: preparedData.color || null,
        leagueId: preparedData.leagueId,
        captainId: preparedData.captainId,
      },
    });

    return this.mapPrismaTeamToEntity(team);
  }

  /**
   * Finds a team by ID
   */
  async findById(id: string): Promise<Team | null> {
    const team = await prisma.team.findUnique({
      where: { id },
    });

    return team ? this.mapPrismaTeamToEntity(team) : null;
  }

  /**
   * Finds teams by league ID
   */
  async findByLeagueId(leagueId: string): Promise<Team[]> {
    const teams = await prisma.team.findMany({
      where: { leagueId },
      orderBy: { createdAt: 'asc' },
    });

    return teams.map(team => this.mapPrismaTeamToEntity(team));
  }

  /**
   * Finds teams by league ID with summary information
   */
  async findByLeagueIdWithSummary(leagueId: string): Promise<TeamSummary[]> {
    const teams = await prisma.team.findMany({
      where: { leagueId },
      include: {
        captain: {
          select: {
            name: true,
          },
        },
        members: {
          where: {
            status: MemberStatus.APPROVED,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return teams.map(team => {
      const summary: TeamSummary = {
        id: team.id,
        name: team.name,
        leagueId: team.leagueId,
        captainId: team.captainId,
        captainName: team.captain.name,
        memberCount: team.members.length,
        createdAt: team.createdAt,
      };

      if (team.color) {
        summary.color = team.color;
      }

      return summary;
    });
  }

  /**
   * Finds teams by captain ID
   */
  async findByCaptainId(captainId: string): Promise<Team[]> {
    const teams = await prisma.team.findMany({
      where: { captainId },
      orderBy: { createdAt: 'desc' },
    });

    return teams.map(team => this.mapPrismaTeamToEntity(team));
  }

  /**
   * Updates a team
   */
  async update(id: string, data: UpdateTeamData): Promise<Team> {
    // Validate and prepare data using domain logic
    const errors = TeamDomain.validateUpdateData(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const preparedData = TeamDomain.prepareUpdateData(data);

    const team = await prisma.team.update({
      where: { id },
      data: {
        ...(preparedData.name && { name: preparedData.name }),
        ...(preparedData.color !== undefined && { color: preparedData.color }),
        ...(preparedData.captainId && { captainId: preparedData.captainId }),
      },
    });

    return this.mapPrismaTeamToEntity(team);
  }

  /**
   * Deletes a team
   */
  async delete(id: string): Promise<void> {
    await prisma.team.delete({
      where: { id },
    });
  }

  /**
   * Finds a team by name and league (for uniqueness checking)
   */
  async findByNameAndLeague(
    name: string,
    leagueId: string
  ): Promise<Team | null> {
    const team = await prisma.team.findFirst({
      where: {
        name: name.trim(),
        leagueId,
      },
    });

    return team ? this.mapPrismaTeamToEntity(team) : null;
  }

  /**
   * Maps Prisma team object to domain entity
   */
  private mapPrismaTeamToEntity(prismaTeam: any): Team {
    return {
      id: prismaTeam.id,
      name: prismaTeam.name,
      color: prismaTeam.color,
      leagueId: prismaTeam.leagueId,
      captainId: prismaTeam.captainId,
      createdAt: prismaTeam.createdAt,
    };
  }
}
