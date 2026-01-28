/**
 * PURPOSE: Main entry point for Ekuatia automation system
 *
 * REASONING:
 * - Provides centralized exports for all public APIs
 * - Enables clean import patterns for consumers
 * - Organizes exports by functional area
 * - Maintains backward compatibility as system grows
 *
 * AGENT DECISION PROCESS:
 * - Requirements analyzed from modular architecture principles
 * - Considered: barrel exports vs direct imports
 * - Selected barrel exports for cleaner consumer API
 * - Implementation constraints: Must export all public types and utilities
 */

// Version information
export const VERSION = '1.0.0';

// ============================================================================
// TYPE EXPORTS - Public type definitions
// ============================================================================

// Ekuatia API types
export type {
  DocumentType,
  TaxpayerType,
  ModalityType,
  EmissionMode,
  RucStatus,
  LoginCredentials,
  ProfileData,
  EstablishmentData,
  LoginResponse,
  IssuerData,
  GruposUtilizables,
  EkuatiaConfig,
  InvoiceItem,
  InvoiceSummary,
  InvoiceData,
  EkuatiaError,
  AuthenticationErrorCode,
  ConfigurationErrorCode,
  InvoiceErrorCode,
  ApiResponse,
  ApiErrorResponse,
  CacheEntry,
  CacheInvalidationTrigger,
} from './types/ekuatia';

// Common utility types
export type {
  Result,
  AsyncResult,
  Optional,
  Required,
  HttpStatusCode,
  HttpMethod,
  HttpHeaders,
  HttpRequestConfig,
  HttpResponse,
  ValidationRule,
  ValidationResult,
  ValidationSchema,
  CacheConfig,
  RetryConfig,
  LoggingConfig,
  DateFormat,
  TimeInfo,
  RucWithoutDV,
  RucWithDV,
  SessionToken,
  DocumentId,
  CacheKey,
  NonEmptyArray,
  PaginatedResponse,
  KeyValuePair,
} from './types/common';

// Error classes
export {
  EkuatiaBaseError,
  AuthenticationError,
  ConfigurationError,
  ConfigurationRetrievalError,
  InvoiceCreationError,
  SystemError,
  TimeoutError,
  createAuthenticationError,
  createConfigurationError,
  createInvoiceError,
  createSystemError,
  isAuthenticationError,
  isConfigurationError,
  isInvoiceError,
  isRetryableError,
  getErrorCode,
  getUserErrorMessage,
} from './types/errors';

// ============================================================================
// UTILITY EXPORTS - Helper functions and tools
// ============================================================================

// Test utilities (only in test environment)
export {
  createMockCredentials,
  createMockProfile,
  createMockInvoiceItem,
  createMockInvoiceSummary,
  createMockInvoiceData,
  createMockEkuatiaConfig,
  createMockAxios,
  createMockHttpResponse,
  createMockHttpError,
  setupTestEnvironment,
  cleanupTestEnvironment,
  setupTestEnvironmentWithTimers,
  wait,
  nextTick,
  withTimeout,
  expectRejection,
  expectObjectToHaveProperties,
  expectArrayToContainObjectWithProperty,
  testValidationWithInvalidInputs,
  testRequiredFieldValidation,
  createMockLocalStorage,
  createMockSessionStorage,
  measureExecutionTime,
  expectExecutionWithinTimeLimit,
} from './utils/test-helpers';

// ============================================================================
// FUTURE AGENT EXPORTS - Will be implemented in later checkpoints
// ============================================================================

// TODO: Export authentication agent once implemented
// export { AuthenticationAgent } from './agents/auth';

// TODO: Export configuration agent once implemented
// export { ConfigurationAgent } from './agents/config';

// TODO: Export invoice agent once implemented
// export { InvoiceAgent } from './agents/invoice';

// TODO: Export API service once implemented
// export { EkuatiaApiService } from './services/api';

// TODO: Export cache service once implemented
// export { CacheService } from './services/cache';
