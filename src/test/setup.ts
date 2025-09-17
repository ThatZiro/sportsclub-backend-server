// Jest setup file for test configuration
// This file runs before each test suite

// Set test environment variables
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = 'test-jwt-secret';
process.env['DATABASE_URL'] =
    'postgresql://test:test@localhost:5432/pbsports_test';

// Increase test timeout for integration tests
jest.setTimeout(30000);
