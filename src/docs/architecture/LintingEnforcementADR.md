# Architecture Decision Record: Linting Enforcement

## Status

Proposed

## Context

The DevPreview UI project has established domain-specific naming conventions as documented in [DomainSpecificNamingADR.md](./DomainSpecificNamingADR.md) and [DomainSpecificNamingGuide.md](./DomainSpecificNamingGuide.md). While these conventions are well-documented, there is currently no automated enforcement mechanism to ensure adherence to these patterns. This leads to:

1. Inconsistent application of naming conventions across the codebase
2. Continued use of deprecated generic type names
3. Manual enforcement burden during code reviews
4. Risk of architectural drift as the codebase grows

The architecture audit implementation plan identifies the need for linting enforcement in section 2.3, specifically to:
- Introduce ESLint rules to flag usage of known deprecated or generic type names
- Integrate these rules into the CI pipeline to catch violations early

## Decision

We will implement a comprehensive ESLint configuration with custom rules to enforce our domain-specific naming conventions and other architectural patterns. This implementation will consist of:

1. **Base ESLint Configuration**: A standard TypeScript-compatible ESLint configuration that enforces best practices
2. **Custom Rules for Domain-Specific Naming**: Rules that specifically target our naming conventions
3. **CI Pipeline Integration**: Configuration to run these checks during continuous integration
4. **Developer Tooling**: IDE integration for real-time feedback

### ESLint Configuration Structure

The ESLint configuration will be structured as follows:

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
    'jsdoc',
    'import',
    // Custom plugin for domain-specific rules
    './eslint-plugins/domain-specific-naming',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsdoc/recommended',
  ],
  rules: {
    // Interface naming convention (I-prefix)
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: true,
          message: 'Interface names must start with I',
        },
      },
    ],
    
    // Ban generic type names
    '@typescript-eslint/ban-types': [
      'error',
      {
        types: {
          // Map of generic types to domain-specific alternatives
          'ComponentData': {
            message: 'Use domain-specific types like EditorContent or StorageComponentContent instead',
          },
          'Component': {
            message: 'Use domain-specific component types instead',
          },
          'Settings': {
            message: 'Use domain-specific settings types like EditorSettings or PreviewSettings',
          },
          'Request': {
            message: 'Use domain-specific request types like ComponentSaveRequest',
          },
          'Response': {
            message: 'Use domain-specific response types like ComponentLoadResponse',
          },
        },
        extendDefaults: true,
      },
    ],
    
    // Enforce JSDoc for interfaces and public methods
    'jsdoc/require-jsdoc': [
      'warn',
      {
        publicOnly: true,
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
          ArrowFunctionExpression: false,
          FunctionExpression: false,
        },
      },
    ],
    
    // Enforce proper imports (no * imports)
    'import/no-namespace': 'error',
    
    // Custom rules for domain-specific naming
    'domain-specific-naming/enforce-content-suffix': 'error',
    'domain-specific-naming/enforce-metadata-suffix': 'error',
    'domain-specific-naming/enforce-settings-suffix': 'error',
    'domain-specific-naming/enforce-event-suffix': 'error',
    'domain-specific-naming/enforce-request-suffix': 'error',
    'domain-specific-naming/enforce-response-suffix': 'error',
  },
};
```

### Custom ESLint Plugin

We will create a custom ESLint plugin to enforce our domain-specific naming conventions. This plugin will include rules that check for:

1. Proper use of suffixes based on the type's purpose (Content, Metadata, Settings, etc.)
2. Avoidance of generic type names
3. Proper use of deprecated JSDoc tags for backward compatibility

The plugin will be structured as follows:

```
eslint-plugins/
  domain-specific-naming/
    index.js           # Plugin entry point
    rules/             # Custom rules
      enforce-content-suffix.js
      enforce-metadata-suffix.js
      enforce-settings-suffix.js
      enforce-event-suffix.js
      enforce-request-suffix.js
      enforce-response-suffix.js
```

### CI Pipeline Integration

The ESLint configuration will be integrated into the CI pipeline through:

1. A dedicated lint step in the CI workflow
2. Pre-commit hooks using husky and lint-staged
3. Configuration to fail the build on linting errors

Example CI configuration:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16.x'
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
```

### Developer Tooling

To improve developer experience, we will:

1. Configure VSCode settings to use ESLint for TypeScript files
2. Add npm scripts for linting and fixing
3. Document the linting rules and their purpose

## Rationale

### Benefits

1. **Automated Enforcement**: Reduces manual review burden and ensures consistent application of naming conventions
2. **Early Feedback**: Developers get immediate feedback on naming issues
3. **Architectural Consistency**: Helps maintain the architectural integrity of the codebase
4. **Documentation**: The ESLint rules serve as executable documentation of our naming conventions
5. **Gradual Migration**: Can be configured to warn rather than error during the transition period

### Challenges

1. **Custom Plugin Development**: Requires effort to develop and maintain custom ESLint rules
2. **False Positives**: May require tuning to avoid false positives
3. **Learning Curve**: Developers need to understand the naming conventions and linting rules

## Alternatives Considered

### 1. TypeScript-only Solution

We considered using TypeScript's type system to enforce naming conventions through:

- Type aliases with private constructors
- Branded types
- Nominal typing patterns

**Rejected because**: TypeScript's structural typing makes it difficult to enforce naming conventions at the type level. It would also not catch issues at compile time in many cases.

### 2. Code Generation Approach

We considered generating code from schemas or models that would enforce the naming conventions.

**Rejected because**: This would add complexity to the build process and would not catch issues in hand-written code.

### 3. Manual Code Reviews Only

We considered relying solely on manual code reviews to enforce naming conventions.

**Rejected because**: This is error-prone, time-consuming, and does not provide immediate feedback to developers.

## Implementation Plan

1. **Phase 1: Basic Configuration**
   - Set up ESLint with TypeScript support
   - Configure basic rules for interface naming (I-prefix)
   - Add ban-types rule for generic type names

2. **Phase 2: Custom Plugin Development**
   - Develop custom ESLint plugin for domain-specific naming
   - Add rules for each suffix convention
   - Test against existing codebase

3. **Phase 3: CI Integration**
   - Add ESLint to CI pipeline
   - Configure pre-commit hooks
   - Document linting process

4. **Phase 4: Developer Experience**
   - Add IDE configuration
   - Create npm scripts
   - Document rules and rationale

## References

- [ESLint Custom Rules Documentation](https://eslint.org/docs/developer-guide/working-with-rules)
- [TypeScript ESLint Plugin](https://github.com/typescript-eslint/typescript-eslint)
- [Domain-Specific Naming ADR](./DomainSpecificNamingADR.md)
- [Domain-Specific Naming Guide](./DomainSpecificNamingGuide.md)