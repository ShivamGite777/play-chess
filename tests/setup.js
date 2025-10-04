// Test setup file
require('dotenv').config({ path: '.env.test' });

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DB_NAME = 'chess_game_test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Global test timeout
jest.setTimeout(10000);