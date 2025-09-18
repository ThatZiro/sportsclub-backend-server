/**
 * Test database utilities
 * Provides database setup, teardown, and seeding for tests
 */

import { PrismaClient } from '@prisma/client';
import { UserRole, MemberRole, MemberStatus } from '../domain/enums';

export const testDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env['DATABASE_URL'] || 'postgresql://test:test@localhost:5432/pbsports_test'
    }
  }
});

/**
 * Clean all test data from the database
 */
export async function cleanDatabase(): Promise<void> {
  await testDb.teamMember.deleteMany();
  await testDb.team.deleteMany();
  await testDb.league.deleteMany();
  await testDb.user.deleteMany();
}

/**
 * Seed the database with test data
 */
export async function seedTestData() {
  // Create test users
  const organizer = await testDb.user.create({
    data: {
      email: 'organizer@test.com',
      passwordHash: '$2b$12$hashedpassword',
      name: 'Test Organizer',
      role: UserRole.ORGANIZER
    }
  });

  const captain = await testDb.user.create({
    data: {
      email: 'captain@test.com',
      passwordHash: '$2b$12$hashedpassword',
      name: 'Test Captain',
      role: UserRole.USER
    }
  });

  const player = await testDb.user.create({
    data: {
      email: 'player@test.com',
      passwordHash: '$2b$12$hashedpassword',
      name: 'Test Player',
      role: UserRole.USER
    }
  });

  // Create test league
  const league = await testDb.league.create({
    data: {
      name: 'Test League',
      slug: 'test-league',
      season: 'Spring 2024',
      isActive: true
    }
  });

  // Create test team
  const team = await testDb.team.create({
    data: {
      name: 'Test Team',
      color: '#FF0000',
      leagueId: league.id,
      captainId: captain.id
    }
  });

  // Create team memberships
  await testDb.teamMember.create({
    data: {
      teamId: team.id,
      userId: captain.id,
      role: MemberRole.CAPTAIN,
      status: MemberStatus.APPROVED
    }
  });

  await testDb.teamMember.create({
    data: {
      teamId: team.id,
      userId: player.id,
      role: MemberRole.MEMBER,
      status: MemberStatus.PENDING
    }
  });

  return {
    organizer,
    captain,
    player,
    league,
    team
  };
}

/**
 * Setup test database connection
 */
export async function setupTestDatabase(): Promise<void> {
  await testDb.$connect();
}

/**
 * Teardown test database connection
 */
export async function teardownTestDatabase(): Promise<void> {
  await cleanDatabase();
  await testDb.$disconnect();
}