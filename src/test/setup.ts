// Jest setup file for test configuration
// This file runs before each test suite

import { setupTestDatabase, teardownTestDatabase } from './database';

// Set test environment variables
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = process.env['JWT_SECRET'] || 'test-jwt-secret';
// Only set DATABASE_URL if not already set (allows CI override)
if (!process.env['DATABASE_URL']) {
  process.env['DATABASE_URL'] =
    'postgresql://test:test@localhost:5432/pbsports_test';
}
process.env['LEAGUE_SLUG'] = process.env['LEAGUE_SLUG'] || 'test-league';
process.env['AUTO_APPROVE_JOINS'] = 'false';

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Global test setup and teardown
beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});
