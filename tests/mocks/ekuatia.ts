/**
 * PURPOSE: Comprehensive mock implementations for Ekuatia API
 * 
 * REASONING: 
 * - Provides complete mock API responses for TDD development
 * - Enables development without external API dependencies
 * - Includes all error scenarios from business requirements
 * - Supports both successful and failed API interactions
 * - Maintains response structure consistency with real API
 * 
 * AGENT DECISION PROCESS:
 * - Mock requirements analyzed from assets/ekuatia-agent-guide.md
 * - Error scenarios extracted from business logic documentation
 * - Response structure based on Ekuatia API specifications
 * - Considered: inline mocks vs separate file
 * - Selected dedicated mock file for reusability and organization
 * - Trade-offs: More files but better separation of concerns
 */

import type {
  LoginCredentials,
  LoginResponse,
  ProfileData,
  EstablishmentData,
  EkuatiaError,
  ApiResponse,
  ApiErrorResponse
} from '@/types/ekuatia';

// ============================================================================
// MOCK DATA - Realistic test data matching business requirements
// ============================================================================

/** Valid test credentials for successful authentication */
export const MOCK_CREDENTIALS: LoginCredentials = {
  username: '5452', // RUC without DV
  password: 'test_marangatu_key_12345',
  emission_mode: 'SOLUCIÓN GRATUITA'
};

/** Valid test profile from Marangatu system */
export const MOCK_PROFILE: ProfileData = {
  ruc_with_dv: '5452-1',
  business_name: 'Teresa De Jesus',
  ruc_status: 'Activo',
  numero_timbrado: '12561412',
  actividad_economica: 'Otras actividades de servicios personales n.c.p.',
  fecha_aprobacion: '20/03/2024',
  tipo_contribuyente: 'FISICO',
  csc: 'CSC_VALUE_123456'
};

/** Valid establishment data for test RUC */
export const MOCK_ESTABLISHMENT: EstablishmentData = {
  department: 'Capital',
  district: 'Asunción (distrito)',
  city: 'Asunción (distrito)',
  address: 'Avenida Principal 123'
};

/** Successful login response structure */
export const MOCK_LOGIN_RESPONSE: ApiResponse<LoginResponse> = {
  success: true,
  data: {
    success: true,
    session_token: 'session_token_abcdef123456789',
    profile: MOCK_PROFILE,
    establishment_data: MOCK_ESTABLISHMENT
  },
  timestamp: '2026-01-27T01:30:00Z'
};

// ============================================================================
// MOCK ERRORS - All error scenarios from business requirements
// ============================================================================

/** Invalid credentials error */
export const MOCK_ERROR_INVALID_CREDENTIALS: ApiErrorResponse = {
  success: false,
  error: {
    code: 'INVALID_CREDENTIALS',
    message: 'RUC o Clave de Acceso incorrecta',
    details: {
      field: 'username',
      expected_format: 'RUC sin dígito verificador'
    },
    timestamp: '2026-01-27T01:30:00Z'
  }
};

/** No electronic invoicer approval found */
export const MOCK_ERROR_APPROVAL_NOT_FOUND: ApiErrorResponse = {
  success: false,
  error: {
    code: 'APPROVAL_NOT_FOUND',
    message: 'No existe solicitud de habilitación aprobada',
    details: {
      field: 'approval_status',
      expected_status: 'Aprobado'
    },
    timestamp: '2026-01-27T01:30:00Z'
  }
};

/** RUC not active in tax system */
export const MOCK_ERROR_RUC_INACTIVE: ApiErrorResponse = {
  success: false,
  error: {
    code: 'RUC_INACTIVE',
    message: 'RUC no está en estado Activo',
    details: {
      field: 'ruc_status',
      current_status: 'Inactivo',
      required_status: 'Activo'
    },
    timestamp: '2026-01-27T01:30:00Z'
  }
};

/** Multiple establishments (violates system constraint) */
export const MOCK_ERROR_MULTIPLE_ESTABLISHMENTS: ApiErrorResponse = {
  success: false,
  error: {
    code: 'MULTIPLE_ESTABLISHMENTS',
    message: 'RUC tiene múltiples establecimientos',
    details: {
      constraint: 'Single establishment only',
      found_count: 2,
      maximum_allowed: 1
    },
    timestamp: '2026-01-27T01:30:00Z'
  }
};

