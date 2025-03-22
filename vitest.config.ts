/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vitest configuration
 *
 * TODO: Fix ESM module compatibility issue with vite-tsconfig-paths
 *
 * There's currently an issue with the vite-tsconfig-paths plugin which is an ES Module
 * but is being imported using CommonJS require() syntax. This is a common issue when
 * working with modern JavaScript/TypeScript projects using Vite and Vitest.
 *
 * Temporary solution: Removed the plugin to allow tests to run.
 *
 * Future solutions to explore:
 * 1. Use dynamic import with proper ESM handling
 * 2. Configure package.json with correct "type" field
 * 3. Consider alternative path resolution strategies
 *
 * See TODO.md for more details.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@core': resolve(__dirname, './src/core'),
      '@components': resolve(__dirname, './src/components'),
      '@services': resolve(__dirname, './src/services'),
      '@interfaces': resolve(__dirname, './src/interfaces'),
      '@events': resolve(__dirname, './src/events'),
      '@errors': resolve(__dirname, './src/errors'),
      '@adapters': resolve(__dirname, './src/adapters'),
      '@factories': resolve(__dirname, './src/factories'),
      '@utils': resolve(__dirname, './src/utils'),
      '@features': resolve(__dirname, './src/features'),
    }
  },
  // This definition tells TypeScript that we're adding the test property
  define: {
    'import.meta.vitest': 'undefined',
  },
  // The test property will be recognized by Vitest when it runs
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.test.ts',
        'src/docs/'
      ]
    },
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  }
});