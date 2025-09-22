/**
 * Team Service
 * Handles team operations including creation, joining, and member management
 */

import {
  ITeamRepository,
  ITeamMemberRepository,
  IUserRepository,
  ILeagueRepository,
} from '../../infrastructure/repositories/interfaces';
import {
  CreateTeamDTO,
  UpdateTeamDTO,
  TeamWithMembersDTO,
  TeamSummaryDTO,
  TeamMembershipDTO,
  TeamMemberDTO,
  ApproveMemberDTO,
} from '../dtos/team.dto';
import {
  CreateTeamData,
  UpdateTeamData,
  CreateTeamMemberData,
  UpdateTeamMemberData,
} from '../../domain/entities';
import { UserRole, MemberRole, MemberStatus } from '../../domain/enums';

/**
 * Custom error classes for team operations
 */
export class TeamNotFoundError extends Error {
  constructor(teamId: string) {
    super(`Team with ID ${teamId} not found`);
    this.name = 'TeamNotFoundError';
  }
}

export class TeamValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TeamValidationError';
  }
}

export class DuplicateTeamNameError extends Error {
  constructor(name: string, _leagueId: string) {
    super(`Team with name '${name}' already exists in this league`);
    this.name = 'DuplicateTeamNameError';
  }
}

export class TeamMembershipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TeamMembershipError';
  }
}

export class InsufficientPermissionsError extends Error {
  constructor(action: string) {
    super(`Insufficient permissions to ${action}`);
    this.name = 'InsufficientPermissionsError';
  }
}

export class TeamService {
  constructor(
    private teamRepository: ITeamRepository,
    private teamMemberRepository: ITeamMemberRepository,
    private userRepository: IUserRepository,
    private leagueRepository: ILeagueRepository
  ) {}

  /**
   * Create a new team with automatic captain assignment
   * Requirements: 4.1, 4.2
   */
  async createTeam(
    teamData: CreateTeamDTO,
    captainId: string
  ): Promise<TeamWithMembersDTO> {
    // Verify captain exists
    const captain = await this.userRepository.findById(captainId);
    if (!captain) {
      throw new TeamValidationError('Captain user not found');
    }

    // Verify league exists
    const league = await this.leagueRepository.findById(teamData.leagueId);
    if (!league) {
      throw new TeamValidationError('League not found');
    }

    // Check for duplicate team name in league
    const existingTeam = await this.teamRepository.findByNameAndLeague(
      teamData.name,
      teamData.leagueId
    );
    if (existingTeam) {
      throw new DuplicateTeamNameError(teamData.name, teamData.leagueId);
    }

    // Create team
    const createTeamData: CreateTeamData = {
      name: teamData.name,
      ...(teamData.color && { color: teamData.color }),
      leagueId: teamData.leagueId,
      captainId: captainId,
    };

    const team = await this.teamRepository.create(createTeamData);

    // Automatically add captain as approved member
    const createMemberData: CreateTeamMemberData = {
      teamId: team.id,
      userId: captainId,
      role: MemberRole.CAPTAIN,
      status: MemberStatus.APPROVED,
    };

    await this.teamMemberRepository.create(createMemberData);

    return this.getTeamById(team.id);
  }

  /**
   * Get team by ID with member details
   * Requirements: 4.3, 8.1
   */
  async getTeamById(teamId: string): Promise<TeamWithMembersDTO> {
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    const membersWithUsers =
      await this.teamMemberRepository.findByTeamIdWithUsers(teamId);
    const captain = await this.userRepository.findById(team.captainId);

    if (!captain) {
      throw new TeamValidationError('Team captain not found');
    }

    const members: TeamMemberDTO[] = membersWithUsers.map(member => ({
      id: member.id,
      userId: member.userId,
      userName: member.userName,
      userEmail: member.userEmail,
      role: member.role,
      status: member.status,
      createdAt: member.createdAt,
    }));

    const memberCount = await this.teamMemberRepository.countByTeamId(teamId);
    const approvedMemberCount =
      await this.teamMemberRepository.countApprovedByTeamId(teamId);

    return {
      id: team.id,
      name: team.name,
      ...(team.color && { color: team.color }),
      leagueId: team.leagueId,
      captainId: team.captainId,
      captainName: captain.name,
      createdAt: team.createdAt,
      members,
      memberCount,
      approvedMemberCount,
    };
  }

  /**
   * Get teams by league with summary information
   * Requirements: 3.2, 3.4
   */
  async getTeamsByLeague(leagueId: string): Promise<TeamSummaryDTO[]> {
    // Verify league exists
    const league = await this.leagueRepository.findById(leagueId);
    if (!league) {
      throw new TeamValidationError('League not found');
    }

    const teamSummaries =
      await this.teamRepository.findByLeagueIdWithSummary(leagueId);

    return teamSummaries.map(summary => ({
      id: summary.id,
      name: summary.name,
      ...(summary.color && { color: summary.color }),
      leagueId: summary.leagueId,
      captainId: summary.captainId,
      captainName: summary.captainName,
      memberCount: summary.memberCount,
      approvedMemberCount: 0, // TODO: Calculate approved member count
      createdAt: summary.createdAt,
    }));
  }

