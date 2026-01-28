/**
 * PURPOSE: TypeScript type definitions for Ekuatia API integration
 *
 * REASONING:
 * - Comprehensive type safety for all Ekuatia system interactions
 * - Enforces business rules and constraints at compile time
 * - Provides clear contracts for API request/response structures
 * - Supports both BASICA and AVANZADA modalities
 * - Includes validation for Spanish-specific field names
 *
 * AGENT DECISION PROCESS:
 * - Requirements analyzed from assets/ekuatia-agent-guide.md (1519 lines)
 * - Business rules extracted from Ekuatia system documentation
 * - Considered: separate files vs single consolidated file
 * - Selected consolidated file for better discoverability in early development
 * - Trade-offs: Larger file but easier type management initially
 */

// ============================================================================
// ENUMS - Fixed values from Ekuatia system requirements
// ============================================================================

/**
 * Document types supported by Ekuatia system
 * Based on business rules from assets/ekuatia-agent-guide.md
 */
export type DocumentType = 'FACTURA ELECTRONICA' | 'NOTA_CREDITO' | 'NOTA_DEBITO';

/**
 * Taxpayer classification types from RUC system
 * FISICO = Individual person, JURIDICO = Legal entity
 */
export type TaxpayerType = 'FISICO' | 'JURIDICO';

/**
 * Configuration modalities available in Ekuatia
 * BASICA = Simple invoicing, AVANZADA = Advanced features (DNCP, etc.)
 */
export type ModalityType = 'BASICA' | 'AVANZADA';

/**
 * Emission mode - only SOLUCIÓN GRATUITA supported for direct taxpayer access
 */
export type EmissionMode = 'SOLUCIÓN GRATUITA';

/**
 * RUC status values from Marangatu system
 */
export type RucStatus = 'Activo' | 'Inactivo' | 'Suspendido';

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

/**
 * Login credentials for Ekuatia system authentication
 */
export interface LoginCredentials {
  /** RUC without verification digit (format: 1234567, NOT 1234567-1) */
  username: string;
  /** Confidential access key from Marangatu tax management system */
  password: string;
  /** Emission mode - always SOLUCIÓN GRATUITA for direct access */
  emission_mode: EmissionMode;
}

/**
 * Profile data retrieved from Marangatu after successful login
 */
export interface ProfileData {
  /** Complete RUC with verification digit */
  ruc_with_dv: string;
  /** Registered business name from RUC */
  business_name: string;
  /** Current RUC status in tax system */
  ruc_status: RucStatus;
  /** Timbrado number from DNIT for document generation */
  numero_timbrado: string;
  /** Primary economic activity from RUC registration */
  actividad_economica: string;
  /** Date when electronic invoicer was approved */
  fecha_aprobacion: string;
  /** Taxpayer type classification */
  tipo_contribuyente: TaxpayerType;
  /** Security code for electronic document signing */
  csc: string;
}

/**
 * Establishment data from taxpayer registration
 */
export interface EstablishmentData {
  /** Department where establishment is located */
  department: string;
  /** District for legal address */
  district: string;
  /** City for legal address */
  city: string;
  /** Full street address */
  address: string;
}

/**
 * Successful login response from Ekuatia API
 */
