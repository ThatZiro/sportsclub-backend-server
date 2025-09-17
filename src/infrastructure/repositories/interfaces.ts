/**
 * Repository interfaces for the infrastructure layer
 * Defines contracts for data access operations
 */

import {
  User,
  CreateUserData,
  UpdateUserData,
  League,
  CreateLeagueData,
  UpdateLeagueData,
  Team,
  CreateTeamData,
  UpdateTeamData,
  TeamSummary,
  TeamMember,
  CreateTeamMemberData,
  UpdateTeamMemberData,
  TeamMemberWithUser
} from '../../domain/entities';

/**
 * User repository interface
 * Handles CRUD operations for users
 */
export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
  findAll(): Promise<User[]>;
}

/**
 * League repository interface
 * Handles CRUD operations for leagues
 */
export interface ILeagueRepository {
  create(data: CreateLeagueData): Promise<League>;
  findById(id: string): Promise<League | null>;
  findBySlug(slug: string): Promise<League | null>;
  update(id: string, data: UpdateLeagueData): Promise<League>;
  delete(id: string): Promise<void>;
  findAll(): Promise<League[]>;
  findActive(): Promise<League[]>;
}

/**
 * Team repository interface
 * Handles CRUD operations for teams
 */
export interface ITeamRepository {
  create(data: CreateTeamData): Promise<Team>;
  findById(id: string): Promise<Team | null>;
  findByLeagueId(leagueId: string): Promise<Team[]>;
  findByLeagueIdWithSummary(leagueId: string): Promise<TeamSummary[]>;
  findByCaptainId(captainId: string): Promise<Team[]>;
  update(id: string, data: UpdateTeamData): Promise<Team>;
  delete(id: string): Promise<void>;
  findByNameAndLeague(name: string, leagueId: string): Promise<Team | null>;
}

/**
 * TeamMember repository interface
 * Handles membership management operations
 */
export interface ITeamMemberRepository {
  create(data: CreateTeamMemberData): Promise<TeamMember>;
  findById(id: string): Promise<TeamMember | null>;
  findByTeamId(teamId: string): Promise<TeamMember[]>;
  findByTeamIdWithUsers(teamId: string): Promise<TeamMemberWithUser[]>;
  findByUserId(userId: string): Promise<TeamMember[]>;
  findByTeamAndUser(teamId: string, userId: string): Promise<TeamMember | null>;
  update(id: string, data: UpdateTeamMemberData): Promise<TeamMember>;
  delete(id: string): Promise<void>;
  deleteByTeamAndUser(teamId: string, userId: string): Promise<void>;
  countByTeamId(teamId: string): Promise<number>;
  countApprovedByTeamId(teamId: string): Promise<number>;
}