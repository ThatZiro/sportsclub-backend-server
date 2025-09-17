/**
 * Repository validation tests
 * Tests the validation logic in repositories without database connection
 */

import { describe, it, expect } from '@jest/globals';
import {
  UserRepository,
  LeagueRepository,
  TeamRepository,
  TeamMemberRepository
} from '../infrastructure/repositories';

// Mock Prisma to avoid database connection
jest.mock('../infrastructure/database', () => ({
  prisma: {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn()
    },
    league: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn()
    },
    team: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn()
    },
    teamMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    }
  }
}));

describe('Repository Validation Tests', () => {
  let userRepo: UserRepository;
  let leagueRepo: LeagueRepository;
  let teamRepo: TeamRepository;
  let memberRepo: TeamMemberRepository;

  beforeAll(() => {
    userRepo = new UserRepository();
    leagueRepo = new LeagueRepository();
    teamRepo = new TeamRepository();
    memberRepo = new TeamMemberRepository();
  });

  describe('UserRepository Validation', () => {
    it('should reject invalid user creation data', async () => {
      const invalidData = {
        email: 'invalid-email',
        passwordHash: '',
        name: ''
      };

      await expect(userRepo.create(invalidData)).rejects.toThrow('Validation failed');
    });

    it('should reject invalid user update data', async () => {
      const invalidData = {
        email: 'invalid-email'
      };

      await expect(userRepo.update('test-id', invalidData)).rejects.toThrow('Validation failed');
    });
  });

  describe('LeagueRepository Validation', () => {
    it('should reject invalid league creation data', async () => {
      const invalidData = {
        name: 'A', // Too short
        slug: 'invalid slug with spaces'
      };

      await expect(leagueRepo.create(invalidData)).rejects.toThrow('Validation failed');
    });

    it('should reject invalid league update data', async () => {
      const invalidData = {
        name: 'A' // Too short
      };

      await expect(leagueRepo.update('test-id', invalidData)).rejects.toThrow('Validation failed');
    });
  });

  describe('TeamRepository Validation', () => {
    it('should reject invalid team creation data', async () => {
      const invalidData = {
        name: 'A', // Too short
        color: 'invalid-color',
        leagueId: 'invalid-id',
        captainId: 'invalid-id'
      };

      await expect(teamRepo.create(invalidData)).rejects.toThrow('Validation failed');
    });

    it('should reject invalid team update data', async () => {
      const invalidData = {
        name: 'A', // Too short
        color: 'invalid-color'
      };

      await expect(teamRepo.update('test-id', invalidData)).rejects.toThrow('Validation failed');
    });
  });

  describe('TeamMemberRepository Validation', () => {
    it('should reject invalid team member creation data', async () => {
      const invalidData = {
        teamId: 'invalid-id',
        userId: 'invalid-id'
      };

      await expect(memberRepo.create(invalidData)).rejects.toThrow('Validation failed');
    });
  });
});