  /**
   * Join a team (create membership request)
   * Requirements: 5.1, 5.2
   */
  async joinTeam(teamId: string, userId: string): Promise<TeamMembershipDTO> {
    // Verify team exists
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new TeamValidationError('User not found');
    }

    // Check if user is already a member
    const existingMembership =
      await this.teamMemberRepository.findByTeamAndUser(teamId, userId);
    if (existingMembership) {
      throw new TeamMembershipError('User is already a member of this team');
    }

    // Determine initial status based on AUTO_APPROVE_JOINS setting
    const autoApprove = process.env['AUTO_APPROVE_JOINS'] === 'true';
    const initialStatus = autoApprove
      ? MemberStatus.APPROVED
      : MemberStatus.PENDING;

    // Create team membership
    const createMemberData: CreateTeamMemberData = {
      teamId: teamId,
      userId: userId,
      role: MemberRole.MEMBER,
      status: initialStatus,
    };

    const membership = await this.teamMemberRepository.create(createMemberData);

    return {
      id: membership.id,
      teamId: teamId,
      teamName: team.name,
      userId: userId,
      role: membership.role,
      status: membership.status,
      createdAt: membership.createdAt,
    };
  }

  /**
   * Approve or reject a team member
   * Requirements: 6.1, 6.2, 6.3
   */
  async approveMember(
    teamId: string,
    userId: string,
    approverId: string,
    approval: ApproveMemberDTO
  ): Promise<TeamMembershipDTO> {
    // Verify team exists
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    // Verify approver exists and has permission
    const approver = await this.userRepository.findById(approverId);
    if (!approver) {
      throw new TeamValidationError('Approver not found');
    }

    // Check if approver has permission (captain of team or organizer/admin)
    const canApprove =
      team.captainId === approverId ||
      approver.role === UserRole.ORGANIZER ||
      approver.role === UserRole.ADMIN;

    if (!canApprove) {
      throw new InsufficientPermissionsError('approve team members');
    }

    // Find the membership
    const membership = await this.teamMemberRepository.findByTeamAndUser(
      teamId,
      userId
    );
    if (!membership) {
      throw new TeamMembershipError('Team membership not found');
    }

    // Update membership status
    const newStatus = approval.approve
      ? MemberStatus.APPROVED
      : MemberStatus.REJECTED;
    const updateData: UpdateTeamMemberData = {
      status: newStatus,
    };

    const updatedMembership = await this.teamMemberRepository.update(
      membership.id,
      updateData
    );

    return {
      id: updatedMembership.id,
      teamId: teamId,
      teamName: team.name,
      userId: userId,
      role: updatedMembership.role,
      status: updatedMembership.status,
      createdAt: updatedMembership.createdAt,
    };
  }

  /**
   * Update team information (captain or organizer only)
   * Requirements: 8.2
   */
  async updateTeam(
    teamId: string,
    updates: UpdateTeamDTO,
    requestingUserId: string
  ): Promise<TeamWithMembersDTO> {
    // Verify team exists
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    // Verify requesting user has permission
    const requestingUser = await this.userRepository.findById(requestingUserId);
    if (!requestingUser) {
      throw new TeamValidationError('Requesting user not found');
    }

    const canUpdate =
      team.captainId === requestingUserId ||
      requestingUser.role === UserRole.ORGANIZER ||
      requestingUser.role === UserRole.ADMIN;

    if (!canUpdate) {
      throw new InsufficientPermissionsError('update team');
    }

    // Check for duplicate team name if name is being updated
    if (updates.name && updates.name !== team.name) {
      const existingTeam = await this.teamRepository.findByNameAndLeague(
        updates.name,
        team.leagueId
      );
      if (existingTeam) {
        throw new DuplicateTeamNameError(updates.name, team.leagueId);
      }
    }

    // Prepare update data
    const updateData: UpdateTeamData = {};
    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.color !== undefined) {
      updateData.color = updates.color;
    }

    await this.teamRepository.update(teamId, updateData);

    return this.getTeamById(teamId);
  }

  /**
   * Delete team (organizer/admin only)
   * Requirements: 8.3
   */
  async deleteTeam(teamId: string, requestingUserId: string): Promise<void> {
    // Verify team exists
    const team = await this.teamRepository.findById(teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    // Verify requesting user has permission (only organizers/admins can delete teams)
    const requestingUser = await this.userRepository.findById(requestingUserId);
    if (!requestingUser) {
      throw new TeamValidationError('Requesting user not found');
    }

    if (
      requestingUser.role !== UserRole.ORGANIZER &&
      requestingUser.role !== UserRole.ADMIN
    ) {
      throw new InsufficientPermissionsError('delete team');
    }

    await this.teamRepository.delete(teamId);
  }

  /**
   * Get user's team memberships
   * Requirements: User team management
   */
  async getUserTeamMemberships(userId: string): Promise<TeamMembershipDTO[]> {
    const memberships = await this.teamMemberRepository.findByUserId(userId);

    const membershipDTOs: TeamMembershipDTO[] = [];

    for (const membership of memberships) {
      const team = await this.teamRepository.findById(membership.teamId);
      if (team) {
        membershipDTOs.push({
          id: membership.id,
          teamId: membership.teamId,
          teamName: team.name,
          userId: membership.userId,
          role: membership.role,
          status: membership.status,
          createdAt: membership.createdAt,
        });
      }
    }

    return membershipDTOs;
  }
}