/** Missing Qualified Electronic Signature Certificate */
export const MOCK_ERROR_CERTIFICATE_MISSING: ApiErrorResponse = {
  success: false,
  error: {
    code: 'CERTIFICATE_MISSING',
    message: 'Certificado Cualificado de Firma Electrónica no encontrado',
    details: {
      requirement: 'Obtener el Certificado Cualificado de Firma Electrónica - CCFFE',
      reference: 'Resolución DNIT N° 757/2024'
    },
    timestamp: '2026-01-27T01:30:00Z'
  }
};

/** Invalid CSC code */
export const MOCK_ERROR_CSC_INVALID: ApiErrorResponse = {
  success: false,
  error: {
    code: 'CSC_INVALID',
    message: 'Código de Seguridad Contribuyente inválido o expirado',
    details: {
      field: 'codigo_seguridad_contribuyente',
      action: 'Contact DNIT to refresh CSC'
    },
    timestamp: '2026-01-27T01:30:00Z'
  }
};

/** Invalid recipient data */
export const MOCK_ERROR_INVALID_RECEPTOR: ApiErrorResponse = {
  success: false,
  error: {
    code: 'INVALID_DATOS_RECEPTOR',
    message: 'Datos del receptor inválidos o incompletos',
    details: {
      field: 'ruc_receptor',
      expected_format: 'Valid Paraguay RUC',
      validation: 'RUC format and verification digit required'
    },
    timestamp: '2026-01-27T01:30:00Z'
  }
};

/** Negative amounts in invoice */
export const MOCK_ERROR_NEGATIVE_AMOUNT: ApiErrorResponse = {
  success: false,
  error: {
    code: 'MONTO_NEGATIVO',
    message: 'Montos deben ser positivos',
    details: {
      constraint: 'All amounts must be greater than 0',
      affected_fields: ['precio_unitario', 'monto_total']
    },
    timestamp: '2026-01-27T01:30:00Z'
  }
};

/** Duplicate document already registered */
export const MOCK_ERROR_DOCUMENTO_DUPLICADO: ApiErrorResponse = {
  success: false,
  error: {
    code: 'DOCUMENTO_DUPLICADO',
    message: 'Documento ya fue registrado',
    details: {
      duplicate_field: 'código de control',
      resolution: 'Use NOTA_CREDITO if correction needed'
    },
    timestamp: '2026-01-27T01:30:00Z'
  }
};

// ============================================================================
// MOCK API FUNCTIONS - Simulate real API behavior
// ============================================================================

/**
 * Simulates Ekuatia login API with various scenarios
 * 
 * @param credentials - Login credentials to test
 * @returns Promise resolving to login response or error
 */
export const mockLoginApi = async (
  credentials: LoginCredentials
): Promise<ApiResponse<LoginResponse> | ApiErrorResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Test different error scenarios
  if (credentials.username !== MOCK_CREDENTIALS.username) {
    return MOCK_ERROR_INVALID_CREDENTIALS;
  }

  if (credentials.password !== MOCK_CREDENTIALS.password) {
    return MOCK_ERROR_INVALID_CREDENTIALS;
  }

  // Simulate different RUC status scenarios
  if (credentials.username === '9999999') {
    return MOCK_ERROR_RUC_INACTIVE;
  }

  if (credentials.username === '8888888') {
    return MOCK_ERROR_APPROVAL_NOT_FOUND;
  }

  // Successful login
  return MOCK_LOGIN_RESPONSE;
};

/**
 * Mock API response generator for testing
 * 
 * @param data - Response data
 * @param delay - Optional delay in milliseconds
 * @returns Formatted API response
 */
export const createMockSuccessResponse = <T>(
  data: T,
  delay = 100
): Promise<ApiResponse<T>> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
    }, delay);
  });
};

/**
 * Mock error response generator for testing
 * 
 * @param error - Error details
 * @param delay - Optional delay in milliseconds
 * @returns Formatted API error response
 */
export const createMockErrorResponse = (
  error: EkuatiaError,
  delay = 100
): Promise<ApiErrorResponse> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        success: false,
        error: {
          ...error,
          timestamp: error.timestamp || new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }, delay);
  });
};

// ============================================================================
// MOCK CACHE IMPLEMENTATION
// ============================================================================

/**
 * Simple in-memory cache for testing configuration storage
 */
export class MockCache {
  private cache = new Map<string, { data: any; expiry: number }>();

  /**
   * Store data in cache with TTL
   */
  set(key: string, data: any, ttlMs: number = 7776000000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs // 90 days default
    });
  }

  /**
   * Retrieve data from cache
   */
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  /**
   * Remove data from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && Date.now() <= entry.expiry;
  }
}

export const mockCache = new MockCache();