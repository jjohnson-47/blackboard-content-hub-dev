# Event System Overview

**Status: Complete**

The DevPreview UI uses an event-driven architecture to facilitate communication between components in a loosely coupled manner. This document provides an overview of the event system and how to use it effectively.

## Core Components

**Status: Complete**

The event system consists of:

1. **IEventBus Interface**: The basic contract that defines the event system's capabilities
2. **EventBus Implementation**: The concrete implementation of the event bus
3. **EnhancedIEventBus Interface**: An extended interface with improved type safety and additional functionality
4. **EnhancedEventBus Implementation**: An enhanced implementation with better error handling and debugging capabilities
5. **IIframeBridge Interface**: A bridge for communicating between the main application and iframes
6. **Event Naming Conventions**: Standards for naming events consistently
7. **Event Payload Structures**: Conventions for event data

## Key Features

**Status: Complete**

- **Component Decoupling**: Components don't need direct references to communicate
- **Unsubscribe Capability**: All event subscriptions return functions to unsubscribe
- **Error Isolation**: Errors in event handlers don't crash the entire application
- **One-Time Events**: Support for events that are handled once and then cleaned up
- **Type Safety**: Enhanced interfaces provide better TypeScript type checking
- **Debug Mode**: Optional debug mode for logging all events during development
- **Event Introspection**: Ability to query active events and listener counts
- **Iframe Communication**: Secure bridge for communicating with iframe content

## Using the Event System

**Status: Complete**

### Basic vs Enhanced Event Bus

The system provides two event bus implementations:

1. **Basic EventBus**: A simple implementation with core functionality
2. **EnhancedEventBus**: An extended implementation with additional features

For most new development, we recommend using the EnhancedEventBus as it provides better type safety, debugging capabilities, and error handling.

```typescript
// Service container registration
container.register('eventBus', new EnhancedEventBus(errorHandler));

// Component usage with dependency injection
constructor(
  private container: HTMLElement,
  private eventBus: IEnhancedEventBus,
  private errorHandler: IErrorHandler
) {
  // Initialize component
}
```

### Subscribing to Events

**Status: Complete**

Components subscribe to events using the `on` method:

```typescript
// In a component constructor
constructor(private eventBus: IEventBus) {
  this.unsubscribeHandlers = [];
  
  // Subscribe to an event
  const unsubscribe = this.eventBus.on('editor:content-changed',
    (content) => this.handleContentChanged(content));
  
  // Store the unsubscribe function
  this.unsubscribeHandlers.push(unsubscribe);
}

// In the component disposal method
dispose(): void {
  // Unsubscribe from all events
  this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
  this.unsubscribeHandlers = [];
}
```

### Publishing Events

**Status: Complete**

Components publish events using the `emit` method:

```typescript
// Emit an event with payload
this.eventBus.emit('editor:content-changed', {
  content: this.getContent(),
  timestamp: new Date(),
  source: 'user-input'
});
```

### One-Time Event Handlers

**Status: Complete**

For events that should only be handled once:

```typescript
// Subscribe to an event once
this.eventBus.once('component:initialized', (data) => {
  // This callback will only be called for the first event
  this.initializeUI(data);
});
```

## Event Naming Conventions

**Status: Complete**

Events should follow this pattern: `domain:action` or `domain:subDomain:action`

Examples:
- `editor:content-changed`
- `preview:rendered`
- `factory:component:created`
- `error:occurred`
- `storage:save:completed`

## Event Payload Best Practices

**Status: Complete**

- Include a `timestamp` for when the event occurred
- Include a `source` identifier when multiple components might emit the same event
- Keep payloads serializable (avoid circular references)
- Include enough context for handlers to act without additional context

Example:
```typescript
{
  content: "const x = 5;",
  timestamp: new Date(),
  source: "editor-monaco",
  isUserChange: true,
  selection: { start: 0, end: 5 }
}
```

## Integration with Other Systems

**Status: Complete**

### Service Container Integration

The EventBus is registered in the service container:

```typescript
// In bootstrap code
const container = new ServiceContainer();
container.register('eventBus', new EventBus());
```

Components should receive the event bus through dependency injection:

```typescript
constructor(
  private container: HTMLElement,
  private eventBus: IEventBus,
  private errorHandler: IErrorHandler
) {
  // Initialize component
}
```

### Error Handler Integration

