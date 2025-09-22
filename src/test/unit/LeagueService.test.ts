/**
 * LeagueService Unit Tests
 * Tests league service with mocked dependencies
 */

import {
  LeagueService,
  LeagueNotFoundError,
  LeagueValidationError,
  DuplicateLeagueSlugError,
} from '../../application/services/LeagueService';
import { ILeagueRepository } from '../../infrastructure/repositories/interfaces';

describe('LeagueService', () => {
  let leagueService: LeagueService;
  let mockLeagueRepo: jest.Mocked<ILeagueRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLeagueRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
    };
    leagueService = new LeagueService(mockLeagueRepo);
  });

  describe('getLeagueBySlug', () => {
    it('should return league by slug successfully', async () => {
      // Arrange
      const slug = 'test-league';
      const league = {
        id: 'league-1',
        name: 'Test League',
        slug,
        season: 'Spring 2024',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeagueRepo.findBySlug.mockResolvedValue(league);

      // Act
      const result = await leagueService.getLeagueBySlug(slug);

      // Assert
      expect(mockLeagueRepo.findBySlug).toHaveBeenCalledWith(slug);
      expect(result).toEqual(league);
    });

    it('should throw error if league not found', async () => {
      // Arrange
      const slug = 'non-existent';
      mockLeagueRepo.findBySlug.mockResolvedValue(null);

      // Act & Assert
      await expect(leagueService.getLeagueBySlug(slug)).rejects.toThrow(
        LeagueNotFoundError
      );
    });
  });

  describe('createLeague', () => {
    const leagueData = {
      name: 'New League',
      season: 'Fall 2024',
    };

    it('should create league successfully', async () => {
      // Arrange
      const createdLeague = {
        id: 'league-1',
        name: leagueData.name,
        slug: 'new-league',
        season: leagueData.season,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeagueRepo.findBySlug.mockResolvedValue(null);
      mockLeagueRepo.create.mockResolvedValue(createdLeague);

      // Act
      const result = await leagueService.createLeague(leagueData);

      // Assert
      expect(mockLeagueRepo.findBySlug).toHaveBeenCalledWith('new-league');
      expect(mockLeagueRepo.create).toHaveBeenCalledWith({
        name: leagueData.name,
        slug: 'new-league',
        season: leagueData.season,
      });
      expect(result).toEqual(createdLeague);
    });

    it('should throw error if slug already exists', async () => {
      // Arrange
      const existingLeague = {
        id: 'existing-league',
        name: 'Existing League',
        slug: 'new-league',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeagueRepo.findBySlug.mockResolvedValue(existingLeague);

      // Act & Assert
      await expect(leagueService.createLeague(leagueData)).rejects.toThrow(
        DuplicateLeagueSlugError
      );
    });

    it('should validate league name', async () => {
      // Arrange
      const invalidData = { ...leagueData, name: 'A' }; // Too short

      // Act & Assert
      await expect(leagueService.createLeague(invalidData)).rejects.toThrow(
        LeagueValidationError
      );
    });
  });

  describe('updateLeague', () => {
    const leagueId = 'league-1';
    const existingLeague = {
      id: leagueId,
      name: 'Test League',
      slug: 'test-league',
      season: 'Spring 2024',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should update league successfully', async () => {
      // Arrange
      const updates = {
        name: 'Updated League',
        season: 'Summer 2024',
      };

      const updatedLeague = {
        ...existingLeague,
        ...updates,
        slug: 'updated-league',
        updatedAt: new Date(),
      };

      mockLeagueRepo.findById.mockResolvedValue(existingLeague);
      mockLeagueRepo.findBySlug.mockResolvedValue(null);
      mockLeagueRepo.update.mockResolvedValue(updatedLeague);

      // Act
      const result = await leagueService.updateLeague(leagueId, updates);

      // Assert
      expect(mockLeagueRepo.findById).toHaveBeenCalledWith(leagueId);
      expect(mockLeagueRepo.update).toHaveBeenCalledWith(leagueId, {
        ...updates,
        slug: 'updated-league',
      });
      expect(result).toEqual(updatedLeague);
    });

    it('should throw error if league not found', async () => {
      // Arrange
      const updates = { name: 'Updated League' };
      mockLeagueRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        leagueService.updateLeague(leagueId, updates)
      ).rejects.toThrow(LeagueNotFoundError);
    });
  });

  describe('deleteLeague', () => {
    const leagueId = 'league-1';

    it('should delete league successfully', async () => {
      // Arrange
      const league = {
        id: leagueId,
        name: 'Test League',
        slug: 'test-league',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockLeagueRepo.findById.mockResolvedValue(league);
      mockLeagueRepo.delete.mockResolvedValue(undefined);

      // Act
      await leagueService.deleteLeague(leagueId);

      // Assert
      expect(mockLeagueRepo.findById).toHaveBeenCalledWith(leagueId);
      expect(mockLeagueRepo.delete).toHaveBeenCalledWith(leagueId);
    });

    it('should throw error if league not found', async () => {
      // Arrange
      mockLeagueRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(leagueService.deleteLeague(leagueId)).rejects.toThrow(
        LeagueNotFoundError
      );
    });
  });

  describe('getAllLeagues', () => {
    it('should return all leagues', async () => {
      // Arrange
      const leagues = [
        {
          id: 'league-1',
          name: 'League 1',
          slug: 'league-1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'league-2',
          name: 'League 2',
          slug: 'league-2',
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockLeagueRepo.findAll.mockResolvedValue(leagues);

      // Act
      const result = await leagueService.getAllLeagues();

      // Assert
      expect(mockLeagueRepo.findAll).toHaveBeenCalled();
      expect(result).toEqual(leagues);
    });
  });
});
