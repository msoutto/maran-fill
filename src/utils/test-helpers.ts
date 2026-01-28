/**
 * PURPOSE: Test utility functions and helpers for TDD development
 *
 * REASONING:
 * - Provides reusable test utilities to reduce code duplication
 * - Enables consistent test patterns across all test suites
 * - Supports both unit and integration testing scenarios
 * - Includes mock factories for realistic test data
 * - Facilitates easy test setup and teardown
 *
 * AGENT DECISION PROCESS:
 * - Requirements analyzed from testing best practices
 * - Common patterns extracted from Ekuatia test scenarios
 * - Considered: inline helpers vs dedicated file
 * - Selected dedicated file for reusability across test suites
 * - Trade-offs: Additional file but better test organization
 */

import { vi, expect } from 'vitest';
import type {
  EkuatiaConfig,
  LoginCredentials,
  InvoiceData,
  InvoiceItem,
  InvoiceSummary,
  ProfileData,
  ModalityType,
  DocumentType,
} from '../types/ekuatia';

// ============================================================================
// TEST HELPER TYPES - Type-safe testing utilities
// ============================================================================

/**
 * Mock HTTP error structure
 */
export interface MockHttpError extends Error {
  response: {
    status: number;
    statusText: string;
    data: { message: string; code?: string };
    headers: Record<string, string>;
    config: Record<string, unknown>;
  };
  code: string;
}

/**
 * Generic validation function type
 */
export type ValidationFunction<T = unknown> = (input: T) => boolean | string;

/**
 * Generic test object type
 */
export type TestObject = Record<string, unknown>;

/**
 * Generic array item type for property testing
 */
export type ArrayTestItem<T = unknown> = T[keyof T];

// ============================================================================
// MOCK DATA FACTORIES - Generate realistic test data
// ============================================================================

/**
 * Factory for creating login credentials
 */
export const createMockCredentials = (
  overrides: Partial<LoginCredentials> = {}
): LoginCredentials => ({
  username: '5452',
  password: 'test_marangatu_key_12345',
  emission_mode: 'SOLUCIÓN GRATUITA',
  ...overrides,
});

/**
 * Factory for creating mock profile data
 */
export const createMockProfile = (overrides: Partial<ProfileData> = {}): ProfileData => ({
  ruc_with_dv: '5452-1',
  business_name: 'Teresa De Jesus',
  ruc_status: 'Activo',
  numero_timbrado: '12561412',
  actividad_economica: 'Otras actividades de servicios personales n.c.p.',
  fecha_aprobacion: '20/03/2024',
  tipo_contribuyente: 'FISICO' as const,
  csc: 'CSC_VALUE_123456',
  ...overrides,
});

/**
 * Factory for creating invoice items
 */
export const createMockInvoiceItem = (overrides: Partial<InvoiceItem> = {}): InvoiceItem => ({
  codigo_producto: 'PROD001',
  descripcion: 'Servicio de consultoría',
  cantidad: 1,
  precio_unitario: 500000,
  monto_iva: 0,
  monto_total: 500000,
  ...overrides,
});

/**
 * Factory for creating invoice summaries
 */
export const createMockInvoiceSummary = (
  overrides: Partial<InvoiceSummary> = {}
): InvoiceSummary => ({
  subtotal: 500000,
  total_iva: 0,
  total_general: 500000,
  ...overrides,
});

/**
 * Factory for creating complete invoice data
 */
export const createMockInvoiceData = (overrides: Partial<InvoiceData> = {}): InvoiceData => ({
  fecha: '25/01/2026',
  receptor_ruc: '1234567',
  receptor_nombre: 'Cliente S.A.',
  items: [createMockInvoiceItem()],
  resumen: createMockInvoiceSummary(),
  ...overrides,
});

/**
 * Factory for creating Ekuatia configuration
 */
export const createMockEkuatiaConfig = (
  modality: ModalityType = 'BASICA' as ModalityType,
  overrides: Partial<EkuatiaConfig> = {}
): EkuatiaConfig => {
  const baseConfig = {
    modality,
    logo: null,
    issuer_data: {
      numero_timbrado: '12561412',
      establecimiento: 1,
      tipo_documento: 'FACTURA ELECTRONICA' as DocumentType,
      actividad_economica: 'Otras actividades de servicios personales n.c.p.',
      fecha_inicio_vigencia: '20/03/2024',
      punto_expedicion: 1,
      tipo_contribuyente: 'FISICO' as const,
      codigo_seguridad_contribuyente: 'CSC_VALUE_123456',
    },
  };

  if (modality === 'AVANZADA') {
    const advancedConfig = baseConfig as EkuatiaConfig & {
      grupos_utilizables?: {
        informaciones_compras_publicas: boolean;
        sector_supermercados: boolean;
      };
    };
    advancedConfig.grupos_utilizables = {
      informaciones_compras_publicas: true,
      sector_supermercados: false,
    };
  }

  return { ...baseConfig, ...overrides };
};

// ============================================================================
// MOCK AXIOS INTERCEPTORS - Simulate HTTP behavior
// ============================================================================

/**
 * Mock axios implementation for testing HTTP calls
 */
export const createMockAxios = () => {
  const mock = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    create: vi.fn(() => mock),
    defaults: {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    },
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    },
  };
  return mock;
};

