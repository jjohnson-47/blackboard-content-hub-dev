# Enhanced Event Bus Features

The EnhancedEventBus provides several additional features beyond the basic implementation. This document details these features and how to use them effectively.

## Type-Safe Event Handling

The EnhancedEventBus provides improved type safety through TypeScript generics:

```typescript
// Define event payload type
interface ContentChangedEvent {
  content: string;
  timestamp: Date;
  source: string;
}

// Type-safe event subscription
eventBus.on<ContentChangedEvent>('editor:content-changed', (event) => {
  // TypeScript knows the event structure
  console.log(event.content);
});

// Type-safe event emission
eventBus.emit<ContentChangedEvent>('editor:content-changed', {
  content: 'const x = 5;',
  timestamp: new Date(),
  source: 'editor-component'
});
```

## Debug Mode

Enable debug mode to log all event activity to the console:

```typescript
// Enable debug mode
eventBus.setDebugMode(true);

// Events will now be logged to console
// [EventBus] Registered listener for: editor:content-changed
// [EventBus] Emitting event: editor:content-changed { content: "..." }
```

This is particularly useful during development and debugging to:
- Track event flow through the application
- Verify that events are being emitted as expected
- Debug timing issues with event handling

## Event Introspection

Query the event system about its current state:

```typescript
// Check if an event has any listeners
if (eventBus.hasListeners('editor:content-changed')) {
  // Do something only if someone is listening
}

// Get all active events
const activeEvents = eventBus.getActiveEvents();
console.log(`Active events: ${activeEvents.join(', ')}`);

// Get listener count for a specific event
const count = eventBus.getListenerCount('editor:content-changed');
console.log(`${count} listeners for editor:content-changed`);
```

These introspection capabilities are useful for:
- Conditional event emission (only emit if someone is listening)
- Debugging event subscription issues
- Performance optimization by avoiding unnecessary event processing

## Event Cleanup

Clear events when no longer needed:

```typescript
// Clear all listeners for a specific event
eventBus.clearEvent('editor:content-changed');

// Clear all events and listeners
eventBus.clearAllEvents();
```

These cleanup methods are useful for:
- Testing scenarios where you need a clean event system
- Component reinitialization
- Preventing memory leaks in long-running applications

## Improved Error Handling

The EnhancedEventBus integrates with the ErrorHandler system:

```typescript
// Create event bus with error handler
const eventBus = new EnhancedEventBus(errorHandler);

// Errors in event listeners will be properly handled
// and won't crash the application
```

When an error occurs in an event listener:
1. The error is caught by the EventBus
2. It's logged to the console
3. An AppError is created with appropriate context
4. The error is passed to the ErrorHandler
5. Other event listeners continue to execute

This ensures that a single failing listener doesn't break the entire event flow.

## Integration with Service Container

Register the EnhancedEventBus in the service container:

```typescript
// In bootstrap code
const container = new ServiceContainer();
const errorHandler = new ErrorHandler();
container.register('errorHandler', errorHandler);
container.register('eventBus', new EnhancedEventBus(errorHandler));
```

Components should receive the event bus through dependency injection:

```typescript
constructor(
  private container: HTMLElement,
  private eventBus: IEnhancedEventBus,
  private errorHandler: IErrorHandler
) { 
  // Initialize component
}
```

## Best Practices for Enhanced Event Bus

1. **Use Type Safety**: Always define interfaces for event payloads
2. **Enable Debug Mode in Development**: Turn on debug mode during development and testing
3. **Check Listener Existence**: Use `hasListeners` before expensive event preparation
4. **Clean Up Events**: Use `clearEvent` when components are disposed
5. **Handle Errors**: Always provide an error handler to the EnhancedEventBus
6. **Document Event Contracts**: Keep a central registry of event types and their payloads

## Migration from Basic EventBus

To migrate from the basic EventBus to the EnhancedEventBus:

1. Update service container registration:
   ```typescript
   // Before
   container.register('eventBus', new EventBus());
   
   // After
   container.register('eventBus', new EnhancedEventBus(errorHandler));
   ```

2. Update component interfaces to use the enhanced interface:
   ```typescript
   // Before
   constructor(private eventBus: IEventBus) { ... }
   
   // After
   constructor(private eventBus: IEnhancedEventBus) { ... }
   ```

3. Take advantage of type safety with generics:
   ```typescript
   // Before
   eventBus.on('event', (data) => { ... });
   
   // After
   eventBus.on<EventType>('event', (data) => { ... });
   ```

The EnhancedEventBus is fully backward compatible with the basic IEventBus interface, so migration can be gradual.