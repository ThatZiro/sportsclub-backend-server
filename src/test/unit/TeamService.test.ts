/**
 * TeamService Unit Tests
 * Tests team service with mocked dependencies
 */

import {
  TeamService,
  TeamNotFoundError,
  DuplicateTeamNameError,
  TeamMembershipError,
  InsufficientPermissionsError,
} from '../../application/services/TeamService';
import {
  ITeamRepository,
  ITeamMemberRepository,
  ILeagueRepository,
  IUserRepository,
} from '../../infrastructure/repositories/interfaces';
import { UserRole, MemberRole, MemberStatus } from '../../domain/enums';

describe('TeamService', () => {
  let teamService: TeamService;
  let mockTeamRepo: jest.Mocked<ITeamRepository>;
  let mockMemberRepo: jest.Mocked<ITeamMemberRepository>;
  let mockLeagueRepo: jest.Mocked<ILeagueRepository>;
  let mockUserRepo: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTeamRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByLeagueId: jest.fn(),
      findByLeagueIdWithSummary: jest.fn(),
      findByCaptainId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByNameAndLeague: jest.fn(),
    };
    mockMemberRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByTeamId: jest.fn(),
      findByTeamIdWithUsers: jest.fn(),
      findByUserId: jest.fn(),
      findByTeamAndUser: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteByTeamAndUser: jest.fn(),
      countByTeamId: jest.fn(),
      countApprovedByTeamId: jest.fn(),
    };
    mockLeagueRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findBySlug: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
    };
    mockUserRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    };
    teamService = new TeamService(
      mockTeamRepo,
      mockMemberRepo,
      mockUserRepo,
      mockLeagueRepo
    );
  });

  describe('createTeam', () => {
    const teamData = {
      name: 'Test Team',
      color: '#FF0000',
      leagueId: 'league-1',
    };
    const captainId = 'user-1';

    it('should create team successfully', async () => {
      // Arrange
      const league = {
        id: 'league-1',
        name: 'Test League',
        slug: 'test-league',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdTeam = {
        id: 'team-1',
        name: teamData.name,
        color: teamData.color,
        leagueId: teamData.leagueId,
        captainId,
        createdAt: new Date(),
      };

      mockLeagueRepo.findById.mockResolvedValue(league);
      mockTeamRepo.findByNameAndLeague.mockResolvedValue(null);
      mockTeamRepo.create.mockResolvedValue(createdTeam);
      mockMemberRepo.create.mockResolvedValue({
        id: 'member-1',
        teamId: 'team-1',
        userId: captainId,
        role: MemberRole.CAPTAIN,
        status: MemberStatus.APPROVED,
        createdAt: new Date(),
      });

      // Act
      const result = await teamService.createTeam(teamData, captainId);

      // Assert
      expect(mockLeagueRepo.findById).toHaveBeenCalledWith(teamData.leagueId);
      expect(mockTeamRepo.findByNameAndLeague).toHaveBeenCalledWith(
        teamData.name,
        teamData.leagueId
      );
      expect(mockTeamRepo.create).toHaveBeenCalledWith({
        ...teamData,
        captainId,
      });
      expect(mockMemberRepo.create).toHaveBeenCalledWith({
        teamId: 'team-1',
        userId: captainId,
        role: MemberRole.CAPTAIN,
        status: MemberStatus.APPROVED,
      });
      expect(result).toEqual(createdTeam);
    });

    it('should throw error if league not found', async () => {
      // Arrange
      mockLeagueRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(teamService.createTeam(teamData, captainId)).rejects.toThrow(
        TeamNotFoundError
      );
    });

    it('should throw error if team name already exists in league', async () => {
      // Arrange
      const league = {
        id: 'league-1',
        name: 'Test League',
        slug: 'test-league',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existingTeam = {
        id: 'existing-team',
        name: teamData.name,
        leagueId: teamData.leagueId,
        captainId: 'other-user',
        createdAt: new Date(),
      };

      mockLeagueRepo.findById.mockResolvedValue(league);
      mockTeamRepo.findByNameAndLeague.mockResolvedValue(existingTeam);

      // Act & Assert
      await expect(teamService.createTeam(teamData, captainId)).rejects.toThrow(
        DuplicateTeamNameError
      );
    });
  });

  describe('joinTeam', () => {
    const teamId = 'team-1';
    const userId = 'user-1';

    it('should join team successfully', async () => {
      // Arrange
      const team = {
        id: teamId,
        name: 'Test Team',
        leagueId: 'league-1',
        captainId: 'captain-1',
        createdAt: new Date(),
      };

      const membership = {
        id: 'member-1',
        teamId,
        userId,
        role: MemberRole.MEMBER,
        status: MemberStatus.PENDING,
        createdAt: new Date(),
      };

      mockTeamRepo.findById.mockResolvedValue(team);
      mockMemberRepo.findByTeamAndUser.mockResolvedValue(null);
      mockMemberRepo.create.mockResolvedValue(membership);

      // Act
      const result = await teamService.joinTeam(teamId, userId);

      // Assert
      expect(mockTeamRepo.findById).toHaveBeenCalledWith(teamId);
      expect(mockMemberRepo.findByTeamAndUser).toHaveBeenCalledWith(
        teamId,
        userId
      );
      expect(mockMemberRepo.create).toHaveBeenCalledWith({
        teamId,
        userId,
        role: MemberRole.MEMBER,
        status: MemberStatus.PENDING,
      });
      expect(result).toEqual(membership);
    });

    it('should throw error if team not found', async () => {
      // Arrange
      mockTeamRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(teamService.joinTeam(teamId, userId)).rejects.toThrow(
        TeamNotFoundError
      );
    });

    it('should throw error if user already member', async () => {
      // Arrange
      const team = {
        id: teamId,
        name: 'Test Team',
        leagueId: 'league-1',
        captainId: 'captain-1',
        createdAt: new Date(),
      };

      const existingMembership = {
        id: 'member-1',
        teamId,
        userId,
        role: MemberRole.MEMBER,
        status: MemberStatus.APPROVED,
        createdAt: new Date(),
      };

      mockTeamRepo.findById.mockResolvedValue(team);
      mockMemberRepo.findByTeamAndUser.mockResolvedValue(existingMembership);

      // Act & Assert
      await expect(teamService.joinTeam(teamId, userId)).rejects.toThrow(
        TeamMembershipError
      );
    });
  });

  describe('approveMember', () => {
    const teamId = 'team-1';
    const userId = 'user-1';
    const approverId = 'captain-1';

    it('should approve member successfully as captain', async () => {
      // Arrange
      const team = {
        id: teamId,
        name: 'Test Team',
        leagueId: 'league-1',
        captainId: approverId,
        createdAt: new Date(),
      };

      const membership = {
        id: 'member-1',
        teamId,
        userId,
        role: MemberRole.MEMBER,
        status: MemberStatus.PENDING,
        createdAt: new Date(),
      };

      const approver = {
        id: approverId,
        email: 'captain@test.com',
        passwordHash: 'hash',
        name: 'Captain',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedMembership = {
        ...membership,
        status: MemberStatus.APPROVED,
      };

      mockTeamRepo.findById.mockResolvedValue(team);
      mockMemberRepo.findByTeamAndUser.mockResolvedValue(membership);
      mockMemberRepo.update.mockResolvedValue(updatedMembership);

      // Act
      const result = await teamService.approveMember(
        teamId,
        userId,
        approverId,
        { approve: true }
      );

      // Assert
      expect(mockMemberRepo.update).toHaveBeenCalledWith(membership.id, {
        status: MemberStatus.APPROVED,
      });
      expect(result).toEqual(updatedMembership);
    });

    it('should approve member successfully as organizer', async () => {
      // Arrange
      const team = {
        id: teamId,
        name: 'Test Team',
        leagueId: 'league-1',
        captainId: 'other-captain',
        createdAt: new Date(),
      };

      const membership = {
        id: 'member-1',
        teamId,
        userId,
        role: MemberRole.MEMBER,
        status: MemberStatus.PENDING,
        createdAt: new Date(),
      };

      const organizer = {
        id: approverId,
        email: 'organizer@test.com',
        passwordHash: 'hash',
        name: 'Organizer',
        role: UserRole.ORGANIZER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedMembership = {
        ...membership,
        status: MemberStatus.APPROVED,
      };

      mockTeamRepo.findById.mockResolvedValue(team);
      mockMemberRepo.findByTeamAndUser.mockResolvedValue(membership);
      mockMemberRepo.update.mockResolvedValue(updatedMembership);

      // Act
      const result = await teamService.approveMember(
        teamId,
        userId,
        approverId,
        { approve: true }
      );

      // Assert
      expect(result).toEqual(updatedMembership);
    });

    it('should throw error if not captain or organizer', async () => {
      // Arrange
      const team = {
        id: teamId,
        name: 'Test Team',
        leagueId: 'league-1',
        captainId: 'other-captain',
        createdAt: new Date(),
      };

      const regularUser = {
        id: approverId,
        email: 'user@test.com',
        passwordHash: 'hash',
        name: 'Regular User',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTeamRepo.findById.mockResolvedValue(team);

      // Act & Assert
      await expect(
        teamService.approveMember(teamId, userId, approverId, { approve: true })
      ).rejects.toThrow(InsufficientPermissionsError);
    });

    it('should throw error if membership not found', async () => {
      // Arrange
      const team = {
        id: teamId,
        name: 'Test Team',
        leagueId: 'league-1',
        captainId: approverId,
        createdAt: new Date(),
      };

      const captain = {
        id: approverId,
        email: 'captain@test.com',
        passwordHash: 'hash',
        name: 'Captain',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTeamRepo.findById.mockResolvedValue(team);
      mockMemberRepo.findByTeamAndUser.mockResolvedValue(null);

      // Act & Assert
      await expect(
        teamService.approveMember(teamId, userId, approverId, { approve: true })
      ).rejects.toThrow(TeamMembershipError);
    });
  });
});
