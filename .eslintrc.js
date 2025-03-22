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