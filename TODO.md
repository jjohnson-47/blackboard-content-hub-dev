# Project TODOs

## Testing Configuration

- **Priority**: Medium
- **Description**: Fix the Vitest configuration to properly handle ESM modules, particularly the vite-tsconfig-paths plugin.
- **Current Status**: Temporarily removed the vite-tsconfig-paths plugin from the configuration to allow tests to run.
- **Solution Options**:
  1. Update to use dynamic imports with proper ESM handling
  2. Configure package.json with correct "type" field
  3. Consider alternative path resolution strategies
- **Related Files**:
  - vitest.config.ts
  - package.json
- **Notes**: See the error message about ESM modules and CommonJS compatibility. This is a common issue when working with modern JavaScript/TypeScript projects using Vite and Vitest.

## Implementation Tasks

- Complete the Error Handler implementation and tests
- Implement the Storage Service
- Implement the API Service
- Implement the Component Factory