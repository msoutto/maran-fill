/**
 * PURPOSE: Custom error classes for Ekuatia automation system
 *
 * REASONING:
 * - Provides type-safe error handling for different error categories
 * - Enables specific error catching and handling strategies
 * - Includes context information for better debugging
 * - Supports error recovery and user-friendly messaging
 * - Follows TypeScript best practices for error classes
 *
 * AGENT DECISION PROCESS:
 * - Error categories analyzed from assets/ekuatia-agent-guide.md
 * - Business requirements extracted from Ekuatia system constraints
 * - Considered: generic Error class vs custom error classes
 * - Selected custom classes for type safety and error classification
 * - Trade-offs: More code but better error handling and user experience
 */

import type { AuthenticationErrorCode, ConfigurationErrorCode, InvoiceErrorCode } from './ekuatia';
import type { HttpStatusCode } from './common';

// ============================================================================
// ERROR RESPONSE INTERFACES - Type-safe error handling
// ============================================================================

/**
 * Standard error response structure from API
 */
export interface ErrorResponse {
  message: string;
  code?: string;
  statusCode?: string;
  details?: Record<string, unknown>;
}

/**
 * Generic error type for type guards
 */
export type GenericError = Error | EkuatiaBaseError | ErrorResponse;

// ============================================================================
// BASE ERROR CLASS - Foundation for all custom errors
// ============================================================================

/**
 * Base error class for all Ekuatia system errors
 * Provides consistent error structure and context handling
 */
export abstract class EkuatiaBaseError extends Error {
  /** Machine-readable error code */
  public readonly code: string;

  /** HTTP status code (if applicable) */
  public readonly statusCode?: HttpStatusCode;

  /** Additional error context */
  public readonly context?: Record<string, unknown>;

  /** Human-friendly recovery suggestion */
  public readonly recovery?: string;

  /** Error timestamp */
  public readonly timestamp: string;

  constructor(
    message: string,
    code: string,
    options?: {
      statusCode?: HttpStatusCode;
      context?: Record<string, unknown>;
      recovery?: string;
      cause?: Error;
    }
  ) {
    super(message);

    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = options?.statusCode;
    this.context = options?.context ?? {};
    this.recovery = options?.recovery;
    this.timestamp = new Date().toISOString();

    // Preserve stack trace
    if (options?.cause) {
      this.cause = options.cause;
    }
  }

  /**
   * Convert error to JSON for logging/serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
      recovery: this.recovery,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    const retryableCodes = ['TIMEOUT', 'TEMPORARY_UNAVAILABLE', 'RATE_LIMITED', 'SYSTEM_ERROR'];
    return retryableCodes.includes(this.code);
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    return this.recovery ? `${this.message}. ${this.recovery}` : this.message;
  }
}

// ============================================================================
// AUTHENTICATION ERRORS - Login and credential related errors
// ============================================================================

/**
 * Authentication-related errors (login, credentials, session management)
 */
export class AuthenticationError extends EkuatiaBaseError {
  constructor(
    message: string,
    code: AuthenticationErrorCode,
    context?: {
      ruc?: string;
      attemptCount?: number;
      lastAttempt?: string;
    }
  ) {
    const recovery = AuthenticationError.getRecoveryMessage(code);
    super(message, code, {
      statusCode: '401',
      context,
      recovery,
    });
  }

  private static getRecoveryMessage(code: AuthenticationErrorCode): string {
    switch (code) {
      case 'INVALID_CREDENTIALS':
        return 'Verifique sus credenciales en el sistema Marangatu y reintente.';
      case 'APPROVAL_NOT_FOUND':
        return 'Complete el proceso de habilitación como facturador electrónico en Marangatu.';
      case 'RUC_INACTIVE':
        return 'Regularice su situación fiscal en Marangatu antes de continuar.';
      default:
        return 'Contacte soporte técnico para asistencia.';
    }
  }
}

// ============================================================================
// CONFIGURATION ERRORS - System setup and configuration errors
// ============================================================================

/**
 * Configuration-related errors (setup, validation, caching)
 */
export class ConfigurationError extends EkuatiaBaseError {
  constructor(
    message: string,
    code: ConfigurationErrorCode,
    context?: {
      ruc?: string;
      configStep?: string;
      invalidFields?: string[];
    }
  ) {
    const recovery = ConfigurationError.getRecoveryMessage(code);
    super(message, code, {
      statusCode: '400',
      context,
      recovery,
    });
  }

  private static getRecoveryMessage(code: ConfigurationErrorCode): string {
    switch (code) {
      case 'MULTIPLE_ESTABLISHMENTS':
        return 'El sistema solo soporta un único establecimiento. Actualice su RUC.';
      case 'CERTIFICATE_MISSING':
        return 'Obtenga el Certificado Cualificado de Firma Electrónica (CCFE) según Resolución DNIT N° 757/2024.';
      case 'CSC_INVALID':
        return 'Contacte la DNIT para actualizar su Código de Seguridad del Contribuyente.';
      default:
        return 'Verifique la configuración e intente nuevamente.';
    }
  }
}

/**
 * Configuration retrieval errors (cache, API access)
 */
export class ConfigurationRetrievalError extends EkuatiaBaseError {
  constructor(
    message: string,
    context?: {
      ruc?: string;
      cacheKey?: string;
      endpoint?: string;
    }
  ) {
    const recovery = 'Intente nuevamente más tarde o contacte soporte técnico.';
    super(message, 'CONFIGURATION_RETRIEVAL_FAILED', {
      statusCode: '500',
      context,
      recovery,
    });
  }
}

// ============================================================================
// INVOICE ERRORS - Invoice creation and validation errors
// ============================================================================

/**
 * Invoice creation and validation errors
 */
export class InvoiceCreationError extends EkuatiaBaseError {
  constructor(
    message: string,
    code: InvoiceErrorCode,
    context?: {
      invoiceId?: string;
      rucReceptor?: string;
      validationErrors?: Record<string, string[]>;
    }
  ) {
    const recovery = InvoiceCreationError.getRecoveryMessage(code);
    super(message, code, {
      statusCode: '400',
      context,
      recovery,
    });
  }

