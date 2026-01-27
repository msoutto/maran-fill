import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

/**
 * PURPOSE: Vitest configuration for TDD development workflow
 * 
 * REASONING: 
 * - Chose ESNext modules for modern Node.js compatibility
 * - Used path resolution for clean imports without relative paths
 * - Enabled coverage reporting with detailed output
 * - Configured test environment for Node.js runtime
 * - Added global test setup for consistent test utilities
 * 
 * AGENT DECISION PROCESS:
 * - Analyzed Vitest best practices from 2025 ecosystem
 * - Considered: Jest vs Vitest
 * - Selected Vitest for faster execution and better TypeScript support
 * - Trade-offs: Smaller ecosystem than Jest, but better DX
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        'tests/**/*',
        '**/test-helpers.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/types': resolve(__dirname, './src/types'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/services': resolve(__dirname, './src/services'),
      '@/agents': resolve(__dirname, './src/agents'),
      '@tests': resolve(__dirname, './tests')
    }
  }
});