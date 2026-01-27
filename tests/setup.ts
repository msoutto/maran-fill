/**
 * PURPOSE: Global test setup for Vitest TDD development workflow
 * 
 * REASONING: 
 * - Provides consistent test environment across all test files
 * - Sets up global test utilities and mocks
 * - Configures test timeout and error handling
 * - Enables clean test isolation and setup/teardown
 * 
 * AGENT DECISION PROCESS:
 * - Analyzed Vitest best practices for test setup
 * - Considered: inline setup vs global setup file
 * - Selected global setup for consistency across TDD workflow
 * - Trade-offs: Slightly more complex but better for large test suites
 */

import { vi } from 'vitest';

// Global test configuration
vi.setConfig({
  testTimeout: 10000,
  hookTimeout: 10000,
});

// Mock console methods in tests to avoid noise
global.console = {
  ...console,
  // Uncomment to disable console.log in tests
  // log: vi.fn(),
  // warn: vi.fn(),
  // error: vi.fn(),
};

// Global test utilities
export const createMockResponse = <T>(data: T, status = 200) => ({
  data,
  status,
  statusText: status === 200 ? 'OK' : 'Error',
  headers: {},
  config: {},
});

export const createMockError = (message: string, code = 'UNKNOWN_ERROR') => {
  const error = new Error(message) as any;
  error.code = code;
  error.response = {
    status: 400,
    statusText: 'Bad Request',
    data: { message, code },
  };
  return error;
};

// Common test data fixtures
export const MOCK_RUC = '5452';
export const MOCK_MARANGATU_KEY = 'test_marangatu_key_12345';
export const MOCK_SESSION_TOKEN = 'test_session_token_abcdef123456';

// Ekuatia API mock responses
export const MOCK_LOGIN_SUCCESS = {
  session_token: MOCK_SESSION_TOKEN,
  profile: {
    ruc_with_dv: '5452-1',
    business_name: 'Teresa De Jesus',
    ruc_status: 'Activo',
  },
  establishment_data: {
    department: 'Capital',
    district: 'Asunción (distrito)',
    city: 'Asunción (distrito)',
    address: 'Avenida Principal 123',
  },
};

export const MOCK_LOGIN_ERROR_INVALID_CREDENTIALS = {
  code: 'INVALID_CREDENTIALS',
  message: 'RUC o Clave de Acceso incorrecta',
};

export const MOCK_LOGIN_ERROR_NOT_APPROVED = {
  code: 'APPROVAL_NOT_FOUND',
  message: 'No existe solicitud de habilitación aprobada',
};

export const MOCK_LOGIN_ERROR_INACTIVE_RUC = {
  code: 'RUC_INACTIVE',
  message: 'RUC no está en estado Activo',
};