  private static getRecoveryMessage(code: InvoiceErrorCode): string {
    switch (code) {
      case 'INVALID_DATOS_RECEPTOR':
        return 'Verifique los datos del receptor (RUC y razón social).';
      case 'MONTO_NEGATIVO':
        return 'Todos los montos deben ser positivos. Verifique los cálculos.';
      case 'DOCUMENTO_DUPLICADO':
        return 'Este documento ya fue registrado. Use NOTA_CREDITO para correcciones.';
      case 'TIMBRADO_EXPIRED':
        return 'El timbrado ha expirado. Solicite un nuevo timbrado en DNIT.';
      default:
        return 'Corrija los datos del documento e intente nuevamente.';
    }
  }
}

// ============================================================================
// SYSTEM ERRORS - Technical and network related errors
// ============================================================================

/**
 * Network and system-level errors
 */
export class SystemError extends EkuatiaBaseError {
  constructor(
    message: string,
    context?: {
      endpoint?: string;
      statusCode?: string;
      responseTime?: number;
      retryCount?: number;
    }
  ) {
    const recovery =
      'Intente nuevamente en unos minutos. Si el problema persiste, contacte soporte.';
    super(message, 'SYSTEM_ERROR', {
      statusCode: '500',
      context,
      recovery,
    });
  }
}

/**
 * Timeout errors for API calls
 */
export class TimeoutError extends EkuatiaBaseError {
  constructor(
    message: string,
    timeoutMs: number,
    context?: {
      endpoint?: string;
      method?: string;
    }
  ) {
    const recovery = 'Verifique su conexión a internet e intente nuevamente.';
    super(message, 'TIMEOUT', {
      statusCode: '408' as HttpStatusCode,
      context: { ...(context ?? {}), timeoutMs },
      recovery,
    });
  }
}

// ============================================================================
// ERROR FACTORY FUNCTIONS - Helper functions for error creation
// ============================================================================

/**
 * Create authentication error from API response
 */
export const createAuthenticationError = (
  errorResponse: ErrorResponse,
  context?: Record<string, unknown>
): AuthenticationError => {
  return new AuthenticationError(
    errorResponse.message ?? 'Error de autenticación',
    (errorResponse.code ?? 'UNKNOWN_AUTH_ERROR') as AuthenticationErrorCode,
    context ?? {}
  );
};

/**
 * Create configuration error from validation result
 */
export const createConfigurationError = (
  message: string,
  code: ConfigurationErrorCode,
  invalidFields?: string[]
): ConfigurationError => {
  return new ConfigurationError(message, code, {
    invalidFields: invalidFields ?? [],
  });
};

/**
 * Create invoice error from validation
 */
export const createInvoiceError = (
  message: string,
  code: InvoiceErrorCode,
  validationErrors?: Record<string, string[]>
): InvoiceCreationError => {
  return new InvoiceCreationError(message, code, {
    validationErrors,
  });
};

/**
 * Create system error from network failure
 */
export const createSystemError = (
  message: string,
  endpoint?: string,
  statusCode?: string
): SystemError => {
  return new SystemError(message, {
    endpoint: endpoint ?? '',
    statusCode: statusCode ?? '',
  });
};

// ============================================================================
// ERROR TYPE GUARDS - Type-safe error checking
// ============================================================================

/**
 * Type guard for authentication errors
 */
export const isAuthenticationError = (error: GenericError): error is AuthenticationError => {
  return error instanceof AuthenticationError;
};

/**
 * Type guard for configuration errors
 */
export const isConfigurationError = (error: GenericError): error is ConfigurationError => {
  return error instanceof ConfigurationError;
};

/**
 * Type guard for invoice errors
 */
export const isInvoiceError = (error: GenericError): error is InvoiceCreationError => {
  return error instanceof InvoiceCreationError;
};

/**
 * Type guard for retryable errors
 */
export const isRetryableError = (error: GenericError): boolean => {
  return error instanceof EkuatiaBaseError && error.isRetryable();
};

/**
 * Get error code from any error object
 */
export const getErrorCode = (error: GenericError): string => {
  if (error instanceof EkuatiaBaseError) {
    return error.code;
  }
  return (error as ErrorResponse)?.code ?? 'UNKNOWN_ERROR';
};

/**
 * Get user-friendly error message
 */
export const getUserErrorMessage = (error: GenericError): string => {
  if (error instanceof EkuatiaBaseError) {
    return error.getUserMessage();
  }
  return (error as ErrorResponse)?.message ?? 'Ocurrió un error inesperado.';
};
