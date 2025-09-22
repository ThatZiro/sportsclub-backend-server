/**
 * Repository integration tests
 * Tests the repository implementations with a test database
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from '@jest/globals';
import { prisma } from '../infrastructure/database';
import {
  UserRepository,
  LeagueRepository,
  TeamRepository,
  TeamMemberRepository,
} from '../infrastructure/repositories';
import { UserRole, MemberRole, MemberStatus } from '../domain/enums';

describe('Repository Integration Tests', () => {
  let userRepo: UserRepository;
  let leagueRepo: LeagueRepository;
  let teamRepo: TeamRepository;
  let memberRepo: TeamMemberRepository;

  beforeAll(async () => {
    userRepo = new UserRepository();
    leagueRepo = new LeagueRepository();
    teamRepo = new TeamRepository();
    memberRepo = new TeamMemberRepository();
  });

  beforeEach(async () => {
    // Clean up test data
    try {
      await prisma.teamMember.deleteMany();
      await prisma.team.deleteMany();
      await prisma.league.deleteMany();
      await prisma.user.deleteMany();
    } catch (error) {
      // Ignore errors during cleanup (tables might not exist yet)
      console.warn('Warning during test cleanup:', error);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('UserRepository', () => {
    it('should create and find a user', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        name: 'Test User',
      };

      const user = await userRepo.create(userData);
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(UserRole.USER);

      const foundUser = await userRepo.findById(user.id);
      expect(foundUser).toEqual(user);

      const foundByEmail = await userRepo.findByEmail(userData.email);
      expect(foundByEmail).toEqual(user);
    });
  });

  describe('LeagueRepository', () => {
    it('should create and find a league', async () => {
      const leagueData = {
        name: 'Test League',
        slug: 'test-league',
        season: 'Spring 2024',
      };

      const league = await leagueRepo.create(leagueData);
      expect(league.id).toBeDefined();
      expect(league.slug).toBe(leagueData.slug);
      expect(league.isActive).toBe(true);

      const foundLeague = await leagueRepo.findBySlug(leagueData.slug);
      expect(foundLeague).toEqual(league);
    });
  });

  describe('TeamRepository', () => {
    it('should create and find a team', async () => {
      // Create prerequisites
      const user = await userRepo.create({
        email: 'captain@example.com',
        passwordHash: 'hashedpassword',
        name: 'Captain User',
      });

      const league = await leagueRepo.create({
        name: 'Test League',
        slug: 'test-league',
      });

      const teamData = {
        name: 'Test Team',
        color: '#FF0000',
        leagueId: league.id,
        captainId: user.id,
      };

      const team = await teamRepo.create(teamData);
      expect(team.id).toBeDefined();
      expect(team.name).toBe(teamData.name);
      expect(team.captainId).toBe(user.id);

      const foundTeam = await teamRepo.findById(team.id);
      expect(foundTeam).toEqual(team);
    });
  });

  describe('TeamMemberRepository', () => {
    it('should create and find team members', async () => {
      // Create prerequisites
      const captain = await userRepo.create({
        email: 'captain@example.com',
        passwordHash: 'hashedpassword',
        name: 'Captain User',
      });

      const member = await userRepo.create({
        email: 'member@example.com',
        passwordHash: 'hashedpassword',
        name: 'Member User',
      });

      const league = await leagueRepo.create({
        name: 'Test League',
        slug: 'test-league',
      });

      const team = await teamRepo.create({
        name: 'Test Team',
        leagueId: league.id,
        captainId: captain.id,
      });

      // Create captain membership
      const captainMember = await memberRepo.create({
        teamId: team.id,
        userId: captain.id,
        role: MemberRole.CAPTAIN,
        status: MemberStatus.APPROVED,
      });

      // Create regular membership
      const regularMember = await memberRepo.create({
        teamId: team.id,
        userId: member.id,
        role: MemberRole.MEMBER,
        status: MemberStatus.PENDING,
      });

      expect(captainMember.role).toBe(MemberRole.CAPTAIN);
      expect(regularMember.status).toBe(MemberStatus.PENDING);

      const teamMembers = await memberRepo.findByTeamId(team.id);
      expect(teamMembers).toHaveLength(2);

      const memberCount = await memberRepo.countByTeamId(team.id);
      expect(memberCount).toBe(2);

      const approvedCount = await memberRepo.countApprovedByTeamId(team.id);
      expect(approvedCount).toBe(1);
    });
  });
});
