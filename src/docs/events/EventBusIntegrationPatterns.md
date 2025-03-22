# EventBus Integration Patterns

This document provides concrete patterns for integrating components with the EventBus in DevPreview UI.

## Component Integration Patterns

### Basic Component Integration

The fundamental pattern for integrating a component with the EventBus:

```typescript
/**
 * Example component with EventBus integration
 */
export class EditorComponent implements IEditor {
  private unsubscribeHandlers: Array<() => void> = [];
  
  constructor(
    private container: HTMLElement,
    private eventBus: IEventBus,
    private errorHandler: IErrorHandler
  ) {
    // Initialize component
    this.initialize();
    
    // Set up event subscriptions
    this.setupEventSubscriptions();
  }
  
  private setupEventSubscriptions(): void {
    // Subscribe to relevant events
    this.unsubscribeHandlers.push(
      this.eventBus.on('preview:rendered', this.handlePreviewRendered.bind(this))
    );
    
    this.unsubscribeHandlers.push(
      this.eventBus.on('editor:focus-requested', this.handleFocusRequest.bind(this))
    );
  }
  
  private handlePreviewRendered(data: any): void {
    // Handle preview rendered event
    console.log('Preview rendered with data:', data);
  }
  
  private handleFocusRequest(): void {
    // Focus the editor
    this.focus();
  }
  
  public focus(): void {
    // Implementation details...
    
    // Emit event when editor receives focus
    this.eventBus.emit('editor:focused', {
      timestamp: new Date(),
      source: 'user-action'
    });
  }
  
  public dispose(): void {
    // Unsubscribe from all events
    this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    this.unsubscribeHandlers = [];
    
    // Clean up DOM, etc.
    // ...
  }
}
```

### Dependency Injection Pattern

Components should receive the EventBus through dependency injection:

```typescript
// During component creation in a factory
createEditor(container: HTMLElement, serviceContainer: IServiceContainer): IEditor {
  return new EditorComponent(
    container,
    serviceContainer.get<IEventBus>('eventBus'),
    serviceContainer.get<IErrorHandler>('errorHandler')
  );
}
```

### Event Handler Organization

For components with many event handlers, organize them by domain:

```typescript
export class ComplexComponent {
  private setupEventSubscriptions(): void {
    // Content-related events
    this.subscribeToContentEvents();
    
    // UI-related events
    this.subscribeToUIEvents();
    
    // System events
    this.subscribeToSystemEvents();
  }
  
  private subscribeToContentEvents(): void {
    this.unsubscribeHandlers.push(
      this.eventBus.on('content:created', this.handleContentCreated.bind(this)),
      this.eventBus.on('content:updated', this.handleContentUpdated.bind(this)),
      this.eventBus.on('content:deleted', this.handleContentDeleted.bind(this))
    );
  }
  
  private subscribeToUIEvents(): void {
    this.unsubscribeHandlers.push(
      this.eventBus.on('ui:theme-changed', this.handleThemeChanged.bind(this)),
      this.eventBus.on('ui:resize', this.handleResize.bind(this))
    );
  }
  
  private subscribeToSystemEvents(): void {
    this.unsubscribeHandlers.push(
      this.eventBus.on('system:save-requested', this.handleSaveRequest.bind(this)),
      this.eventBus.on('system:error', this.handleSystemError.bind(this))
    );
  }
}
```

## Service Integration Patterns

### Service Wrapper Pattern

For services that need to broadcast events:

```typescript
/**
 * Storage service with EventBus integration
 */
export class StorageService implements IStorageService {
  constructor(
    private adapter: IStorageAdapter,
    private eventBus: IEventBus,
    private errorHandler: IErrorHandler
  ) {}
  
  async saveComponent(id: string, data: any): Promise<boolean> {
    try {
      // Emit event before saving
      this.eventBus.emit('storage:save:started', {
        id,
        timestamp: new Date()
      });
      
      // Perform the save operation
      const result = await this.adapter.save(id, data);
      
      // Emit event after successful save
      this.eventBus.emit('storage:save:completed', {
        id,
        success: true,
        timestamp: new Date()
      });
      
      return result;
    } catch (error) {
      // Handle error and emit error event
      this.errorHandler.handle(error);
      
      this.eventBus.emit('storage:save:failed', {
        id,
        error: error.message,
        timestamp: new Date()
      });
      
      return false;
    }
  }
}
```

