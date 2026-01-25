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

### Complete Agent Flow for Invoice Automation

```
PHASE 1: INITIALIZATION
├─ [Agent] Receive invoice creation request
├─ [Agent] Extract taxpayer RUC and credentials
├─ [System] Check if configuration cached
│  ├─ [Cache Hit] → Skip to Phase 3
│  └─ [Cache Miss] → Continue to Phase 2
│
└─ PHASE 2: CONFIGURATION (One-time per RUC)
   ├─ [Agent] POST /login with RUC + Marangatu key
   ├─ [System] Validate credentials and approval status
   ├─ [System] Retrieve profile and establishment data
   ├─ [Agent] GET /configuracion/formulario
   ├─ [Agent] Determine modality (BÁSICA or AVANZADA)
   ├─ [Agent] Populate issuer data:
   │  ├─ número_timbrado (from enablement)
   │  ├─ tipo_documento (most frequent type)
   │  ├─ actividad_económica (from Marangatu)
   │  ├─ código_seguridad_contribuyente (CSC)
   │  └─ [other fields from profile]
   ├─ [Agent] POST /configuracion/guardar
   ├─ [System] Validate and save configuration
   └─ [Agent] Cache configuration (90-day TTL)

PHASE 3: INVOICE ISSUANCE (Repeatable)
├─ [Agent] Load configuration from cache
├─ [Agent] Validate invoice data:
│  ├─ Check required fields present
│  ├─ Validate formats (dates, amounts, RUC)
│  └─ Calculate totals and apply tax logic
├─ [Agent] Build invoice payload:
│  ├─ Add metadata from config
│  ├─ Apply tipo_documento from config
│  ├─ Include receiver data
│  └─ Serialize items with descriptions and amounts
├─ [Agent] POST /documento/crear
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

```python
class EkuatiaInvoiceAgent:
    def __init__(self, ruc: str, marangatu_key: str):
        self.ruc = ruc
        self.marangatu_key = marangatu_key
        self.cache = PersistentCache()
        self.session = None
        self.config = None

    def process_invoice(self, invoice_data: dict) -> dict:
        """Main entry point for invoice creation"""
        try:
            # Phase 1-2: Initialize and configure
            self._ensure_configured()

            # Phase 3: Issue invoice
            result = self._create_invoice(invoice_data)

            return {
                "success": True,
                "documento_id": result["documento_id"],
                "cdc": result["codigo_control"],
                "fecha_emision": result["fecha_emision"]
            }

        except Exception as e:
            return self._handle_error(e)

    def _ensure_configured(self) -> None:
        """Check cache; configure if needed"""
        config = self.cache.get(f"ekuatia_config_{self.ruc}")

        if config:
            self.config = config
        else:
            self._authenticate()
            self._retrieve_profile()
            self._configure_invoicer()
            self.cache.set(f"ekuatia_config_{self.ruc}", self.config,
                          ttl=90*24*60*60)

    def _authenticate(self) -> None:
        """Phase 2.1: Login"""
        response = requests.post(
            f"{BASE_URL}/login",
            json={
                "username": self.ruc.split('-')[0],  # RUC without DV
                "password": self.marangatu_key
            }
        )
        if response.status_code != 200:
            raise AuthenticationError(response.json()["message"])

        self.session = response.json()["session_token"]

    def _retrieve_profile(self) -> None:
        """Phase 2.2: Get profile data"""
        response = requests.get(
            f"{BASE_URL}/perfil",
            headers={"Authorization": f"Bearer {self.session}"}
        )
        self.profile = response.json()

    def _configure_invoicer(self) -> None:
        """Phase 2.3-2.5: Configure"""
        # Determine modality
        modality = "BASICA"  # Default for most cases

        config_data = {
            "modality": modality,
            "logo": None,
            "issuer_data": {
                "numero_timbrado": self.profile["numero_timbrado"],
                "establecimiento": 1,
                "tipo_documento": "FACTURA ELECTRONICA",
                "actividad_economica": self.profile["actividad_economica"],
                "fecha_inicio_vigencia": self.profile["fecha_aprobacion"],
                "punto_expedicion": 1,
                "tipo_contribuyente": self.profile["tipo_contribuyente"],
                "codigo_seguridad_contribuyente": self.profile["csc"]
            }
        }

        response = requests.post(
            f"{BASE_URL}/configuracion/guardar",
            headers={"Authorization": f"Bearer {self.session}"},
            json=config_data
        )

        if response.status_code != 200:
            raise ConfigurationError(response.json()["message"])

        self.config = config_data

    def _create_invoice(self, invoice_data: dict) -> dict:
        """Phase 3: Create invoice"""
        payload = {
            "metadatos": {
                "ruc_emisor": self.ruc.split('-')[0],
                "numero_timbrado": self.config["issuer_data"]["numero_timbrado"],
                "punto_expedicion": 1,
                "establecimiento": 1,
                "fecha_emision": invoice_data["fecha"],
                "tipo_documento": self.config["issuer_data"]["tipo_documento"]
            },
            "datos_receptor": {
                "ruc_receptor": invoice_data["receptor_ruc"],
                "razon_social_receptor": invoice_data["receptor_nombre"]
            },
            "detalles_factura": {
                "items": invoice_data["items"],
                "resumen": invoice_data["resumen"]
            }
        }

        response = requests.post(
            f"{BASE_URL}/documento/crear",
            headers={"Authorization": f"Bearer {self.session}"},
            json=payload
        )

        if response.status_code != 200:
            raise InvoiceCreationError(response.json()["message"])

        return response.json()

    def _handle_error(self, error: Exception) -> dict:
        """Phase 4: Error handling"""
        error_type = type(error).__name__

        if error_type == "AuthenticationError":
            # Clear cached session and retry
            self.session = None
            return {"success": False, "error": "AUTHENTICATION_FAILED",
                   "recovery": "Re-authenticate required"}

        elif error_type == "ConfigurationError":
            # Clear cached config; user must fix in Marangatu
            self.cache.delete(f"ekuatia_config_{self.ruc}")
            return {"success": False, "error": "CONFIGURATION_INVALID",
                   "recovery": "Verify taxpayer data in Marangatu"}

        elif error_type == "InvoiceCreationError":
            # Likely business logic error; return to user
            return {"success": False, "error": str(error)}

        return {"success": False, "error": "UNKNOWN_ERROR"}

