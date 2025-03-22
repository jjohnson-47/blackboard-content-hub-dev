# Architecture Decision Record: Domain-Specific Naming Pattern

## Context

The DevPreview UI codebase was exhibiting naming confusion due to generic type names like `ComponentData` being used across different contexts (storage, editor, preview). This was leading to:

1. Type confusion when working across different modules
2. Ambiguity in function signatures taking these generic types
3. IDE tooling conflicts with autocompletion and suggestions
4. Maintenance challenges as more domains are added

## Decision

We will implement a domain-specific naming pattern throughout the codebase that:

1. Uses descriptive, context-aware names for all types and interfaces
2. Maintains backward compatibility through explicit type aliases
3. Documents the proper usage pattern for future development
4. Uses explicit exports in barrel files with proper aliases

Examples of the naming pattern:
- `ComponentData` → `StorageComponentContent` (in storage context)
- `Component` → `ComponentMetadata` (for metadata)
- `ComponentData` → `EditorContent` (in editor context)

## Rationale

### Benefits

- **Self-documenting code**: Type names clearly indicate their domain and purpose
- **Improved type safety**: Prevents accidental usage of types in wrong contexts
- **Better IDE support**: More precise autocompletion suggestions 
- **Clearer dependencies**: Makes relationships between domains more explicit
- **Reduced cognitive load**: Developers can more easily understand data flow

### Compatibility Considerations

We're maintaining compatibility through type aliases that signal deprecation:

```typescript
/**
 * @deprecated Use StorageComponentContent instead
 * Provides backward compatibility with existing code
 */
export type ComponentData = StorageComponentContent;
```

This approach allows gradual migration without breaking existing code.

## Implementation

The implementation follows these principles:

1. Create explicit domain-specific type names with proper suffixes:
   - `*Content` for actual data content
   - `*Metadata` for descriptive data
   - `*Settings` for configuration options
   - `*Event` for event payloads

2. Update interface parameters and return types to use domain-specific names

3. Use barrel files (index.ts) to provide clear exports with proper aliases

4. Add detailed JSDoc comments explaining domain context

5. Document the pattern in architecture guidelines

## Implications

- New components should follow the domain-specific naming pattern
- Future refactoring should eliminate deprecated aliases
- A domain-specific naming linting rule could be created to enforce the pattern
- Code reviews should check for adherence to this pattern

## Alternatives Considered

1. **Generic base types with context modifiers**:
   ```typescript
   type StorageComponent = BaseComponent & StorageAttributes;
   ```
   Rejected due to complexity and TypeScript limitations

2. **Namespace-based approach**:
   ```typescript 
   namespace Storage { 
     export interface Component { ... } 
   }
   ```
   Rejected as TypeScript namespaces are less common in modern code

3. **Module path based resolution**:
   ```typescript
   import { Component as StorageComponent } from './storage/Component';
   ```
   Rejected as it still requires manual disambiguation

## References

- [Domain-Driven Design concepts](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- Internal documentation: [DomainSpecificNamingGuide.md](./DomainSpecificNamingGuide.md)