### Event-Driven Service Coordination

For coordinating multiple services:

```typescript
/**
 * Coordinates content synchronization between services
 */
export class ContentSyncCoordinator {
  private unsubscribeHandlers: Array<() => void> = [];
  
  constructor(
    private storageService: IStorageService,
    private eventBus: IEventBus,
    private errorHandler: IErrorHandler
  ) {
    this.setupEventSubscriptions();
  }
  
  private setupEventSubscriptions(): void {
    // Listen for content changes
    this.unsubscribeHandlers.push(
      this.eventBus.on('editor:content-changed', this.handleContentChanged.bind(this))
    );
    
    // Listen for explicit save requests
    this.unsubscribeHandlers.push(
      this.eventBus.on('content:save-requested', this.handleSaveRequest.bind(this))
    );
  }
  
  private async handleContentChanged(data: any): Promise<void> {
    if (data.autoSave === true) {
      await this.saveContent(data.id, data.content);
    }
  }
  
  private async handleSaveRequest(data: any): Promise<void> {
    await this.saveContent(data.id, data.content);
  }
  
  private async saveContent(id: string, content: any): Promise<void> {
    try {
      const success = await this.storageService.saveComponent(id, content);
      
      if (!success) {
        this.eventBus.emit('sync:failed', {
          id,
          reason: 'Storage service returned false',
          timestamp: new Date()
        });
      }
    } catch (error) {
      this.errorHandler.handle(error);
      
      this.eventBus.emit('sync:failed', {
        id,
        error: error.message,
        timestamp: new Date()
      });
    }
  }
  
  public dispose(): void {
    this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    this.unsubscribeHandlers = [];
  }
}
```

## Factory Integration Patterns

### Component Creation Events

Factories should emit events when components are created:

```typescript
export class EditorFactory implements IEditorFactory {
  constructor(
    private eventBus: IEventBus,
    private errorHandler: IErrorHandler
  ) {}
  
  createEditor(container: HTMLElement, config: EditorConfig): IEditor {
    try {
      const editor = new CodeMirrorEditor(
        container,
        config,
        this.eventBus,
        this.errorHandler
      );
      
      // Emit component created event
      this.eventBus.emit('component:created', {
        type: 'editor',
        id: editor.getId(),
        config,
        timestamp: new Date()
      });
      
      return editor;
    } catch (error) {
      this.errorHandler.handle(error);
      
      // Emit component creation failed event
      this.eventBus.emit('component:create-failed', {
        type: 'editor',
        error: error.message,
        config,
        timestamp: new Date()
      });
      
      // Throw or return null based on your error handling strategy
      throw error;
    }
  }
}
```

## EventBus Middleware Pattern

For cross-cutting concerns like logging, analytics, or debugging:

```typescript
/**
 * EventBus middleware for logging all events
 */
export class EventLogger {
  private unsubscribeHandlers: Array<() => void> = [];
  
  constructor(private eventBus: IEventBus) {
    // Subscribe to all events using a wildcard pattern
    this.unsubscribeHandlers.push(
      this.eventBus.on('*', this.logEvent.bind(this))
    );
  }
  
  private logEvent(event: string, data: any): void {
    console.log(`Event: ${event}`, data);
  }
  
  public dispose(): void {
    this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    this.unsubscribeHandlers = [];
  }
}
```

Note: The actual implementation would need to modify the EventBus to support wildcard event subscriptions.

## Error Handling with EventBus

Integrating error handling with the event system:

```typescript
export class ComponentWithErrorHandling {
  constructor(
    private eventBus: IEventBus,
    private errorHandler: IErrorHandler
  ) {}
  
  public performRiskyOperation(): void {
    try {
      // Code that might throw
      throw new Error('Something went wrong');
    } catch (error) {
      // Handle the error
      this.errorHandler.handle(error);
      
      // Emit event for UI components to show error indication
      this.eventBus.emit('component:operation-failed', {
        operation: 'performRiskyOperation',
        error: error.message,
        timestamp: new Date()
      });
    }
  }
}
```

