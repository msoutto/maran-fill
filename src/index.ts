/**
 * PURPOSE: Main entry point for the Ekuatia automation system
 *
 * REASONING:
 * - Created minimal entry point to satisfy TypeScript compilation
 * - Will be expanded as we add authentication and invoice agents
 * - Provides clean separation of concerns for future module structure
 *
 * AGENT DECISION PROCESS:
 * - Requirements analyzed from AGENT_DEVELOPMENT_PLAN.md
 * - Considered: index.ts vs main.ts vs app.ts
 * - Selected index.ts for convention and module bundling compatibility
 * - Implementation constraints: Must provide exports for all public APIs
 */

// Placeholder exports - will be implemented in future checkpoints
export const VERSION = '1.0.0';

// TODO: Export authentication agent once implemented
// export { AuthenticationAgent } from './agents/auth';

// TODO: Export configuration agent once implemented
// export { ConfigurationAgent } from './agents/config';

// TODO: Export invoice agent once implemented
// export { InvoiceAgent } from './agents/invoice';
