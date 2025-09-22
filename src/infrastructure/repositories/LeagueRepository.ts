/**
 * League repository implementation
 * Handles CRUD operations for leagues using Prisma
 */

import { prisma } from '../database';
import { ILeagueRepository } from './interfaces';
import {
  League,
  CreateLeagueData,
  UpdateLeagueData,
  LeagueDomain,
} from '../../domain/entities';

export class LeagueRepository implements ILeagueRepository {
  /**
   * Creates a new league
   */
  async create(data: CreateLeagueData): Promise<League> {
    // Validate data using domain logic
    const errors = LeagueDomain.validateCreateData(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const league = await prisma.league.create({
      data: {
        name: data.name,
        slug: data.slug,
        season: data.season || null,
        isActive: data.isActive ?? true,
      },
    });

    return this.mapPrismaLeagueToEntity(league);
  }

  /**
   * Finds a league by ID
   */
  async findById(id: string): Promise<League | null> {
    const league = await prisma.league.findUnique({
      where: { id },
    });

    return league ? this.mapPrismaLeagueToEntity(league) : null;
  }

  /**
   * Finds a league by slug
   */
  async findBySlug(slug: string): Promise<League | null> {
    const league = await prisma.league.findUnique({
      where: { slug },
    });

    return league ? this.mapPrismaLeagueToEntity(league) : null;
  }

  /**
   * Updates a league
   */
  async update(id: string, data: UpdateLeagueData): Promise<League> {
    // Validate data using domain logic
    const errors = LeagueDomain.validateUpdateData(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }

    const league = await prisma.league.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.season !== undefined && { season: data.season }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return this.mapPrismaLeagueToEntity(league);
  }

  /**
   * Deletes a league
   */
  async delete(id: string): Promise<void> {
    await prisma.league.delete({
      where: { id },
    });
  }

  /**
   * Finds all leagues
   */
  async findAll(): Promise<League[]> {
    const leagues = await prisma.league.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return leagues.map(league => this.mapPrismaLeagueToEntity(league));
  }

  /**
   * Finds all active leagues
   */
  async findActive(): Promise<League[]> {
    const leagues = await prisma.league.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return leagues.map(league => this.mapPrismaLeagueToEntity(league));
  }

  /**
   * Maps Prisma league object to domain entity
   */
  private mapPrismaLeagueToEntity(prismaLeague: any): League {
    return {
      id: prismaLeague.id,
      name: prismaLeague.name,
      slug: prismaLeague.slug,
      season: prismaLeague.season,
      isActive: prismaLeague.isActive,
      createdAt: prismaLeague.createdAt,
      updatedAt: prismaLeague.updatedAt,
    };
  }
}