## Request-Response Pattern

For operations that need to request data from another component:

```typescript
/**
 * Implements a request-response pattern over EventBus
 */
export class ComponentRequester {
  private nextRequestId = 1;
  private pendingRequests = new Map<
    string,
    { resolve: (data: any) => void, reject: (error: Error) => void, timeout: any }
  >();
  
  constructor(private eventBus: IEventBus) {
    // Listen for responses
    this.eventBus.on('response', this.handleResponse.bind(this));
  }
  
  /**
   * Make a request and return a promise for the response
   */
  public request(target: string, data: any, timeoutMs: number = 5000): Promise<any> {
    return new Promise((resolve, reject) => {
      // Generate a unique request ID
      const requestId = `req_${this.nextRequestId++}`;
      
      // Set a timeout for the request
      const timeout = setTimeout(() => {
        // Remove the pending request
        this.pendingRequests.delete(requestId);
        
        // Reject the promise
        reject(new Error(`Request timed out: ${target}`));
      }, timeoutMs);
      
      // Store the request handlers
      this.pendingRequests.set(requestId, { resolve, reject, timeout });
      
      // Emit the request event
      this.eventBus.emit('request', {
        target,
        requestId,
        data,
        timestamp: new Date()
      });
    });
  }
  
  /**
   * Handle response events
   */
  private handleResponse(response: any): void {
    const { requestId, error, data } = response;
    
    // Look up the pending request
    const pendingRequest = this.pendingRequests.get(requestId);
    if (!pendingRequest) return; // No matching request found
    
    // Clear the timeout
    clearTimeout(pendingRequest.timeout);
    
    // Remove the pending request
    this.pendingRequests.delete(requestId);
    
    // Resolve or reject the promise
    if (error) {
      pendingRequest.reject(new Error(error));
    } else {
      pendingRequest.resolve(data);
    }
  }
  
  /**
   * Register a responder for a specific target
   */
  public registerResponder(target: string, handler: (request: any) => Promise<any>): () => void {
    const requestHandler = async (request: any) => {
      // Check if this request is for this target
      if (request.target !== target) return;
      
      try {
        // Call the handler to get the response data
        const responseData = await handler(request.data);
        
        // Emit the response event
        this.eventBus.emit('response', {
          requestId: request.requestId,
          data: responseData,
          timestamp: new Date()
        });
      } catch (error) {
        // Emit error response
        this.eventBus.emit('response', {
          requestId: request.requestId,
          error: error.message,
          timestamp: new Date()
        });
      }
    };
    
    // Subscribe to request events
    return this.eventBus.on('request', requestHandler);
  }
  
  public dispose(): void {
    // Clear all pending requests
    for (const { reject, timeout } of this.pendingRequests.values()) {
      clearTimeout(timeout);
      reject(new Error('ComponentRequester disposed'));
    }
    this.pendingRequests.clear();
  }
}
```

Example usage:

```typescript
// Setup
const requester = new ComponentRequester(eventBus);

// Register a responder
const unsubscribe = requester.registerResponder('calculator', async (data) => {
  // Process the request and return a result
  return { result: data.a + data.b };
});

// Make a request
try {
  const result = await requester.request('calculator', { a: 5, b: 3 });
  console.log('Result:', result); // Output: Result: { result: 8 }
} catch (error) {
  console.error('Request failed:', error);
}

// Clean up
unsubscribe();
```

## Event-Based State Management

For components that need to maintain state based on events:

```typescript
/**
 * Component state manager based on events
 */
export class ComponentStateManager {
  private state: any = {};
  private unsubscribeHandlers: Array<() => void> = [];
  
  constructor(private eventBus: IEventBus) {
    this.setupEventSubscriptions();
  }
  
  private setupEventSubscriptions(): void {
    // Listen for state update events
    this.unsubscribeHandlers.push(
      this.eventBus.on('state:update', this.handleStateUpdate.bind(this))
    );
    
    // Listen for state reset events
    this.unsubscribeHandlers.push(
      this.eventBus.on('state:reset', this.handleStateReset.bind(this))
    );
  }
  
  private handleStateUpdate(update: any): void {
    // Update the state
    this.state = {
      ...this.state,
      ...update
    };
    
    // Emit state changed event
    this.eventBus.emit('state:changed', {
      ...this.state,
      timestamp: new Date()
    });
  }
  
  private handleStateReset(): void {
    // Reset the state
    this.state = {};
    
    // Emit state changed event
    this.eventBus.emit('state:changed', {
      ...this.state,
      timestamp: new Date()
    });
  }
  
  public getState(): any {
    return { ...this.state };
  }
  
  public dispose(): void {
    this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    this.unsubscribeHandlers = [];
  }
}
```

