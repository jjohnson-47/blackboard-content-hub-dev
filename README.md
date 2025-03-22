# Blackboard Content Hub Dev

The development environment for blackboard-content-hub, focusing on creating, hosting, and integrating iframe-based tools for educational purposes.

## Project Structure

This project follows a co-located interfaces pattern where interfaces are placed alongside their implementations in feature-specific directories. See `src/master-plan.md` for detailed architecture information.

## Getting Started

```bash
# Install dependencies
pnpm install

# Run tests (see Testing section below)
pnpm test
```

## Core Components

- **Error Handler**: Centralized error handling system
- **Event Bus**: Event-driven communication between components
- **Service Container**: Dependency injection system
- **Editor & Preview**: Core UI components for editing and previewing content
- **Math API Adapters**: Integrations with various math visualization tools

## Testing

### Current Status

**Note**: There is currently an issue with the testing configuration related to ESM modules. A temporary solution has been implemented by removing the `vite-tsconfig-paths` plugin from the Vitest configuration. This allows tests to run but may require using absolute paths in imports.

This issue is tracked in the `TODO.md` file and will be addressed in a future update.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

## Documentation

Detailed documentation can be found in the `src/docs` directory, organized by component:

- `src/docs/architecture`: Overall architecture documentation
- `src/docs/errors`: Error handling system documentation
- (Additional documentation will be added as components are implemented)

## Known Issues

See `TODO.md` for a list of known issues and planned improvements.
