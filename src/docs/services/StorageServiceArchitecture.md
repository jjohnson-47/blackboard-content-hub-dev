# Storage Service Architecture

## Overview

The Storage Service is a critical component in the DevPreview UI architecture that provides persistent data management capabilities for components (code editors, previews, etc.) and their content. This document outlines the architectural design of the Storage Service, its interfaces, data models, and integration patterns.

## Storage Architecture Layers

The Storage Service follows a layered architecture:

1. **Storage Adapter Layer** - Low-level storage mechanism abstraction
2. **Storage Service Layer** - Application-specific storage logic
3. **Model Layer** - Data models representing stored entities

This layered approach provides flexibility to swap out storage implementations while maintaining consistent application behavior.

## Data Models

### Component Model

```typescript
export type ComponentLocationType = 'local' | 'remote';

export interface Component {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  locationType: ComponentLocationType; // Storage location type
  lastEdited?: Date;             // Last modification timestamp
  tags?: string[];               // Optional categorization tags
}
```

### ComponentData Model

```typescript
export interface ComponentData {
  html: string;                  // HTML content
  css: string;                   // CSS content
  js: string;                    // JavaScript content
  metadata?: Record<string, any>; // Optional additional metadata
}
```

## Interface Contracts

### IStorageAdapter Interface

```typescript
export interface IStorageAdapter {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): boolean;
  removeItem(key: string): boolean;
  clear(): boolean;
  hasItem(key: string): boolean;
}
```

### IStorageService Interface

```typescript
export interface IStorageService {
  saveComponent(component: Component, data: ComponentData): boolean;
  loadComponent(id: string): ComponentData;
  getLastEditedComponent(): Component | null;
  getAllLocalComponents(): Component[];
  deleteComponent(id: string): boolean;
}
```

## Key Architectural Decisions

1. **Adapter Pattern for Storage Mechanisms**
   - The Storage Adapter interface abstracts the underlying storage mechanism
   - This allows swapping between localStorage, IndexedDB, or server-side storage
   - Simplifies testing by enabling mock adapters

2. **Separation of Metadata and Content**
   - Component metadata (id, name, tags) is separate from component content (HTML, CSS, JS)
   - Enables listing components without loading their potentially large content
   - Supports efficient component browsing and management

3. **Error Handling Integration**
   - Leverages the centralized ErrorHandler system
   - Converts storage-specific errors to consistent AppError types
   - Provides clear feedback on storage operations

4. **Local Storage Keys Convention**
   - Uses consistent key prefixes for different types of data
   - Component list: `devpreview_components`
   - Component data: `devpreview_component_<id>`
   - Last edited component: `devpreview_last_edited`

## Integration with Other Components

The Storage Service integrates with:

1. **ErrorHandler** - For consistent error management
2. **ServiceContainer** - For dependency injection and lifecycle management
3. **Editor Component** - For saving/loading content
4. **Component Browser** - For listing available components

## Implementation Considerations

1. **Performance**
   - Lazy loading of component data to minimize memory usage
   - Caching strategy for frequently accessed components
   - Handling large component data efficiently

2. **Resilience**
   - Recovering from storage quota exceeded errors
   - Handling browser storage limitations
   - Providing fallback mechanisms when storage operations fail

3. **Security**
   - Validation of data before storage to prevent injection
   - Sanitization of loaded content before execution
   - Protection against malicious content in saved components

## Storage Keys Schema

| Key Pattern | Purpose | Content |
|-------------|---------|---------|
| `devpreview_components` | List of all component metadata | Array of Component objects |
| `devpreview_component_<id>` | Component content data | ComponentData object |
| `devpreview_last_edited` | ID of most recently edited component | Component ID string |

## Related Documentation

- [ErrorHandler Documentation](../errors/README.md) - Error handling patterns used by the Storage Service
- [LocalStorageAdapter Implementation](../../adapters/LocalStorageAdapter.ts) - The localStorage implementation of IStorageAdapter

## Implementation Steps

1. Create the Component and ComponentData model interfaces
2. Implement the IStorageService interface
3. Implement the StorageService class
4. Create comprehensive unit tests
5. Document integration patterns for other components

## Testing Strategy

The Storage Service should be tested at multiple levels:

1. **Unit tests** for the StorageService implementation
2. **Integration tests** with actual storage adapters
3. **Mock-based tests** for components that depend on Storage Service

Test cases should cover:
- Successful storage operations
- Error handling scenarios
- Data consistency checks
- Resilience to malformed data

By following this architecture, the Storage Service will provide a robust, flexible foundation for managing component data in the DevPreview UI system.