## Performance Patterns

### Debounced Events

For high-frequency events that need to be throttled:

```typescript
/**
 * Utility for creating debounced event handlers
 * @param handler The event handler function
 * @param delay The debounce delay in milliseconds
 * @returns A debounced handler function
 */
function debounceEventHandler<T>(
  handler: (data: T) => void,
  delay: number
): (data: T) => void {
  let timeoutId: number | null = null;
  let latestData: T;
  
  return (data: T) => {
    latestData = data;
    
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      handler(latestData);
      timeoutId = null;
    }, delay);
  };
}

// Usage in a component
class EditorWithDebouncedEvents {
  constructor(private eventBus: IEventBus) {
    // Set up editor change handler
    this.editor.on('change', this.handleEditorChange.bind(this));
  }
  
  private handleEditorChange(content: string): void {
    // Emit debounced content change event
    this.emitContentChanged({
      content,
      timestamp: new Date(),
      source: 'user-input'
    });
  }
  
  // Debounced event emitter
  private emitContentChanged = debounceEventHandler((data: any) => {
    this.eventBus.emit('editor:content-changed', data);
  }, 300);
}
```

## Integration Testing Patterns

Example of testing components that use the EventBus:

```typescript
describe('Component EventBus Integration', () => {
  let eventBus: EventBus;
  let component: TestComponent;
  
  beforeEach(() => {
    // Create a real EventBus for integration tests
    eventBus = new EventBus();
    
    // Create the component with the EventBus
    component = new TestComponent(eventBus);
  });
  
  afterEach(() => {
    // Clean up
    component.dispose();
  });
  
  test('should react to events', () => {
    // Set up a spy to check the component's reaction
    const spy = vi.spyOn(component, 'handleSomeAction');
    
    // Emit an event that the component should react to
    eventBus.emit('some:action', { value: 42 });
    
    // Verify the component reacted correctly
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      value: 42
    }));
  });
  
  test('should emit events when actions occur', () => {
    // Set up a listener
    const listener = vi.fn();
    const unsubscribe = eventBus.on('component:action-performed', listener);
    
    // Perform an action that should emit an event
    component.performAction();
    
    // Verify the event was emitted
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      timestamp: expect.any(Date)
    }));
    
    // Clean up
    unsubscribe();
  });
});
```

## Best Practices Summary

1. **Always unsubscribe**: Store and clean up event subscriptions to prevent memory leaks.
2. **Use dependency injection**: Components should receive the EventBus through DI.
3. **Follow naming conventions**: Use domain:action for event names.
4. **Include timestamps**: Add a timestamp to all event payloads.
5. **Structure payloads consistently**: Define a consistent structure for event data.
6. **Document event contracts**: Keep track of what events components emit and listen for.
7. **Handle errors**: Wrap event handlers in try/catch and emit error events.
8. **Throttle high-frequency events**: Use debouncing or throttling for performance.
9. **Test event integrations**: Write tests that verify event behavior.
10. **Clean up resources**: Properly dispose of all listeners and resources.

## Conclusion

These patterns provide a solid foundation for integrating components with the EventBus in DevPreview UI. By following these patterns, developers can create loosely coupled components that communicate effectively while maintaining clean separation of concerns.

Related documentation:
- [EventBusADR.md](./EventBusADR.md) - Architecture decision record for the event system
- [EventBus README.md](./README.md) - Overview of the event system
- [IframeEventBridging.md](./IframeEventBridging.md) - Bridging events across iframe boundaries
- [ErrorEventSystem.md](../errors/ErrorEventSystem.md) - Error handling with events