**Status: Complete**

The error system and event system work together:

1. Components can emit error events: `error:occurred`, `error:component`, etc.
2. The ErrorHandler can listen for these events and process them
3. The ErrorHandler can emit recovery events that components respond to

See [ErrorEventSystem.md](../errors/ErrorEventSystem.md) for details.

### Factory System Integration

**Status: Complete**

The factory system uses events to communicate component lifecycle:

1. Factories emit `component:created` when a new component is built
2. Factories emit `component:create-failed` when creation fails

See [FactoryIntegrationPatterns.md](../factories/FactoryIntegrationPatterns.md) for details.

## Common Event Types

The following standard event types are used throughout the application:

### Component Lifecycle
- `component:created` - A component was successfully created
- `component:initialized` - A component finished initialization
- `component:disposed` - A component was destroyed
- `component:create-failed` - Component creation failed

### Content Events
- `editor:content-changed` - The editor's content was modified
- `editor:selection-changed` - The editor's selection changed
- `preview:rendered` - The preview finished rendering content
- `preview:interaction` - The user interacted with the preview

### Error Events
- `error:occurred` - A general error occurred
- `error:component` - A component-specific error
- `error:network` - A network-related error
- `error:iframe` - An error in an iframe
- `error:validation` - A validation error
- `error:recovery-attempt` - An attempt to recover from an error

### Storage Events
- `storage:save:requested` - A save operation was requested
- `storage:save:completed` - A save operation completed
- `storage:save:failed` - A save operation failed
- `storage:load:requested` - A load operation was requested
- `storage:load:completed` - A load operation completed
- `storage:load:failed` - A load operation failed

## Testing with the Event System

When testing components that use the event system:

1. Create a mock EventBus with Jest/Vitest functions
2. Verify that components subscribe to expected events
3. Trigger events and verify component behavior
4. Check that components properly unsubscribe when disposed

Example test:

```typescript
test('editor emits content-changed event when text changes', () => {
  // Arrange
  const mockEventBus = {
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn(),
    emit: vi.fn()
  };
  const editor = new Editor(document.createElement('div'), mockEventBus);
  
  // Act
  editor.setText('const x = 10;');
  
  // Assert
  expect(mockEventBus.emit).toHaveBeenCalledWith(
    'editor:content-changed',
    expect.objectContaining({
      content: 'const x = 10;'
    })
  );
});
```

## Best Practices

1. **Always unsubscribe from events** when components are disposed to prevent memory leaks
2. **Keep event handlers lightweight** to prevent blocking the UI thread
3. **Handle errors in event callbacks** to prevent breaking the event system
4. **Document event contracts** with clear payload structures
5. **Use typed event definitions** when possible for better type safety
6. **Test event integration** between components

## Advanced Patterns

### Event Hierarchies

For complex domains, consider organizing events hierarchically:

```typescript
// Constants for event types
export const EDITOR_EVENTS = {
  CONTENT_CHANGED: 'editor:content-changed',
  SELECTION_CHANGED: 'editor:selection-changed',
  FOCUS: 'editor:focus',
  BLUR: 'editor:blur'
};
```

### Type Safety with Generic Events

For TypeScript projects, consider enhancing type safety:

```typescript
// Define event payload types
interface ContentChangedEvent {
  content: string;
  timestamp: Date;
  source: string;
}

// Type-safe event subscription
this.eventBus.on<ContentChangedEvent>(
  EDITOR_EVENTS.CONTENT_CHANGED, 
  (event) => {
    // TypeScript knows the event structure
    console.log(event.content);
  }
);
```

## Further Reading

- [EventBusADR.md](./EventBusADR.md) - Architecture decision record for the event system
- [EnhancedEventBusFeatures.md](./EnhancedEventBusFeatures.md) - Detailed guide to enhanced event bus capabilities
- [EventBusIntegrationPatterns.md](./EventBusIntegrationPatterns.md) - Patterns for integrating with the event system
- [EventBusTestingStrategy.md](./EventBusTestingStrategy.md) - Strategies for testing event-driven components
- [IframeEventBridging.md](./IframeEventBridging.md) - Coordinating events across iframe boundaries
- [StandardEventsCatalog.md](./StandardEventsCatalog.md) - Reference for standard event types and payloads
- [ErrorEventSystem.md](../errors/ErrorEventSystem.md) - Error handling with events