# Linting Enforcement Implementation Guide

This document provides implementation details for the custom ESLint plugin described in the [Linting Enforcement ADR](./LintingEnforcementADR.md). It outlines the structure of the plugin, example rule implementations, and integration guidelines.

## Plugin Structure

The custom ESLint plugin for domain-specific naming will be structured as follows:

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
    tests/             # Rule tests
      enforce-content-suffix.test.js
      ...
```

## Plugin Entry Point

The `index.js` file will export the plugin configuration:

```javascript
module.exports = {
  rules: {
    'enforce-content-suffix': require('./rules/enforce-content-suffix'),
    'enforce-metadata-suffix': require('./rules/enforce-metadata-suffix'),
    'enforce-settings-suffix': require('./rules/enforce-settings-suffix'),
    'enforce-event-suffix': require('./rules/enforce-event-suffix'),
    'enforce-request-suffix': require('./rules/enforce-request-suffix'),
    'enforce-response-suffix': require('./rules/enforce-response-suffix'),
  },
  configs: {
    recommended: {
      rules: {
        'domain-specific-naming/enforce-content-suffix': 'error',
        'domain-specific-naming/enforce-metadata-suffix': 'error',
        'domain-specific-naming/enforce-settings-suffix': 'error',
        'domain-specific-naming/enforce-event-suffix': 'error',
        'domain-specific-naming/enforce-request-suffix': 'error',
        'domain-specific-naming/enforce-response-suffix': 'error',
      },
    },
  },
};
```

## Example Rule Implementation

Below is an example implementation of the `enforce-content-suffix` rule:

```javascript
/**
 * @fileoverview Rule to enforce the *Content suffix for content-related interfaces
 * @author DevPreview UI Architect
 */
"use strict";

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce *Content suffix for content-related interfaces",
      category: "Domain-Specific Naming",
      recommended: true,
    },
    fixable: "code",
    schema: [], // no options
    messages: {
      contentSuffixRequired: "Interface '{{name}}' contains content-related properties but doesn't use the *Content suffix",
      suggestRename: "Rename to '{{suggestion}}'"
    }
  },

  create: function(context) {
    // Content-related property names
    const contentPropertyNames = ["html", "css", "js", "content", "code"];
    
    return {
      // Look for interface declarations
      TSInterfaceDeclaration(node) {
        const interfaceName = node.id.name;
        
        // Skip if already has Content suffix
        if (interfaceName.endsWith("Content")) {
          return;
        }
        
        // Check if interface has content-related properties
        const hasContentProperties = node.body.body.some(property => {
          if (property.type === "TSPropertySignature" && property.key.type === "Identifier") {
            return contentPropertyNames.includes(property.key.name);
          }
          return false;
        });
        
        if (hasContentProperties) {
          // Suggest a name with Content suffix
          const suggestedName = `${interfaceName}Content`;
          
          context.report({
            node: node.id,
            messageId: "contentSuffixRequired",
            data: {
              name: interfaceName
            },
            fix: function(fixer) {
              return fixer.replaceText(node.id, suggestedName);
            },
            suggest: [
              {
                messageId: "suggestRename",
                data: {
                  suggestion: suggestedName
                },
                fix: function(fixer) {
                  return fixer.replaceText(node.id, suggestedName);
                }
              }
            ]
          });
        }
      }
    };
  }
};
```

## Rule Testing

Each rule should have corresponding tests to verify its behavior:

```javascript
/**
 * @fileoverview Tests for enforce-content-suffix rule
 * @author DevPreview UI Architect
 */
"use strict";

const rule = require("../rules/enforce-content-suffix");
const RuleTester = require("eslint").RuleTester;

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module"
  }
});

ruleTester.run("enforce-content-suffix", rule, {
  valid: [
    // Valid cases - already has Content suffix
    `interface EditorContent {
      html: string;
      css: string;
      js: string;
    }`,
    
    // Valid cases - doesn't have content properties
    `interface EditorSettings {
      theme: string;
      autoSave: boolean;
    }`
  ],
  
  invalid: [
    // Invalid case - has content properties but no Content suffix
    {
      code: `interface Editor {
        html: string;
        css: string;
        js: string;
      }`,
      errors: [
        {
          messageId: "contentSuffixRequired",
          data: { name: "Editor" }
        }
      ],
      output: `interface EditorContent {
        html: string;
        css: string;
        js: string;
      }`
    }
  ]
});
```

## Integration with CI Pipeline

To integrate the linting rules with the CI pipeline, we'll need to:

1. Add the ESLint configuration to the project
2. Install the necessary dependencies
3. Add npm scripts for linting
4. Configure the CI workflow

### Package.json Updates

```json
{
  "scripts": {
    "lint": "eslint --ext .ts,.tsx src/",
    "lint:fix": "eslint --ext .ts,.tsx src/ --fix"
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^5.0.0",
    "@typescript-eslint/parser": "^5.0.0",
    "eslint-plugin-jsdoc": "^40.0.0",
    "eslint-plugin-import": "^2.25.0",
    "husky": "^8.0.0",
    "lint-staged": "^13.0.0"
  },
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "git add"
    ]
  }
}
```

### GitHub Actions Workflow

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

## Developer Experience

To improve the developer experience with these linting rules:

1. **VSCode Integration**: Configure VSCode to use ESLint for TypeScript files
2. **Documentation**: Provide clear documentation on the naming conventions
3. **Autofix Support**: Ensure rules provide autofix suggestions where possible

### VSCode Settings

```json
// .vscode/settings.json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "typescript",
    "typescriptreact"
  ]
}
```

## Implementation Phases

The implementation of the linting enforcement will be phased:

1. **Phase 1: Basic Configuration**
   - Set up ESLint with TypeScript support
   - Configure basic rules for interface naming (I-prefix)
   - Add ban-types rule for generic type names

2. **Phase 2: Custom Plugin Development**
   - Develop the enforce-content-suffix rule
   - Test against existing codebase
   - Refine rule based on feedback

3. **Phase 3: Complete Rule Set**
   - Implement remaining suffix rules
   - Add comprehensive tests
   - Document rule behaviors

4. **Phase 4: CI Integration**
   - Add ESLint to CI pipeline
   - Configure pre-commit hooks
   - Document linting process

## Conclusion

This implementation guide provides a concrete plan for creating and integrating custom ESLint rules to enforce the domain-specific naming conventions established in the project. By following this approach, we can ensure consistent application of our architectural patterns while providing a good developer experience.