export interface LoginResponse {
  /** Login operation success status */
  success: true;
  /** Session token for subsequent API calls */
  session_token: string;
  /** Taxpayer profile information */
  profile: ProfileData;
  /** Establishment address data */
  establishment_data: EstablishmentData;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Issuer data for Ekuatia configuration
 * Critical for document generation and compliance
 */
export interface IssuerData {
  /** Timbrado number from DNIT */
  numero_timbrado: string;
  /** Establishment number - always 1 for single-establishment constraint */
  establecimiento: number;
  /** Primary document type for issuance */
  tipo_documento: DocumentType;
  /** Economic activity description */
  actividad_economica: string;
  /** Configuration validity start date */
  fecha_inicio_vigencia: string;
  /** Dispatch point - always 1 for single-point constraint */
  punto_expedicion: number;
  /** Taxpayer classification */
  tipo_contribuyente: TaxpayerType;
  /** CSC code for electronic signatures */
  codigo_seguridad_contribuyente: string;
}

/**
 * Advanced groups configuration for AVANZADA modality
 */
export interface GruposUtilizables {
  /** Enable for DNCP (public procurement) contracts */
  informaciones_compras_publicas?: boolean;
  /** Supermarket sector (NOT available in current implementation) */
  sector_supermercados?: boolean;
}

/**
 * Complete Ekuatia system configuration
 * One-time setup per RUC with 90-day cache TTL
 */
export interface EkuatiaConfig {
  /** Configuration modality type */
  modality: ModalityType;
  /** Optional company logo for invoices */
  logo?: string | null;
  /** Advanced groups (only for AVANZADA modality) */
  grupos_utilizables?: GruposUtilizables;
  /** Core issuer configuration data */
  issuer_data: IssuerData;
  /** Optional business name override */
  razon_social?: string;
  /** Optional address override */
  direccion?: string;
}

// ============================================================================
// INVOICE TYPES
// ============================================================================

/**
 * Individual line item in electronic invoice
 */
export interface InvoiceItem {
  /** Product or service code */
  codigo_producto: string;
  /** Detailed description of item */
  descripcion: string;
  /** Quantity of items */
  cantidad: number;
  /** Unit price before tax */
  precio_unitario: number;
  /** IVA tax amount */
  monto_iva: number;
  /** Total amount including tax */
  monto_total: number;
}

/**
 * Invoice financial summary
 */
export interface InvoiceSummary {
  /** Subtotal before taxes */
  subtotal: number;
  /** Total IVA amount */
  total_iva: number;
  /** Grand total including all taxes */
  total_general: number;
}

/**
 * Complete invoice data for creation request
 */
export interface InvoiceData {
  /** Invoice issuance date */
  fecha: string;
  /** Recipient RUC without DV */
  receptor_ruc: string;
  /** Recipient business name */
  receptor_nombre: string;
  /** Optional recipient address */
  receptor_direccion?: string;
  /** Document type (defaults from config) */
  tipo_documento?: DocumentType;
  /** Establishment number (always 1) */
  establecimiento?: number;
  /** Dispatch point (always 1) */
  punto_expedicion?: number;
  /** Invoice line items */
  items: InvoiceItem[];
  /** Financial summary */
  resumen: InvoiceSummary;
  /** Optional observations/notes */
  observaciones?: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Standardized error response from Ekuatia API
 */
export interface EkuatiaError {
  /** Machine-readable error code */
  code: string;
  /** Human-readable error message (Spanish) */
  message: string;
  /** Optional error details */
  details?: {
    field?: string;
    expected_format?: string;
    allowed_values?: string[];
  };
  /** Error timestamp */
  timestamp: string;
}

/**
 * Authentication error codes from Ekuatia system
 */
export type AuthenticationErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'APPROVAL_NOT_FOUND'
  | 'RUC_INACTIVE'
  | 'SYSTEM_ERROR';

/**
 * Configuration error codes
 */
export type ConfigurationErrorCode =
  | 'MULTIPLE_ESTABLISHMENTS'
  | 'CERTIFICATE_MISSING'
  | 'CSC_INVALID'
  | 'SYSTEM_ERROR';

/**
 * Invoice creation error codes
 */
export type InvoiceErrorCode =
  | 'INVALID_DATOS_RECEPTOR'
  | 'MONTO_NEGATIVO'
  | 'DOCUMENTO_DUPLICADO'
  | 'TIMBRADO_EXPIRED'
  | 'SYSTEM_ERROR';

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Generic successful API response wrapper
 */
export interface ApiResponse<T> {
  /** Success status */
  success: true;
  /** Response data */
  data: T;
  /** Response timestamp */
  timestamp: string;
}

/**
 * Generic error API response wrapper
 */
export interface ApiErrorResponse {
  /** Error status */
  success: false;
  /** Error details */
  error: EkuatiaError;
  /** Response timestamp */
  timestamp: string;
}

// ============================================================================
// CACHE TYPES
// ============================================================================

/**
 * Cache entry structure for configuration storage
 */
export interface CacheEntry<T> {
  /** Cached data */
  data: T;
  /** Storage timestamp */
  stored_timestamp: string;
  /** Cache duration in milliseconds */
  cache_duration: string;
  /** Cache invalidation triggers */
  invalidation_triggers: string[];
}

/**
 * Cache invalidation trigger types
 */
export type CacheInvalidationTrigger =
  | 'ruc_status_change'
  | 'establishment_update'
  | 'csc_update'
  | 'timbrado_expiration'
  | 'configuration_notification';
