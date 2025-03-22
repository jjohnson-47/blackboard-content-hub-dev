# Domain-Specific Naming Guide

This guide provides practical examples and guidelines for implementing domain-specific naming throughout the DevPreview UI codebase. Following these conventions will help maintain code clarity and prevent naming collisions.

## Core Principles

1. **Context-Specific Prefixing/Suffixing**: Names should clearly indicate their domain context
2. **Descriptive Over Generic**: Prefer descriptive names that convey purpose
3. **Backward Compatibility**: Maintain aliases for backward compatibility during transition

## Key Domain-Specific Types

| Domain | Type Name | Purpose | Instead of Generic |
|--------|-----------|---------|-------------------|
| Storage | `StorageComponentContent` | Component content in storage context | `ComponentData` |
| Component | `ComponentMetadata` | Metadata about a component | `Component` |
| Editor | `EditorContent` | Content being edited in the editor | `ComponentData` |

## Naming Pattern Examples

### ✅ Good Examples

```typescript
// Storage context
interface StorageComponentContent {
  html: string;
  css: string;
  js: string;
  metadata?: Record<string, any>;
}

// API context
interface ApiComponentRequest {
  id: string;
  version: string;
}

// Editor context
interface EditorConfiguration {
  theme: string;
  autoSave: boolean;
}

// Preview context
interface PreviewSettings {
  refreshRate: number;
  showDevTools: boolean;
}
```

### ❌ Problematic Examples

```typescript
// Too generic - which component? what data?
interface ComponentData {
  content: string;
}

// Too generic - settings for what?
interface Settings {
  enabled: boolean;
}

// Too generic - which request?
interface Request {
  id: string;
}
```

## Type Suffix Conventions

Use these suffixes consistently to indicate the type's purpose:

| Suffix | Purpose | Example |
|--------|---------|---------|
| `*Content` | Actual content (HTML, CSS, JS) | `StorageComponentContent`, `EditorContent` |
| `*Metadata` | Descriptive info about an entity | `ComponentMetadata` |
| `*Settings` | Configuration options | `PreviewSettings`, `EditorSettings` |
| `*Options` | User-configurable options | `RenderOptions` |
| `*Event` | Event payload data | `PreviewUpdateEvent` |
| `*Request` | API request data | `ComponentSaveRequest` |
| `*Response` | API response data | `ComponentLoadResponse` |

## Barrel Files and Aliases

Use barrel files (index.ts) to provide clear exports with aliases for backward compatibility:

```typescript
// src/models/index.ts
export { ComponentMetadata, Component } from './ComponentMetadata';
export { 
  StorageComponentContent,
  ComponentContentData, // Legacy alias
  ComponentData // Legacy alias
} from './ComponentContent';
```

## Documentation

Always include JSDoc comments that explain the domain context:

```typescript
/**
 * Storage Component Content model
 * Represents the actual content of a component in the storage system
 */
export interface StorageComponentContent {
  // ...
}
```

## Migration Strategy

1. Create new domain-specific types
2. Update interfaces to use the new types
3. Update implementations to use the new types
4. Provide type aliases for backward compatibility
5. Add @deprecated JSDoc tags to aliases
6. Update tests to use the new types
7. Eventually phase out aliases in a future release

## Enforcement

The Architecture Review process will check for adherence to these naming conventions in all new code and refactoring efforts.