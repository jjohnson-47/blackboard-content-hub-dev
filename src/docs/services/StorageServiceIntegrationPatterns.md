# Storage Service Integration Patterns

## Overview

This document outlines common patterns for integrating the Storage Service with other components in the DevPreview UI system. These patterns provide guidance for using the Storage Service effectively and consistently across the application.

## Direct Service Injection

The most common integration pattern is direct dependency injection of the `IStorageService` into components that need storage capabilities.

### Pattern

```typescript
class Editor implements IEditor {
  constructor(
    private storageService: IStorageService,
    private errorHandler: IErrorHandler
  ) {}
  
  saveContent(): void {
    try {
      const component = this.getCurrentComponent();
      const data = this.getEditorContent();
      this.storageService.saveComponent(component, data);
    } catch (error) {
      this.errorHandler.handle(error);
    }
  }
}
```

### When to Use

- Components that directly manage component data (Editor, Component Browser)
- Services that need to persist application state
- Features that require access to stored components

## Event-Based Integration

For looser coupling, components can communicate with the Storage Service via the EventBus.

### Pattern

```typescript
// Component emitting a save request
class Editor implements IEditor {
  constructor(private eventBus: IEventBus) {}
  
  requestSave(): void {
    const component = this.getCurrentComponent();
    const data = this.getEditorContent();
    
    this.eventBus.emit('component:save:requested', {
      component,
      data
    });
  }
}

// Storage service handling the save request
class StorageServiceEventHandler {
  constructor(
    private storageService: IStorageService,
    private eventBus: IEventBus,
    private errorHandler: IErrorHandler
  ) {
    this.registerEventHandlers();
  }
  
  private registerEventHandlers(): void {
    this.eventBus.on('component:save:requested', this.handleSaveRequest.bind(this));
  }
  
  private handleSaveRequest({ component, data }): void {
    try {
      const success = this.storageService.saveComponent(component, data);
      this.eventBus.emit('component:save:completed', { success, componentId: component.id });
    } catch (error) {
      this.errorHandler.handle(error);
      this.eventBus.emit('component:save:failed', { componentId: component.id, error });
    }
  }
}
```

### When to Use

- For components that don't need direct storage access
- When implementing undo/redo functionality
- When storage operations should trigger UI updates in multiple components
- When storage operations might be initiated from multiple sources

## Lazy Component Loading

For performance optimization, implement lazy loading of component data.

### Pattern

```typescript
class ComponentBrowser {
  constructor(private storageService: IStorageService) {}
  
  listComponents(): Component[] {
    // Only load metadata, not full content
    return this.storageService.getAllLocalComponents();
  }
  
  async loadComponentContent(id: string): Promise<ComponentData> {
    // Load content only when needed
    return this.storageService.loadComponent(id);
  }
}
```

### When to Use

- When displaying lists of components
- In component browsers or selection UIs
- When performance is a concern with many components

## Auto-Save Integration

Implement auto-save functionality for better user experience.

### Pattern

```typescript
class AutoSaveManager {
  private debounceTimeout: number | null = null;
  
  constructor(
    private editor: IEditor,
    private storageService: IStorageService,
    private debounceMsec: number = 1000
  ) {
    this.registerEditorChangeEvents();
  }
  
  private registerEditorChangeEvents(): void {
    this.editor.onContentChanged(() => {
      this.scheduleAutoSave();
    });
  }
  
  private scheduleAutoSave(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    this.debounceTimeout = setTimeout(() => {
      this.performAutoSave();
      this.debounceTimeout = null;
    }, this.debounceMsec);
  }
  
  private performAutoSave(): void {
    const component = this.editor.getCurrentComponent();
    const data = this.editor.getEditorContent();
    this.storageService.saveComponent(component, data);
  }
}
```

### When to Use

- When implementing editors with auto-save functionality
- For preserving work-in-progress
- To enhance user experience by reducing manual saves

## Session Recovery

Implement session recovery for improved reliability.

### Pattern

```typescript
class SessionManager {
  constructor(private storageService: IStorageService) {}
  
  restoreLastSession(): Component | null {
    // Retrieve the last edited component
    const lastComponent = this.storageService.getLastEditedComponent();
    return lastComponent;
  }
  
  loadSession(component: Component): ComponentData {
    return this.storageService.loadComponent(component.id);
  }
}
```

### When to Use

- For application startup
- When implementing crash recovery
- For "continue where you left off" functionality

## Error Handling Integration

Ensure proper error handling for storage operations.

### Pattern

```typescript
class StorageOperationManager {
  constructor(
    private storageService: IStorageService,
    private errorHandler: IErrorHandler,
    private uiNotifier: UINotifier
  ) {}
  
  saveComponent(component: Component, data: ComponentData): boolean {
    try {
      const success = this.storageService.saveComponent(component, data);
      
      if (success) {
        this.uiNotifier.notify('Component saved successfully');
        return true;
      } else {
        this.uiNotifier.notify('Failed to save component', 'warning');
        return false;
      }
    } catch (error) {
      this.errorHandler.handle(error);
      this.uiNotifier.notify('Error saving component', 'error');
      return false;
    }
  }
}
```

### When to Use

- For all storage operations
- When providing user feedback
- To ensure consistent error handling

## Best Practices

1. **Always Handle Errors**: Storage operations can fail for various reasons (quota exceeded, malformed data, etc.)

2. **Use Transactions When Possible**: If saving multiple related pieces of data, ensure they succeed or fail as a unit

3. **Provide User Feedback**: Notify users of storage successes and failures

4. **Version Your Data**: Include version information in stored data to handle format changes

5. **Validate Before Storage**: Ensure data is valid before attempting to save it

6. **Implement Data Migration**: Handle migration of data format changes gracefully

7. **Consider Privacy**: Be mindful of what data is stored and for how long

8. **Test Storage Failures**: Simulate storage failures to ensure proper error handling

## Related Documentation

- [Storage Service Architecture](./StorageServiceArchitecture.md) - Detailed architecture overview
- [Storage Service Testing Strategy](./StorageServiceTestingStrategy.md) - Testing patterns
- [Error Handler Integration](../errors/ErrorHandlerIntegrationPatterns.md) - Error handling patterns