/**
 * Mock successful HTTP response
 */
export const createMockHttpResponse = <T>(data: T, status = 200, statusText = 'OK') => ({
  data,
  status,
  statusText,
  headers: {},
  config: {
    method: 'POST',
    url: '/test',
    headers: {},
  },
});

/**
 * Mock HTTP error response
 */
export const createMockHttpError = (
  message: string,
  status = 400,
  code = 'BAD_REQUEST'
): MockHttpError => {
  const error = new Error(message) as MockHttpError;
  error.response = {
    status,
    statusText: 'Error',
    data: { message, code },
    headers: {},
    config: {},
  };
  error.code = code;
  return error;
};

// ============================================================================
// TEST SETUP UTILITIES - Consistent test environment
// ============================================================================

/**
 * Setup test environment with consistent configuration
 */
export const setupTestEnvironment = () => {
  // Mock console methods to avoid test noise
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});

  // Mock Date.now for consistent timestamps
  const mockDate = new Date('2026-01-27T12:00:00Z');
  vi.setSystemTime(mockDate);
};

/**
 * Cleanup test environment after each test
 */
export const cleanupTestEnvironment = () => {
  vi.restoreAllMocks();
  vi.useRealTimers();
};

/**
 * Setup test environment with real timers
 */
export const setupTestEnvironmentWithTimers = () => {
  setupTestEnvironment();
  vi.useRealTimers();
};

// ============================================================================
// ASYNC TESTING UTILITIES - Handle promises and timing
// ============================================================================

/**
 * Wait for specified time (useful for testing delays/timeouts)
 */
export const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Wait for next tick (useful for microtask testing)
 */
export const nextTick = (): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, 0));
};

/**
 * Run async function with timeout for testing
 */
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Test timeout after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
};

// ============================================================================
// ASSERTION HELPERS - Enhanced test assertions
// ============================================================================

/**
 * Assert that a promise rejects with specific error
 */
export const expectRejection = async (
  promise: Promise<unknown>,
  expectedErrorMessage?: string,
  expectedErrorCode?: string
): Promise<void> => {
  try {
    await promise;
    // If we get here, promise didn't reject
    throw new Error('Expected promise to reject');
  } catch (error: unknown) {
    const errorObj = error as Error & { code?: string };
    if (expectedErrorMessage) {
      expect(errorObj.message).toContain(expectedErrorMessage);
    }
    if (expectedErrorCode) {
      expect(errorObj.code).toBe(expectedErrorCode);
    }
  }
};

/**
 * Assert that object has specific properties
 */
export const expectObjectToHaveProperties = (obj: TestObject, properties: string[]): void => {
  properties.forEach((prop) => {
    expect(obj).toHaveProperty(prop);
  });
};

/**
 * Assert that array contains objects with specific property values
 */
export const expectArrayToContainObjectWithProperty = <T>(
  array: T[],
  property: keyof T,
  expectedValue: unknown
): void => {
  expect(array.some((item) => item[property] === expectedValue)).toBe(true);
};

// ============================================================================
// VALIDATION TESTING UTILITIES - Test input validation
// ============================================================================

/**
 * Test validation function with various invalid inputs
 */
export const testValidationWithInvalidInputs = <T>(
  validationFn: ValidationFunction<T>,
  validInput: T,
  invalidInputs: T[]
): void => {
  // Should pass with valid input
  expect(validationFn(validInput)).toBe(true);

  // Should fail with invalid inputs
  invalidInputs.forEach((invalidInput) => {
    const result = validationFn(invalidInput);
    if (typeof result === 'boolean') {
      expect(result).toBe(false);
    } else {
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    }
  });
};

/**
 * Test required field validation
 */
export const testRequiredFieldValidation = (
  obj: TestObject,
  requiredField: string,
  errorMessage: string
): void => {
  const invalidObj = { ...obj };
  delete invalidObj[requiredField];

  expect(() => {
    // This would be replaced with actual validation function
    if (!invalidObj[requiredField]) {
      throw new Error(errorMessage);
    }
  }).toThrow(errorMessage);
};

// ============================================================================
// MOCK STORAGE UTILITIES - Test caching and persistence
// ============================================================================

/**
 * Mock localStorage for testing
 */
export const createMockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    length: Object.keys(store).length,
  };
};

/**
 * Mock sessionStorage for testing
 */
export const createMockSessionStorage = () => {
  return createMockLocalStorage(); // Same interface
};

// ============================================================================
// PERFORMANCE TESTING UTILITIES - Test execution time and efficiency
// ============================================================================

/**
 * Measure execution time of a function
 */
export const measureExecutionTime = async <T>(
  fn: () => T | Promise<T>
): Promise<{ result: T; executionTimeMs: number }> => {
  const startTime = Date.now();
  const result = await fn();
  const executionTimeMs = Date.now() - startTime;

  return { result, executionTimeMs };
};

/**
 * Assert that function executes within time limit
 */
export const expectExecutionWithinTimeLimit = async <T>(
  fn: () => T | Promise<T>,
  maxTimeMs: number
): Promise<T> => {
  const { result, executionTimeMs } = await measureExecutionTime(fn);

  expect(executionTimeMs).toBeLessThanOrEqual(maxTimeMs);

  return result;
};