# Usage
agent = EkuatiaInvoiceAgent(
    ruc="5452-1",
    marangatu_key="confidential_access_key"
)

result = agent.process_invoice({
    "fecha": "25/01/2026",
    "receptor_ruc": "1234567",
    "receptor_nombre": "Cliente S.A.",
    "items": [
        {
            "codigo_producto": "PROD001",
            "descripcion": "Servicio de consultoría",
            "cantidad": 1,
            "precio_unitario": 500000,
            "monto_iva": 0,
            "monto_total": 500000
        }
    ],
    "resumen": {
        "subtotal": 500000,
        "total_iva": 0,
        "total_general": 500000
    }
})
```

---

## Key Automation Decisions

### Document Type Selection Logic

```
IF company_profile.invoice_frequency["FACTURA_ELECTRONICA"] > 60%
  THEN primary_document = "FACTURA_ELECTRONICA"
ELSE IF company_profile.invoice_frequency["NOTA_CREDITO"] > 40%
  THEN primary_document = "NOTA_CREDITO"
ELSE
  THEN primary_document = "FACTURA_ELECTRONICA" (default)

// Store this decision in configuration
config.issuer_data.tipo_documento = primary_document
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

```
// Monitor these conditions and clear cache if any change:
- RUC status change (Active → Inactive)
- Establishment data modification in Marangatu
- CSC (Código de Seguridad Contribuyente) update
- Timbrado expiration
- Configuration update notification from DNIT

// Implement webhook or polling to detect changes
EventListener.on("ruc_status_changed", () => {
  cache.delete(`ekuatia_config_${ruc}`);
  logger.info(`Cache invalidated for RUC ${ruc}`);
});
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
**Status:** Ready for Agent Implementation
