// Jest setup file
import { jest } from '@jest/globals';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock environment variables
process.env.DATABASE_URL = 'mysql://test:test@localhost:3306/test_db';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only';
process.env.NEXTAUTH_SECRET = 'test-nextauth-secret';

// Set test environment
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);
