/**
 * League Service
 * Handles league management operations
 */

import {
  ILeagueRepository,
  IUserRepository,
} from '../../infrastructure/repositories/interfaces';
import {
  CreateLeagueDTO,
  UpdateLeagueDTO,
  LeagueDTO,
  PublicLeagueDTO,
} from '../dtos/league.dto';
import {
  League,
  CreateLeagueData,
  UpdateLeagueData,
} from '../../domain/entities';
import { UserRole } from '../../domain/enums';

/**
 * Custom error classes for league operations
 */
export class LeagueNotFoundError extends Error {
  constructor(identifier: string) {
    super(`League with identifier ${identifier} not found`);
    this.name = 'LeagueNotFoundError';
  }
}

export class LeagueValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LeagueValidationError';
  }
}

export class DuplicateLeagueSlugError extends Error {
  constructor(slug: string) {
    super(`League with slug '${slug}' already exists`);
    this.name = 'DuplicateLeagueSlugError';
  }
}

export class InsufficientPermissionsError extends Error {
  constructor(action: string) {
    super(`Insufficient permissions to ${action}`);
    this.name = 'InsufficientPermissionsError';
  }
}

export class LeagueService {
  constructor(
    private leagueRepository: ILeagueRepository,
    private userRepository: IUserRepository
  ) {}

  /**
   * Get league by slug (public access)
   * Requirements: 3.1
   */
  async getLeagueBySlug(slug: string): Promise<PublicLeagueDTO> {
    const league = await this.leagueRepository.findBySlug(slug);
    if (!league) {
      throw new LeagueNotFoundError(slug);
    }

    return this.mapToPublicDTO(league);
  }

  /**
   * Create a new league (organizer/admin only)
   * Requirements: 7.1
   */
  async createLeague(
    leagueData: CreateLeagueDTO,
    requestingUserId: string
  ): Promise<LeagueDTO> {
    // Verify user permissions
    await this.verifyOrganizerPermissions(requestingUserId);

    // Check if slug already exists
    const existingLeague = await this.leagueRepository.findBySlug(
      leagueData.slug
    );
    if (existingLeague) {
      throw new DuplicateLeagueSlugError(leagueData.slug);
    }

    // Create league data
    const createData: CreateLeagueData = {
      name: leagueData.name,
      slug: leagueData.slug,
      ...(leagueData.season && { season: leagueData.season }),
      isActive: leagueData.isActive ?? true,
    };

    const league = await this.leagueRepository.create(createData);
    return this.mapToDTO(league);
  }

  /**
   * Update league information (organizer/admin only)
   * Requirements: 7.2
   */
  async updateLeague(
    leagueId: string,
    updates: UpdateLeagueDTO,
    requestingUserId: string
  ): Promise<LeagueDTO> {
    // Verify user permissions
    await this.verifyOrganizerPermissions(requestingUserId);

    // Check if league exists
    const existingLeague = await this.leagueRepository.findById(leagueId);
    if (!existingLeague) {
      throw new LeagueNotFoundError(leagueId);
    }

    // If slug is being updated, check for duplicates
    if (updates.slug && updates.slug !== existingLeague.slug) {
      const leagueWithSlug = await this.leagueRepository.findBySlug(
        updates.slug
      );
      if (leagueWithSlug) {
        throw new DuplicateLeagueSlugError(updates.slug);
      }
    }

    // Prepare update data
    const updateData: UpdateLeagueData = {};
    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.slug !== undefined) {
      updateData.slug = updates.slug;
    }
    if (updates.season !== undefined) {
      updateData.season = updates.season;
    }
    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive;
    }

    const updatedLeague = await this.leagueRepository.update(
      leagueId,
      updateData
    );
    return this.mapToDTO(updatedLeague);
  }

  /**
   * Delete league (organizer/admin only)
   * Requirements: 7.3
   */
  async deleteLeague(
    leagueId: string,
    requestingUserId: string
  ): Promise<void> {
    // Verify user permissions
    await this.verifyOrganizerPermissions(requestingUserId);

    // Check if league exists
    const existingLeague = await this.leagueRepository.findById(leagueId);
    if (!existingLeague) {
      throw new LeagueNotFoundError(leagueId);
    }

    await this.leagueRepository.delete(leagueId);
  }

  /**
   * Get all leagues (organizer/admin only)
   * Requirements: 7.1, 7.2, 7.3
   */
  async getAllLeagues(requestingUserId: string): Promise<LeagueDTO[]> {
    // Verify user permissions
    await this.verifyOrganizerPermissions(requestingUserId);

    const leagues = await this.leagueRepository.findAll();
    return leagues.map(league => this.mapToDTO(league));
  }

  /**
   * Get league by ID (organizer/admin only)
   * Requirements: 7.1, 7.2, 7.3
   */
  async getLeagueById(
    leagueId: string,
    requestingUserId: string
  ): Promise<LeagueDTO> {
    // Verify user permissions
    await this.verifyOrganizerPermissions(requestingUserId);

    const league = await this.leagueRepository.findById(leagueId);
    if (!league) {
      throw new LeagueNotFoundError(leagueId);
    }

    return this.mapToDTO(league);
  }

  /**
   * Get active leagues (public access)
   * Requirements: 3.1
   */
  async getActiveLeagues(): Promise<PublicLeagueDTO[]> {
    const leagues = await this.leagueRepository.findActive();
    return leagues.map(league => this.mapToPublicDTO(league));
  }

  /**
   * Verify that the requesting user has organizer permissions
   * Private helper method
   */
  private async verifyOrganizerPermissions(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new LeagueValidationError('User not found');
    }

    if (user.role !== UserRole.ORGANIZER && user.role !== UserRole.ADMIN) {
      throw new InsufficientPermissionsError('manage leagues');
    }
  }

  /**
   * Map League entity to LeagueDTO
   * Private helper method
   */
  private mapToDTO(league: League): LeagueDTO {
    return {
      id: league.id,
      name: league.name,
      slug: league.slug,
      ...(league.season && { season: league.season }),
      isActive: league.isActive,
      createdAt: league.createdAt,
      updatedAt: league.updatedAt,
    };
  }

  /**
   * Map League entity to PublicLeagueDTO (excludes timestamps)
   * Private helper method
   */
  private mapToPublicDTO(league: League): PublicLeagueDTO {
    return {
      id: league.id,
      name: league.name,
      slug: league.slug,
      ...(league.season && { season: league.season }),
      isActive: league.isActive,
    };
  }
}
