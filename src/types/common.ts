/**
 * PURPOSE: Common utility types used throughout the Ekuatia automation system
 *
 * REASONING:
 * - Provides reusable type patterns for common operations
 * - Reduces code duplication across services and agents
 * - Establishes consistent patterns for async operations
 * - Supports typed error handling and result patterns
 * - Enables better type inference for API responses
 *
 * AGENT DECISION PROCESS:
 * - Requirements analyzed from common patterns in authentication and configuration
 * - Considered:分散 types vs consolidated common types
 * - Selected consolidated file for reusability and consistency
 * - Trade-offs: Larger file but centralized type definitions
 */

// ============================================================================
// RESULT TYPES - Consistent error handling patterns
// ============================================================================

/**
 * Standardized result type for operations that can succeed or fail
 * Eliminates try-catch blocks in favor of functional error handling
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * Async result type for Promise-returning functions
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// ============================================================================
// OPTIONAL TYPES - Better null handling
// ============================================================================

/**
 * Type representing optional values with explicit undefined handling
 * Better than optional properties for clarity in API responses
 */
export type Optional<T> = T | undefined | null;

/**
 * Type for required fields (explicit requirement marker)
 */
export type Required<T> = T;

// ============================================================================
// HTTP TYPES - API communication patterns
// ============================================================================

/**
 * HTTP status codes as string literals for type safety
 */
export type HttpStatusCode =
  | '200'
  | '201'
  | '204' // Success
  | '400'
  | '401'
  | '403'
  | '404' // Client errors
  | '500'
  | '502'
  | '503'; // Server errors

/**
 * HTTP methods supported by the API client
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Generic HTTP headers interface
 */
export interface HttpHeaders {
  [key: string]: string | string[] | undefined;
}

/**
 * HTTP request configuration
 */
export interface HttpRequestConfig<TData = unknown, TParams = unknown> {
  method: HttpMethod;
  url: string;
  headers?: HttpHeaders;
  data?: TData;
  params?: Record<string, TParams>;
  timeout?: number;
}

/**
 * HTTP response wrapper
 */
export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: HttpHeaders;
  config: HttpRequestConfig<T>;
}

// ============================================================================
// VALIDATION TYPES - Input validation patterns
// ============================================================================

/**
 * Validation rule for input fields
 */
export interface ValidationRule<T = unknown> {
  /** Human-readable rule description */
  message: string;
  /** Validation function */
  validate: (value: T) => boolean;
  /** Optional error code */
  code?: string;
}

/**
 * Validation result with detailed error information
 */
export interface ValidationResult {
  /** Overall validation success */
  isValid: boolean;
  /** Specific error messages by field name */
  errors: Record<string, string[]>;
  /** Optional error codes */
  errorCodes?: Record<string, string[]>;
}

/**
 * Schema definition for object validation
 */
export type ValidationSchema<T extends Record<string, unknown>> = {
  [K in keyof T]: ValidationRule<T[K]> | ValidationRule<T[K]>[];
};

// ============================================================================
// CONFIGURATION TYPES - System configuration patterns
// ============================================================================

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /** Time to live in milliseconds */
  ttlMs: number;
  /** Maximum number of entries */
  maxSize?: number;
  /** Automatic cleanup interval in milliseconds */
  cleanupIntervalMs?: number;
}

/**
 * Retry configuration for API calls
 */
export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  /** Exponential backoff multiplier */
  backoffMultiplier: number;
  /** Maximum delay between attempts */
  maxDelayMs: number;
  /** Whether to retry on specific status codes */
  retryableStatusCodes?: number[];
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  /** Log level: error, warn, info, debug */
  level: 'error' | 'warn' | 'info' | 'debug';
  /** Whether to include timestamps */
  includeTimestamp: boolean;
  /** Whether to log to file */
  logToFile?: boolean;
  /** Log file path if logging to file */
  logFilePath?: string;
}

// ============================================================================
// DATE AND TIME TYPES - Consistent date handling
// ============================================================================

/**
 * Date format used throughout the system
 */
export type DateFormat = 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'ISO8601';

/**
 * Time information with timezone awareness
 */
export interface TimeInfo {
  /** ISO8601 timestamp */
  iso: string;
  /** Local formatted date */
  local: string;
  /** Timezone identifier */
  timezone: string;
  /** Unix timestamp in milliseconds */
  epoch: number;
}

// ============================================================================
// IDENTIFIER TYPES - Business entity identification
// ============================================================================

/**
 * RUC format validation (without verification digit)
 */
export type RucWithoutDV = string; // Should be 7 digits: /^[0-9]{7}$/

/**
 * RUC format with verification digit
 */
export type RucWithDV = string; // Should be 8-9 chars: /^[0-9]{7}-[0-9]$/

/**
 * Session token format
 */
export type SessionToken = string; // Should be UUID or similar format

/**
 * Document identifier (CDC - Código de Control)
 */
export type DocumentId = string; // Generated by Ekuatia system

/**
 * Configuration cache key format
 */
export type CacheKey = `ekuatia_config_${string}`;

// ============================================================================
// COLLECTION TYPES - Type-safe array operations
// ============================================================================

/**
 * Non-empty array type
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> {
  /** Current page data */
  data: T[];
  /** Current page number */
  page: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems: number;
  /** Items per page */
  pageSize: number;
}

/**
 * Key-value pair type for objects
 */
export type KeyValuePair<K extends string | number, V> = {
  key: K;
  value: V;
};
