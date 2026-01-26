# Ekuatia Invoice Automation Guide for Coding Agents

## Overview

This guide documents the **e-Kuatia'i System** - Paraguay's National Integrated Electronic Invoice System managed by the **Dirección Nacional de Ingresos Tributarios (DNIT)**. This document is designed to help AI agents and developers build automated invoice creation systems that interact with the Ekuatia platform.

**System URL:** https://ekuatia.set.gov.py/ekuatiai/

---

## Table of Contents

1. [Prerequisites & Requirements](#prerequisites--requirements)
2. [System Constraints](#system-constraints)
3. [Authentication Flow](#authentication-flow)
4. [Configuration Pipeline](#configuration-pipeline)
5. [API Integration Points](#api-integration-points)
6. [Data Structures & Field Mappings](#data-structures--field-mappings)
7. [State Management](#state-management)
8. [Error Handling](#error-handling)
9. [Automation Workflow](#automation-workflow)

---

## Prerequisites & Requirements

Before automating invoice creation, the following prerequisites must be met:

### 1. Qualified Electronic Signature Certificate (CCFE)

- **Requirement:** Obtain Qualified Certificate of Electronic Signature - Obtener el Certificado Cualificado de Firma Electrónica (CCFE)
- **Reference:** Resolución DNIT N° 757/2024
- **Status:** Must be obtained BEFORE enabling as electronic invoicer
- **Agent Action:** Verify certificate validity before processing invoices

### 2. Electronic Invoicer Enablement Request

- **System:** Marangatu (Paraguayan Tax Management System)
- **Frequency:** One-time only
- **Required Credentials:** User's Confidential Access Key (Clave de Acceso Confidencial)
- **Status Required:** Must be in "Approved" state for SOLUCIÓN GRATUITA mode
- **Compliance Requirements:**
  - Must be current on tax obligations
  - Must have filed all tax declarations (Declaraciones Juradas de liquidación de impuestos e Informativas)
  - RUC must be in "Active" state

### 3. Taxpayer Profile Requirements

- **Single Establishment:** Only one establishment declared in RUC
- **Unique Dispatch Point:** Only one "punto de expedición"
- **Access Restriction:** Only the taxpayer can access (not through authorized third parties)

---

## System Constraints

### Critical Limitations

| Constraint                | Impact                              | Agent Handling                                                                   |
| ------------------------- | ----------------------------------- | -------------------------------------------------------------------------------- |
| Single Establishment Only | Cannot manage multiple branches     | Validate RUC has only 1 establishment before processing                          |
| Unique Dispatch Point     | Only one point of issue per session | Store dispatch point in configuration; fail if mismatch                          |
| Direct Access Only        | No third-party agent authorization  | Use taxpayer credentials; authenticate for each session                          |
| Emission Mode             | Must use "SOLUCIÓN GRATUITA" mode   | Verify enablement status before invoice issuance                                 |
| Configuration One-Time    | Setup not repeatable                | Cache configuration after first setup; skip steps 2.1-2.5 on subsequent sessions |

---

## Authentication Flow

### Step 1: System Access & Login

**Endpoint:** `https://ekuatia.set.gov.py/ekuatiai/`

**Authentication Parameters:**

```json
{
  "username": "RUC_WITHOUT_VERIFICATION_DIGIT",
  "password": "MARANGATU_CONFIDENTIAL_ACCESS_KEY",
  "emission_mode": "SOLUCIÓN GRATUITA"
}
```

**Validation Rules:**

- Username: RUC sin dígito verificador (RUC without check digit)
- Password: Confidential access key from Marangatu system
- System validates approved Electronic Invoicer status

**Error Scenarios:**

```
Status: NOT_APPROVED
Message: "La Solicitud de Habilitación como Facturador Electrónico no está en estado 'Aprobado'"
Action: User must complete enablement through Marangatu before agent can proceed

Status: INVALID_CREDENTIALS
Message: Authentication failed
Action: Verify credentials are current; may need password refresh

Status: ACTIVE_SESSION_REQUIRED
Message: RUC not in Active state
Action: Check RUC status in Marangatu; resolve compliance issues
```

**Agent Implementation Note:** Store authentication status and session token for subsequent requests within same execution window.

---

## Configuration Pipeline

### Step 2: Profile Retrieval (Automatic)

**System automatically retrieves from Marangatu:**

```json
{
  "profile": {
    "ruc_with_dv": "5452-1",
    "business_name": "Teresa De Jesus",
    "ruc_status": "Activo"
  },
  "establishment_data": {
    "department": "Capital",
    "district": "Asunción (distrito)",
    "city": "Asunción (distrito)",
    "address": "Avenida Principal 123"
  }
}
```

**Agent Action:** Cache this data; verify against local records for data consistency checks.

---

### Step 2.1: Access Tools Menu

**UI Navigation:** Perfil → Menú → Mis Herramientas

**Agent Implementation:** Direct API call to tools configuration endpoint.

**One-Time Configuration Flag:**

```json
{
  "configuration_required": true,
  "steps_to_skip_next_time": ["2.1", "2.2", "2.3", "2.4", "2.5"],
  "cache_key": "ekuatia_config_${ruc}"
}
```

**Important:** Verify if the configuration in "Datos de Emissor" is already done. After first-time configuration, cache this setup. On subsequent logins, skip directly to invoice issuance (Step 4).

---

### Step 2.2: Electronic Invoicer Configuration Menu

**Menu Option:** "Configurar Datos Facturador Electrónico"

**Agent Action:** Direct to configuration form with previously saved data.

**Configuration Fields Available:**

- Configuración de Datos Facturador Electrónico
- Catálogo de productos
- Ayuda (Help system)

---

### Step 2.3: Modality Selection

The system supports two modalities that affect available fields:

#### Modality A: BÁSICA (Basic)

**Available Fields:**

- Logo (optional)
- Datos de Emisor (Issuer Data - required)

**Use Case:** Simple invoice issuance without advanced grouping options

**Field Mapping:**

```json
{
  "logo": {
    "type": "image_file",
    "required": false,
    "formats": ["png", "jpg", "jpeg"],
    "description": "Company logo for invoice display"
  },
  "issuer_data": {
    "numero_timbrado": {
      "type": "string",
      "required": true,
      "description": "Stamp/Timbrado number from DNIT"
    },
    "establecimiento": {
      "type": "integer",
      "required": true,
      "default": 1,
      "description": "Establishment number (always 1 for single-establishment constraint)"
    },
    "tipo_documento": {
      "type": "enum",
      "required": true,
      "options": ["FACTURA ELECTRONICA", "NOTA_CREDITO", "NOTA_DEBITO"],
      "description": "Primary document type for issuance"
    },
    "actividad_economica": {
      "type": "string",
      "required": true,
      "description": "Economic activity from Marangatu",
      "example": "Otras actividades de servicios personales n.c.p."
    },
    "fecha_inicio_vigencia": {
      "type": "date",
      "format": "DD/MM/YYYY",
      "required": true,
      "description": "Validity start date from enablement approval"
    },
    "punto_expedicion": {
      "type": "integer",
      "required": true,
      "default": 1,
      "description": "Dispatch point (always 1 for single-point constraint)"
    },
    "tipo_contribuyente": {
      "type": "enum",
      "required": true,
      "options": ["FISICO", "JURIDICO"],
      "description": "Taxpayer type from RUC"
    },
    "codigo_seguridad_contribuyente": {
      "type": "string",
      "required": true,
      "description": "CSC - Security code from DNIT"
    }
  }
}
```

#### Modality B: AVANZADA (Advanced)

**Additional Fields (beyond Basic):**

- Grupos Utilizables (Usable Groups)
  - Informaciones de Compras Públicas (Public Procurement Information)
  - Sector Supermercados (Supermarket Sector - NOT AVAILABLE in initial implementation phase)

**Advanced Field Mapping:**

```json
{
  "grupos_utilizables": {
    "informaciones_compras_publicas": {
      "type": "boolean",
      "required": false,
      "description": "Enable if invoicing for public contracts (DNCP)",
      "conditional_fields": [
        "dncp_reference",
        "contract_number",
        "procurement_id"
      ]
    },
    "sector_supermercados": {
      "type": "boolean",
      "required": false,
      "available": false,
      "note": "Not available in current implementation phase",
      "placeholder": null
    }
  }
}
```

**Selection Logic:**

```
IF informaciones_compras_publicas == true
  THEN require: DNCP reference data
  AND validate against DNCP system
ELSE IF sector_supermercados == true
  THEN return ERROR: "Not available in this phase"
ELSE IF neither selected
  THEN proceed with standard configuration
```

**Agent Decision Tree:**

```
1. Determine invoice type and requirements
2. IF public procurement: AVANZADA mode with DNCP
3. ELSE IF standard commercial: BÁSICA mode
4. Store modality selection in cache
5. Load configuration form with appropriate fields
```

---

### Step 2.4: Issuer Data Population

**Data Source:** Automatic retrieval from Marangatu Form N° 364 - "Solicitud de Habilitación como Facturador Electrónico"

**Critical Business Logic:** Document Type Selection

When multiple document types were selected during enablement, implement the following strategy:

```json
{
  "document_type_selection_rule": {
    "rule": "Select most frequently issued document type",
    "rationale": "System will use this as primary document for subsequent issuance",
    "implementation": {
      "step_1": "Query invoice history or business forecast",
      "step_2": "Identify most common document type",
      "step_3": "Set as 'tipo_documento' in configuration",
      "step_4": "System uses this for Step 4 invoice issuance"
    }
  }
}
```

**Example Logic:**

```
IF company_type == "Service Provider"
  THEN primary_document = "FACTURA ELECTRONICA"
ELSE IF company_type == "Goods Seller"
  THEN primary_document = "FACTURA ELECTRONICA"
ELSE IF adjustments_needed
  THEN primary_document = "NOTA_CREDITO" or "NOTA_DEBITO"

Configure system with primary_document
Note: Other approved types remain available in invoice issuance interface
```

**Complete Issuer Data Structure:**

```json
{
  "numero_timbrado": "12561412",
  "establecimiento": 1,
  "tipo_documento": "FACTURA ELECTRONICA",
  "actividad_economica": "Otras actividades de servicios personales n.c.p.",
  "fecha_inicio_vigencia": "20/03/2024",
  "tipo_contribuyente": "FISICO",
  "punto_expedicion": 1,
  "codigo_seguridad_contribuyente": "CSC_VALUE",
  "logo_file": null
}
```

---

### Step 2.5: Configuration Save

**Action:** Persist all configuration data

**Agent Implementation:**

```javascript
async function saveConfiguration(configData) {
  try {
    const response = await ekuatiaAPI.post("/configuracion/guardar", {
      ...configData,
      timestamp: new Date().toISOString(),
      session_id: currentSession.id,
    });

    if (response.status === "SUCCESS") {
      // Cache configuration with TTL
      cache.set(`ekuatia_config_${ruc}`, configData, {
        ttl: 90 * 24 * 60 * 60 * 1000, // 90 days
      });

      return { success: true, config_id: response.config_id };
    } else {
      throw new ConfigurationError(response.message);
    }
  } catch (error) {
    logger.error("Configuration save failed", { ruc, error });
    throw error;
  }
}
```

**Cache Strategy:**

```json
{
  "cache_key": "ekuatia_config_{ruc}",
  "stored_data": {
    "configuration_data": "...",
    "saved_timestamp": "2024-01-25T15:51:22.869707Z",
    "cache_duration": "90 days",
    "invalidation_triggers": [
      "RUC status change",
      "Establishment update",
      "CSC change",
      "Timbrado expiration"
    ]
  }
}
```

---

## API Integration Points

### Endpoint Map for Automation

```
Ekuatia'i System Endpoints (Inferred from UI Flow)
└── Base URL: https://ekuatia.set.gov.py/ekuatiai/

LOGIN
├── POST /login
│   ├── Params: username (RUC), password (Marangatu key)
│   └── Returns: session_token, profile_data

PROFILE
├── GET /perfil
│   ├── Returns: RUC, business_name, ruc_status
│   └── Returns: establishment_data (dept, district, city, address)
├── GET /herramientas
│   └── Returns: available_tools

CONFIGURATION (One-time)
├── GET /configuracion/formulario
│   ├── Returns: configuration_form with available_modalities
├── POST /configuracion/guardar
│   ├── Params: all_configuration_data
│   └── Returns: configuration_id, success_status

DOCUMENTO TRIBUTARIO (Invoice Issuance)
├── GET /documento/tipos
│   ├── Returns: available_document_types
├── POST /documento/crear
│   ├── Params: invoice_data_structure
│   └── Returns: documento_id, cdc (código de control)
├── GET /documento/{documento_id}
│   ├── Returns: full_document_with_cdc
└── POST /documento/{documento_id}/firmar
    ├── Params: electronic_signature
    └── Returns: signed_document, timestamp
```

---

## Data Structures & Field Mappings

### Invoice Creation Payload Structure

Based on the Ekuatia system logic, the invoice creation structure should follow:

```json
{
  "metadatos": {
    "ruc_emisor": "5452",
    "numero_timbrado": "12561412",
    "punto_expedicion": 1,
    "establecimiento": 1,
    "fecha_emision": "DD/MM/YYYY",
    "tipo_documento": "FACTURA ELECTRONICA"
  },
  "datos_emisor": {
    "razon_social": "Teresa De Jesus",
    "actividad_economica": "Otras actividades de servicios personales n.c.p.",
    "direccion": "Avenida Principal 123"
  },
  "datos_receptor": {
    "ruc_receptor": "XXXXX",
    "razon_social_receptor": "Cliente Name",
    "direccion_receptor": "Address"
  },
  "detalles_factura": {
    "items": [
      {
        "codigo_producto": "PROD001",
        "descripcion": "Descripción del producto/servicio",
        "cantidad": 1,
        "precio_unitario": 100000,
        "monto_iva": 0,
        "monto_total": 100000
      }
    ],
    "resumen": {
      "subtotal": 100000,
      "total_iva": 0,
      "total_general": 100000
    }
  },
  "observaciones": ""
}
```

---

## State Management

### Configuration Caching Strategy

```json
{
  "caching_layer": {
    "level_1_runtime": {
      "duration": "current_session",
      "stores": ["session_token", "profile_data", "modality_selection"],
      "invalidation": "session_end"
    },
    "level_2_persistent": {
      "duration": "90_days",
      "stores": ["issuer_configuration", "document_type_mapping", "csc_value"],
      "invalidation_triggers": [
        "explicit_cache_clear",
        "ruc_status_change",
        "establishment_change",
        "configuration_update_from_marangatu"
      ]
    }
  }
}
```

### Session State Flow

```
START
  ↓
Check Configuration Cache (Level 2)
  ├─ Cache Hit: Load cached config
  │  ↓
  │  Skip Steps 2.1-2.5
  │  ↓
  │  Go to Step 4 (Invoice Issuance)
  │
  └─ Cache Miss: Begin full setup
     ↓
     Step 1: Authenticate
     ↓
     Step 2: Retrieve Profile
     ↓
     Steps 2.1-2.5: Configure (One-time)
     ↓
     Save to Cache (Level 2)
     ↓
     Step 4: Invoice Issuance (Enabled)
```

### Invoice Issuance State

```
Invoice Creation Request
  ↓
Load Configuration from Cache
  ↓
Validate Invoice Data
  ├─ Check required fields
  ├─ Validate formats
  └─ Check business rules (amounts, dates, etc.)
  ↓
Prepare Submission
  ├─ Add metadata from config
  ├─ Apply document type from config
  └─ Calculate checksums/validation codes
  ↓
Submit to API
  ↓
Receive Response
  ├─ Success: Store CDC (Control Code)
  │  ↓
  │  Retrieve Signed Document
  │  ↓
  │  Return to User
  │
  └─ Failure: Handle Error
     ↓
     Log Details
     ↓
     Retry or Report
```

---

## Error Handling

### Expected Error Scenarios

```json
{
  "authentication_errors": {
    "INVALID_CREDENTIALS": {
      "code": 401,
      "message": "RUC o Clave de Acceso incorrecta",
      "recovery": "Verify credentials with Marangatu system; reset if needed"
    },
    "APPROVAL_NOT_FOUND": {
      "code": 403,
      "message": "No existe solicitud de habilitación aprobada",
      "recovery": "User must complete enablement through Marangatu (Form 364)"
    },
    "RUC_INACTIVE": {
      "code": 403,
      "message": "RUC no está en estado Activo",
      "recovery": "User must resolve compliance issues in Marangatu"
    }
  },
  "configuration_errors": {
    "MULTIPLE_ESTABLISHMENTS": {
      "code": 400,
      "message": "RUC tiene múltiples establecimientos",
      "recovery": "System only supports single establishment; user must update RUC"
    },
    "CERTIFICATE_MISSING": {
      "code": 400,
      "message": "Certificado Cualificado de Firma Electrónica no encontrado",
      "recovery": "User must obtain CCFE per Resolución DNIT N° 757/2024"
    },
    "CSC_INVALID": {
      "code": 400,
      "message": "Código de Seguridad Contribuyente inválido o expirado",
      "recovery": "Contact DNIT to refresh CSC"
    }
  },
  "invoice_errors": {
    "INVALID_DATOS_RECEPTOR": {
      "code": 400,
      "message": "Datos del receptor inválidos o incompletos",
      "recovery": "Validate recipient RUC and business name before submission"
    },
    "MONTO_NEGATIVO": {
      "code": 400,
      "message": "Montos deben ser positivos",
      "recovery": "Check invoice items for calculation errors"
    },
    "DOCUMENTO_DUPLICADO": {
      "code": 409,
      "message": "Documento ya fue registrado",
      "recovery": "Check invoice history; use NOTA_CREDITO if correction needed"
    }
  }
}
```

### Retry Strategy

```javascript
async function submitInvoiceWithRetry(invoiceData, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ekuatiaAPI.post("/documento/crear", invoiceData);
      return response;
    } catch (error) {
      lastError = error;

      if (isRetryable(error.code)) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
        await sleep(backoffMs);
        continue;
      } else {
        // Non-retryable error
        throw error;
      }
    }
  }

  throw lastError;
}

function isRetryable(errorCode) {
  return ["TIMEOUT", "TEMPORARY_UNAVAILABLE", "RATE_LIMITED"].includes(
    errorCode
  );
}
```

---

## Automation Workflow

### Critical Safety Requirements

**MANDATORY PRE-ACTION STEPS:**

1. **ALWAYS retrieve current configuration before any modification**
2. **ALWAYS request user confirmation before any configuration change**
3. **ALWAYS request user confirmation before posting any invoice**

### Configuration Retrieval Protocol

```typescript
interface EkuatiaConfig {
  modality: 'BASICA' | 'AVANZADA';
  logo?: string | null;
  issuer_data: {
    numero_timbrado: string;
    establecimiento: number;
    tipo_documento: 'FACTURA ELECTRONICA' | 'NOTA_CREDITO' | 'NOTA_DEBITO';
    actividad_economica: string;
    fecha_inicio_vigencia: string;
    punto_expedicion: number;
    tipo_contribuyente: 'FISICO' | 'JURIDICO';
    codigo_seguridad_contribuyente: string;
  };
  razon_social?: string;
  direccion?: string;
}

async function getCurrentConfiguration(
  ruc: string, 
  sessionToken: string
): Promise<EkuatiaConfig | null> {
  /** ALWAYS call this before any configuration modification */
  try {
    // First attempt: Get from cache with validation
    const cachedConfig = cache.get<EkuatiaConfig>(`ekuatia_config_${ruc}`);
    if (cachedConfig) {
      // Validate cached config against system
      const currentSystemConfig = await ekuatiaAPI.get<EkuatiaConfig>(
        '/configuracion/actual',
        {
          headers: { Authorization: `Bearer ${sessionToken}` }
        }
      );
      
      if (!configsMatch(cachedConfig, currentSystemConfig)) {
        logger.warn(`Config mismatch for RUC ${ruc}, using system config`);
        return currentSystemConfig;
      }
      return cachedConfig;
    }
    
    // Second attempt: Get directly from system
    const systemConfig = await ekuatiaAPI.get<EkuatiaConfig>(
      '/configuracion/actual',
      {
        headers: { Authorization: `Bearer ${sessionToken}` }
      }
    );
    
    // Update cache with current system state
    cache.set(`ekuatia_config_${ruc}`, systemConfig, { 
      ttl: 90 * 24 * 60 * 60 // 90 days
    });
    return systemConfig;
    
  } catch (error) {
    logger.error(`Failed to retrieve configuration for RUC ${ruc}:`, error);
    throw new ConfigurationRetrievalError(`Unable to get current config: ${error}`);
  }
}

function configsMatch(config1: EkuatiaConfig, config2: EkuatiaConfig): boolean {
  return JSON.stringify(config1) === JSON.stringify(config2);
}
```

### User Confirmation Protocol

```typescript
interface InvoiceData {
  fecha: string;
  receptor_ruc: string;
  receptor_nombre: string;
  receptor_direccion?: string;
  tipo_documento?: 'FACTURA ELECTRONICA' | 'NOTA_CREDITO' | 'NOTA_DEBITO';
  establecimiento?: number;
  punto_expedicion?: number;
  items: InvoiceItem[];
  resumen: InvoiceSummary;
  observaciones?: string;
}

interface InvoiceItem {
  codigo_producto: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  monto_iva: number;
  monto_total: number;
}

interface InvoiceSummary {
  subtotal: number;
  total_iva: number;
  total_general: number;
}

interface CalculatedTotals {
  subtotal: number;
  total_iva: number;
  total_general: number;
}

async function requestConfigurationConfirmation(
  configChanges: Partial<EkuatiaConfig>, 
  currentConfig: EkuatiaConfig
): Promise<boolean> {
  /** ALWAYS request confirmation before modifying configuration */
  
  const confirmationPrompt = `
=== CONFIGURATION MODIFICATION REQUEST ===
    
Current Configuration:
${JSON.stringify(currentConfig, null, 2)}

Proposed Changes:
${JSON.stringify(configChanges, null, 2)}

Impact Analysis:
- Document type: ${configChanges.issuer_data?.tipo_documento || currentConfig.issuer_data.tipo_documento}
- Modality: ${configChanges.modality || currentConfig.modality}
- Establishment: ${configChanges.issuer_data?.establecimiento || currentConfig.issuer_data.establecimiento}
- Dispatch Point: ${configChanges.issuer_data?.punto_expedicion || currentConfig.issuer_data.punto_expedicion}

WARNING: This will modify your Ekuatia invoicer configuration.
Changes affect all subsequent invoice issuances.

Confirm configuration modification? (yes/no)
`;
  
  return await getUserConfirmation(confirmationPrompt);
}

async function requestInvoiceConfirmation(
  invoiceData: InvoiceData, 
  calculatedTotals: CalculatedTotals
): Promise<boolean> {
  /** ALWAYS request confirmation before posting invoice */
  
  const confirmationPrompt = `
=== INVOICE POSTING CONFIRMATION ===

Invoice Details:
- Recipient: ${invoiceData.receptor_nombre} (${invoiceData.receptor_ruc})
- Date: ${invoiceData.fecha}
- Document Type: ${invoiceData.tipo_documento || 'FACTURA ELECTRONICA'}
- Items: ${invoiceData.items?.length || 0}

Financial Summary:
- Subtotal: ${calculatedTotals.subtotal.toLocaleString('es-PY', { minimumFractionDigits: 2 })} PYG
- IVA: ${calculatedTotals.total_iva.toLocaleString('es-PY', { minimumFractionDigits: 2 })} PYG
- Total: ${calculatedTotals.total_general.toLocaleString('es-PY', { minimumFractionDigits: 2 })} PYG

WARNING: This will submit a legally binding electronic invoice to DNIT.
The invoice cannot be deleted once posted (credit notes required for corrections).

Confirm invoice posting? (yes/no)
`;
  
  return await getUserConfirmation(confirmationPrompt);
}
```

### Complete Agent Flow for Invoice Automation

```
PHASE 1: INITIALIZATION
├─ [Agent] Receive invoice creation request
├─ [Agent] Extract taxpayer RUC and credentials
├─ [System] MANDATORY: Retrieve current configuration from system
│  └─ [VALIDATION] Compare with cache; use system as source of truth
├─ [System] Check if configuration exists
│  ├─ [Config Found] → Continue to Phase 3
│  └─ [Config Missing] → Continue to Phase 2
│
└─ PHASE 2: CONFIGURATION (One-time per RUC)
   ├─ [Agent] POST /login with RUC + Marangatu key
   ├─ [System] Validate credentials and approval status
   ├─ [System] Retrieve profile and establishment data
   ├─ [Agent] GET /configuracion/formulario
   ├─ [Agent] Determine modality (BÁSICA or AVANZADA)
   ├─ [Agent] Build proposed configuration changes
   ├─ [Agent] MANDATORY: Request user confirmation for configuration
   │  └─ [User APPROVES] → Continue
   │  └─ [User REJECTS] → Abort with reason
   ├─ [Agent] POST /configuracion/guardar (only after confirmation)
   ├─ [System] Validate and save configuration
   └─ [Agent] Cache configuration (90-day TTL)

PHASE 3: INVOICE ISSUANCE (Repeatable)
├─ [Agent] MANDATORY: Load current configuration from system
├─ [Agent] Validate invoice data:
│  ├─ Check required fields present
│  ├─ Validate formats (dates, amounts, RUC)
│  └─ Calculate totals and apply tax logic
├─ [Agent] Build invoice payload:
│  ├─ Add metadata from current config
│  ├─ Apply tipo_documento from current config
│  ├─ Include receiver data
│  └─ Serialize items with descriptions and amounts
├─ [Agent] MANDATORY: Request user confirmation for invoice posting
│  ├─ [User APPROVES] → Continue
│  └─ [User REJECTS] → Abort with reason
├─ [Agent] POST /documento/crear (only after confirmation)
├─ [System] Validate invoice data
├─ [System] Generate CDC (Código de Control)
├─ [Agent] GET /documento/{documento_id}
├─ [System] Return signed document with CDC
├─ [Agent] Store CDC and document reference
└─ [Agent] Return document to user/system

PHASE 4: ERROR HANDLING
├─ [Agent] Catch error from any phase
├─ [Agent] Classify error type
├─ [Agent] Apply recovery strategy:
│  ├─ Authentication errors → Re-authenticate
│  ├─ Configuration errors → Notify user for manual fix
│  ├─ Transient errors → Retry with backoff
│  └─ Business errors → Return error details to user
└─ [Agent] Log for audit trail
```

### Pseudo-Code Implementation

```typescript
// Custom Error Classes
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

class InvoiceCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvoiceCreationError';
  }
}

class ConfigurationRetrievalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationRetrievalError';
  }
}

// Interface definitions
interface ProfileData {
  ruc_with_dv: string;
  business_name: string;
  ruc_status: string;
  numero_timbrado: string;
  actividad_economica: string;
  fecha_aprobacion: string;
  tipo_contribuyente: 'FISICO' | 'JURIDICO';
  csc: string;
}

interface InvoiceResponse {
  documento_id: string;
  codigo_control: string;
  fecha_emision: string;
}

interface ProcessResult {
  success: boolean;
  documento_id?: string;
  cdc?: string;
  fecha_emision?: string;
  error?: string;
  recovery?: string;
}

class EkuatiaInvoiceAgent {
  private ruc: string;
  private marangatuKey: string;
  private cache: Map<string, any>;
  private session: string | null = null;
  private config: EkuatiaConfig | null = null;
  private profile: ProfileData | null = null;

  constructor(ruc: string, marangatuKey: string) {
    this.ruc = ruc;
    this.marangatuKey = marangatuKey;
    this.cache = new Map();
  }

  async processInvoice(invoiceData: InvoiceData): Promise<ProcessResult> {
    /** Main entry point for invoice creation */
    try {
      // Phase 1: Initialize and get current config
      await this.ensureConfigured();

      // Phase 2: Validate invoice data and get confirmation
      await this.validateAndConfirmInvoice(invoiceData);

      // Phase 3: Issue invoice
      const result = await this.createInvoice(invoiceData);

      return {
        success: true,
        documento_id: result.documento_id,
        cdc: result.codigo_control,
        fecha_emision: result.fecha_emision
      };

    } catch (error) {
      return this.handleError(error);
    }
  }

  private async ensureConfigured(): Promise<void> {
    /** ALWAYS retrieve current configuration; configure if needed */
    // MANDATORY: Always get current configuration first
    this.config = await getCurrentConfiguration(this.ruc, this.session || '');
    
    if (!this.config) {
      // No configuration exists - need to create one
      await this.authenticate();
      await this.retrieveProfile();
      await this.configureInvoicer();
      
      // Refresh config after setup
      this.config = await getCurrentConfiguration(this.ruc, this.session || '');
    }
  }

  private async validateAndConfirmInvoice(invoiceData: InvoiceData): Promise<void> {
    /** Validate invoice and MANDATORY: request user confirmation */
    // Calculate totals for confirmation
    const calculatedTotals = this.calculateInvoiceTotals(invoiceData);
    
    // Validate invoice data against current config
    this.validateInvoiceAgainstConfig(invoiceData, this.config!);
    
    // MANDATORY: Request user confirmation before posting
    const confirmed = await requestInvoiceConfirmation(invoiceData, calculatedTotals);
    if (!confirmed) {
      throw new InvoiceCreationError('User cancelled invoice posting');
    }
  }

  private calculateInvoiceTotals(invoiceData: InvoiceData): CalculatedTotals {
    /** Calculate invoice totals for confirmation */
    const subtotal = invoiceData.items.reduce(
      (sum, item) => sum + (item.cantidad * item.precio_unitario), 
      0
    );
    
    // Apply tax logic based on items and config
    const totalIva = invoiceData.items.reduce(
      (sum, item) => sum + (item.monto_iva || 0), 
      0
    );
    
    const totalGeneral = subtotal + totalIva;
    
    return {
      subtotal,
      total_iva: totalIva,
      total_general: totalGeneral
    };
  }

  private async authenticate(): Promise<void> {
    /** Phase 2.1: Login */
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: this.ruc.split('-')[0], // RUC without DV
        password: this.marangatuKey
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new AuthenticationError(errorData.message);
    }

    const data = await response.json();
    this.session = data.session_token;
  }

  private async retrieveProfile(): Promise<void> {
    /** Phase 2.2: Get profile data */
    const response = await fetch(`${BASE_URL}/perfil`, {
      headers: {
        'Authorization': `Bearer ${this.session}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new AuthenticationError('Failed to retrieve profile');
    }

    this.profile = await response.json();
  }

  private async configureInvoicer(): Promise<void> {
    /** Phase 2.3-2.5: Configure with MANDATORY confirmation */
    // Determine modality
    const modality: 'BASICA' | 'AVANZADA' = 'BASICA'; // Default for most cases

    const configData: Partial<EkuatiaConfig> = {
      modality,
      logo: null,
      issuer_data: {
        numero_timbrado: this.profile!.numero_timbrado,
        establecimiento: 1,
        tipo_documento: 'FACTURA ELECTRONICA',
        actividad_economica: this.profile!.actividad_economica,
        fecha_inicio_vigencia: this.profile!.fecha_aprobacion,
        punto_expedicion: 1,
        tipo_contribuyente: this.profile!.tipo_contribuyente,
        codigo_seguridad_contribuyente: this.profile!.csc
      }
    };

    // MANDATORY: Request user confirmation before configuration
    const confirmed = await requestConfigurationConfirmation(configData, {} as EkuatiaConfig);
    if (!confirmed) {
      throw new ConfigurationError('User cancelled configuration setup');
    }

    const response = await fetch(`${BASE_URL}/configuracion/guardar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.session}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new ConfigurationError(errorData.message);
    }

    this.config = configData as EkuatiaConfig;
  }

  private async createInvoice(invoiceData: InvoiceData): Promise<InvoiceResponse> {
    /** Phase 3: Create invoice (confirmation already obtained) */
    const payload = {
      metadatos: {
        ruc_emisor: this.ruc.split('-')[0],
        numero_timbrado: this.config!.issuer_data.numero_timbrado,
        punto_expedicion: 1,
        establecimiento: 1,
        fecha_emision: invoiceData.fecha,
        tipo_documento: this.config!.issuer_data.tipo_documento
      },
      datos_emisor: {
        razon_social: this.config?.razon_social,
        actividad_economica: this.config!.issuer_data.actividad_economica,
        direccion: this.config?.direccion
      },
      datos_receptor: {
        ruc_receptor: invoiceData.receptor_ruc,
        razon_social_receptor: invoiceData.receptor_nombre,
        direccion_receptor: invoiceData.receptor_direccion || ''
      },
      detalles_factura: {
        items: invoiceData.items,
        resumen: invoiceData.resumen
      },
      observaciones: invoiceData.observaciones || ''
    };

    const response = await fetch(`${BASE_URL}/documento/crear`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.session}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new InvoiceCreationError(errorData.message);
    }

    return await response.json();
  }

  private async handleError(error: unknown): Promise<ProcessResult> {
    /** Phase 4: Error handling */
    if (error instanceof AuthenticationError) {
      // Clear cached session and retry
      this.session = null;
      return { 
        success: false, 
        error: 'AUTHENTICATION_FAILED',
        recovery: 'Re-authenticate required'
      };
    }

    if (error instanceof ConfigurationError) {
      // Clear cached config; user must fix in Marangatu
      this.cache.delete(`ekuatia_config_${this.ruc}`);
      return { 
        success: false, 
        error: 'CONFIGURATION_INVALID',
        recovery: 'Verify taxpayer data in Marangatu'
      };
    }

    if (error instanceof InvoiceCreationError) {
      // Likely business logic error or user cancellation
      return { 
        success: false, 
        error: error.message 
      };
    }

    if (error instanceof ConfigurationRetrievalError) {
      // Critical: Cannot proceed without config
      return { 
        success: false, 
        error: 'CONFIGURATION_UNAVAILABLE',
        recovery: 'System error retrieving configuration. Please try again later.'
      };
    }

    return { 
      success: false, 
      error: 'UNKNOWN_ERROR' 
    };
  }

  private validateInvoiceAgainstConfig(invoiceData: InvoiceData, config: EkuatiaConfig): void {
    /** Validate invoice data against current configuration */
    // Check document type compatibility
    const allowedTypes: Array<'FACTURA ELECTRONICA' | 'NOTA_CREDITO' | 'NOTA_DEBITO'> = 
      ['FACTURA ELECTRONICA', 'NOTA_CREDITO', 'NOTA_DEBITO'];
    
    if (invoiceData.tipo_documento && !allowedTypes.includes(invoiceData.tipo_documento)) {
      throw new InvoiceCreationError(`Invalid document type. Allowed: ${allowedTypes.join(', ')}`);
    }
    
    // Check establishment and dispatch point
    if (invoiceData.establecimiento && invoiceData.establecimiento !== 1) {
      throw new InvoiceCreationError('Establishment must be 1 (single establishment constraint)');
    }
    
    if (invoiceData.punto_expedicion && invoiceData.punto_expedicion !== 1) {
      throw new InvoiceCreationError('Dispatch point must be 1 (single point constraint)');
    }
  }
}

// Usage Example
async function createInvoiceExample(): Promise<ProcessResult> {
  const agent = new EkuatiaInvoiceAgent(
    '5452-1',
    'confidential_access_key'
  );

  const result = await agent.processInvoice({
    fecha: '25/01/2026',
    receptor_ruc: '1234567',
    receptor_nombre: 'Cliente S.A.',
    items: [
      {
        codigo_producto: 'PROD001',
        descripcion: 'Servicio de consultoría',
        cantidad: 1,
        precio_unitario: 500000,
        monto_iva: 0,
        monto_total: 500000
      }
    ],
    resumen: {
      subtotal: 500000,
      total_iva: 0,
      total_general: 500000
    }
  });
  
  return result;
}
```

---

## Key Automation Decisions

### Safety-First Implementation Rules

```
MANDATORY CONFIGURATION FLOW:
1. ALWAYS retrieve current config before ANY modification
2. ALWAYS validate proposed changes against system state
3. ALWAYS request explicit user confirmation for configuration changes
4. ALWAYS cache only after successful system confirmation

MANDATORY INVOICE FLOW:
1. ALWAYS load current configuration before building invoice
2. ALWAYS validate invoice data against current config
3. ALWAYS calculate and display totals for confirmation
4. ALWAYS request explicit user confirmation before posting
5. NEVER auto-post without user approval
```

### Document Type Selection Logic (with confirmation)

```typescript
interface CompanyProfile {
  invoice_frequency: {
    'FACTURA_ELECTRONICA': number;
    'NOTA_CREDITO': number;
    'NOTA_DEBITO': number;
  };
}

// Analysis phase (no changes made)
function determinePrimaryDocument(companyProfile: CompanyProfile): 'FACTURA ELECTRONICA' | 'NOTA_CREDITO' | 'NOTA_DEBITO' {
  if (companyProfile.invoice_frequency['FACTURA_ELECTRONICA'] > 60) {
    return 'FACTURA_ELECTRONICA';
  } else if (companyProfile.invoice_frequency['NOTA_CREDITO'] > 40) {
    return 'NOTA_CREDITO';
  } else {
    return 'FACTURA_ELECTRONICA'; // default
  }
}

// Usage example
async function setDocumentType(
  companyProfile: CompanyProfile, 
  currentConfig: EkuatiaConfig
): Promise<void> {
  const proposedDocument = determinePrimaryDocument(companyProfile);

  // Confirmation phase
  const confirmed = await requestConfigurationConfirmation(
    { 
      issuer_data: { 
        tipo_documento: proposedDocument 
      } 
    }, 
    currentConfig
  );

  // Only after confirmation:
  if (confirmed) {
    currentConfig.issuer_data.tipo_documento = proposedDocument;
    // Save to system
    await saveConfiguration(currentConfig);
  }
}
```

### Modality Selection Logic

```
IF has_public_procurement_contracts
  THEN modality = "AVANZADA"
  AND grupos_utilizables.informaciones_compras_publicas = true
ELSE
  THEN modality = "BASICA"
  AND skip grupos_utilizables configuration
```

### Cache Invalidation Triggers

```typescript
type CacheInvalidationTrigger = 
  | 'ruc_status_change'
  | 'establishment_update' 
  | 'csc_update'
  | 'timbrado_expiration'
  | 'configuration_notification';

// Monitor these conditions and clear cache if any change:
const invalidationTriggers: CacheInvalidationTrigger[] = [
  'ruc_status_change',        // RUC status change (Active → Inactive)
  'establishment_update',     // Establishment data modification in Marangatu
  'csc_update',              // CSC (Código de Seguridad Contribuyente) update
  'timbrado_expiration',     // Timbrado expiration
  'configuration_notification' // Configuration update notification from DNIT
];

// Cache invalidation handler
class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, any>;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  public invalidateConfig(ruc: string, trigger: CacheInvalidationTrigger): void {
    this.cache.delete(`ekuatia_config_${ruc}`);
    logger.info(`Cache invalidated for RUC ${ruc} due to: ${trigger}`);
  }
}

// Event-driven cache invalidation
class CacheInvalidationListener {
  constructor(private cacheManager: CacheManager) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // RUC Status Change Event
    eventEmitter.on('ruc_status_changed', (data: { ruc: string; oldStatus: string; newStatus: string }) => {
      if (data.oldStatus !== data.newStatus) {
        this.cacheManager.invalidateConfig(data.ruc, 'ruc_status_change');
      }
    });

    // Establishment Update Event
    eventEmitter.on('establishment_updated', (data: { ruc: string; establishmentId: number }) => {
      this.cacheManager.invalidateConfig(data.ruc, 'establishment_update');
    });

    // CSC Update Event
    eventEmitter.on('csc_updated', (data: { ruc: string; newCsc: string }) => {
      this.cacheManager.invalidateConfig(data.ruc, 'csc_update');
    });

    // Timbrado Expiration Event
    eventEmitter.on('timbrado_expired', (data: { ruc: string; timbradoNumber: string }) => {
      this.cacheManager.invalidateConfig(data.ruc, 'timbrado_expiration');
    });

    // Configuration Notification Event
    eventEmitter.on('configuration_notification', (data: { ruc: string; notificationType: string }) => {
      this.cacheManager.invalidateConfig(data.ruc, 'configuration_notification');
    });
  }
}

// Usage
const cacheManager = CacheManager.getInstance();
const invalidationListener = new CacheInvalidationListener(cacheManager);
```

---

## Testing & Validation

### Pre-Invoice Validation Checklist

Before submitting an invoice, the agent should verify:

```json
{
  "configuration_validation": {
    "ruc_active": "Must be Active in Marangatu",
    "enablement_approved": "Must have approved Electronic Invoicer request",
    "certificate_valid": "CCFE must be current and valid",
    "csc_current": "Código de Seguridad must be up-to-date"
  },
  "invoice_data_validation": {
    "receptor_ruc_valid": "Must be valid Paraguay RUC format",
    "amounts_positive": "All amounts must be > 0",
    "total_matches_items": "Sum of items must equal total",
    "dates_valid": "Issuance date must be today or earlier",
    "items_complete": "Each item must have description, quantity, price"
  },
  "business_rules_validation": {
    "dispatch_point_valid": "Must match configured punto_expedición",
    "establishment_matches": "Must match configured establishment",
    "document_type_allowed": "Must be in approved document types"
  }
}
```

---

## Appendix: Common Abbreviations

| Term | Full Name                                     | Meaning                                    |
| ---- | --------------------------------------------- | ------------------------------------------ |
| DNIT | Dirección Nacional de Ingresos Tributarios    | Paraguay's tax authority                   |
| RUC  | Registro Único de Contribuyente               | Unique taxpayer identification number      |
| DV   | Dígito Verificador                            | Check digit for RUC                        |
| CCFE | Certificado Cualificado de Firma Electrónica  | Qualified electronic signature certificate |
| CSC  | Código de Seguridad Contribuyente             | Taxpayer security code                     |
| CDC  | Código de Control                             | Invoice control code                       |
| DNCP | Dirección Nacional de Contrataciones Públicas | Public procurement authority               |
| DTE  | Documento Tributario Electrónico              | Electronic tax document                    |
| IVA  | Impuesto al Valor Agregado                    | VAT (Value Added Tax)                      |

---

## References

- **Official System:** https://ekuatia.set.gov.py/ekuatiai/
- **Marangatu System:** Tax Management System for taxpayer data and enablement requests
- **Resolución DNIT N° 06/2024:** Electronic invoicer enablement requirements
- **Resolución DNIT N° 757/2024:** Qualified Electronic Signature Certificate requirements
- **Form N° 364:** Electronic Invoicer Enablement Request form

---

**Document Version:** 1.0  
**Target Audience:** Software Agents, Developers, Automation Systems  
**Last Updated:** January 25, 2026  
**Language Implementation:** Node.js with TypeScript  
**Status:** Ready for Agent Implementation
