# AGENTS.md

## Project Overview

**maran-fill** is an automation system for filling virtual bills in the Ekuatia system (Paraguay's National Integrated Electronic Invoice System). This is a specialized business automation tool that interacts with government tax systems to generate electronic invoices.

**Agent role:** Help maintain invoice automation code, implement Ekuatia API integrations, handle configuration management, and ensure compliance with Paraguayan tax regulations.

## Build & Commands

```bash
# Dependencies & Setup
npm install          # Install dependencies
npm run build        # Build the project
npm run lint         # Run ESLint
npm run format       # Format code with Prettier

# Testing
npm run test         # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test -- --reporter=verbose path/to/test.test.ts  # Run single test file
npm run test -- path/to/test.test.ts -t "test name"      # Run specific test by name

# Development
npm run dev          # Start development server (if applicable)
npm run start        # Start production application
```

## Code Style Guidelines

### TypeScript & Imports
- Use strict TypeScript with explicit return types for all functions
- Import order: Node modules → local modules → relative imports
- Prefer `const` over `let`, avoid `var`
- Use interfaces for all complex data structures
- Export classes and functions that represent the public API

### Naming Conventions
- **Classes:** PascalCase (e.g., `EkuatiaInvoiceAgent`)
- **Functions/Variables:** camelCase (e.g., `createInvoice`, `invoiceData`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `BASE_URL`, `DEFAULT_TIMEOUT`)
- **Interfaces:** PascalCase with descriptive names (e.g., `InvoiceData`, `ConfigurationResponse`)
- **Types:** PascalCase for type aliases (e.g., `DocumentType`, `ModalityType`)
- **Test files:** `*.test.ts` or `*.spec.ts`
- **Mock files:** `*.mock.ts`

### Business Domain Conventions
- Use Spanish terms where they match the Ekuatia system (e.g., `timbrado`, `ruc`, `punto_expedicion`)
- Keep English for general programming concepts
- Document business logic with clear comments
- Use domain-specific type names for clarity

### Error Handling
- Create custom error classes for different error types:
  - `AuthenticationError` for login/credential issues
  - `ConfigurationError` for setup problems
  - `InvoiceCreationError` for business logic failures
  - `ConfigurationRetrievalError` for system access issues
- Always include error context and recovery suggestions
- Use try-catch blocks for external API calls
- Log errors with relevant context (RUC, session ID, operation)

### Data Structures & Validation
- Define interfaces for all API request/response objects
- Use validators for business rules (RUC format, amounts, dates)
- Implement type guards for runtime type checking
- Use enums for fixed sets of values (document types, modalities)
- Store configuration in typed objects with clear field definitions

### API Integration Patterns
- Use async/await for all API calls
- Implement retry logic with exponential backoff for transient errors
- Cache configuration data with appropriate TTL (90 days for Ekuatia config)
- Use session management for authenticated requests
- Validate all inputs before API submission
- Handle all HTTP status codes appropriately

### Testing Guidelines
- **Framework:** Vitest (or as configured in package.json)
- **Test Location:** `src/tests/` or `tests/` directory
- **Coverage:** Aim for >80% on core business logic
- **Mock Strategy:** Mock external API calls, focus on business logic testing
- **Test Types:**
  - Unit tests for individual functions and classes
  - Integration tests for API interactions
  - Business rule validation tests
  - Error scenario testing

### Security & Compliance
- Never log or expose sensitive credentials (RUC, passwords, CSC codes)
- Validate all user inputs before processing
- Use secure storage for configuration data
- Implement proper session management
- Follow Ekuatia system constraints strictly (single establishment, single dispatch point)

## Architecture

### Core Components
- **EkuatiaInvoiceAgent:** Main class for invoice automation
- **ConfigurationManager:** Handles Ekuatia system configuration
- **SessionManager:** Manages authentication sessions
- **ValidationService:** Validates business rules and data
- **CacheManager:** Handles configuration caching with TTL

### Data Flow
1. **Configuration Phase:** One-time setup per RUC with user confirmation
2. **Invoice Creation:** Repeatable process with validation and confirmation
3. **Error Handling:** Comprehensive error classification and recovery
4. **State Management:** Cache invalidation and session persistence

## Critical Business Rules

### Mandatory Safety Requirements
1. **ALWAYS** retrieve current configuration before any modification
2. **ALWAYS** request user confirmation before configuration changes
3. **ALWAYS** request user confirmation before posting invoices
4. **NEVER** auto-post invoices without explicit approval

### System Constraints
- Single establishment only (establecimiento = 1)
- Single dispatch point only (punto_expedicion = 1)
- Direct taxpayer access only (no third-party authorization)
- Must use "SOLUCIÓN GRATUITA" mode
- Configuration is one-time per RUC (cached for 90 days)

## Configuration Management

### Cache Strategy
- **Level 1 (Runtime):** Session data, current operation state
- **Level 2 (Persistent):** Ekuatia configuration, 90-day TTL
- **Invalidation Triggers:** RUC status changes, certificate updates, system notifications

### Configuration Structure
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
}
```

## API Endpoints (Ekuatia System)

```
Base URL: https://ekuatia.set.gov.py/ekuatiai/

Authentication
POST /login                    # Login with RUC + Marangatu key
GET  /perfil                   # Get taxpayer profile data

Configuration (One-time)
GET  /configuracion/formulario  # Get configuration form
POST /configuracion/guardar     # Save configuration

Invoice Operations
GET  /documento/tipos          # Get available document types
POST /documento/crear           # Create new invoice
GET  /documento/{id}            # Get created invoice
POST /documento/{id}/firmar     # Sign invoice electronically
```

## Development Guidelines

### When Adding Features
1. Check existing patterns in similar functions
2. Ensure compliance with Ekuatia business rules
3. Add appropriate type definitions
4. Include comprehensive error handling
5. Write tests for business logic validation
6. Document any system interactions

### When Fixing Bugs
1. Identify if it's a business logic, API, or configuration issue
2. Check if cache invalidation is needed
3. Verify error messages are user-friendly
4. Add regression tests for the fix
5. Document any business rule changes

## No-Gos

- **NEVER** hardcode credentials or RUCs in code
- **NEVER** skip user confirmation for configuration or invoice posting
- **NEVER** modify cached configuration without system validation
- **NEVER** assume system state - always retrieve current configuration
- **NEVER** commit sensitive data or secrets to the repository
- **NEVER** ignore Ekuatia system constraints (single establishment, etc.)

## Documentation Requirements

Maintain comprehensive documentation for:
- Business logic and validation rules
- API integration patterns and error handling
- Configuration management procedures
- Security considerations and compliance requirements
- Testing strategies and mock data structures

## References

- **Ekuatia System:** https://ekuatia.set.gov.py/ekuatiai/
- **Marangatu System:** Paraguayan tax management system
- **DNIT Resolutions:** N° 06/2024, N° 757/2024 for compliance requirements
- **Business Logic:** Detailed in `assets/ekuatia-agent-guide.md`