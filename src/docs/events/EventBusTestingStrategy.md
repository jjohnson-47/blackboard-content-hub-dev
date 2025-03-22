# EventBus Testing Strategy

This document outlines strategies for testing components and services that integrate with the EventBus in DevPreview UI.

## Testing Layers

The event system should be tested at multiple layers:

1. **Unit Tests**: Testing the EventBus implementation itself
2. **Component Tests**: Testing individual components' event handling
3. **Integration Tests**: Testing communication between components
4. **System Tests**: Testing event flows across the entire application

## Testing the EventBus Implementation

Unit tests for the EventBus implementation should verify that:

```typescript
describe('EventBus', () => {
  let eventBus: EventBus;
  
  beforeEach(() => {
    eventBus = new EventBus();
  });
  
  test('should allow subscribing to events', () => {
    // Arrange
    const callback = vi.fn();
    
    // Act
    eventBus.on('test-event', callback);
    eventBus.emit('test-event', { data: 'test' });
    
    // Assert
    expect(callback).toHaveBeenCalledWith({ data: 'test' });
  });
  
  test('should allow unsubscribing from events', () => {
    // Arrange
    const callback = vi.fn();
    const unsubscribe = eventBus.on('test-event', callback);
    
    // Act
    unsubscribe();
    eventBus.emit('test-event', { data: 'test' });
    
    // Assert
    expect(callback).not.toHaveBeenCalled();
  });
  
  test('should support one-time event handling', () => {
    // Arrange
    const callback = vi.fn();
    
    // Act
    eventBus.once('test-event', callback);
    eventBus.emit('test-event', { data: 'test1' });
    eventBus.emit('test-event', { data: 'test2' });
    
    // Assert
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({ data: 'test1' });
  });
  
  test('should isolate errors in event handlers', () => {
    // Arrange
    const errorCallback = vi.fn().mockImplementation(() => {
      throw new Error('Test error');
    });
    const normalCallback = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Act
    eventBus.on('test-event', errorCallback);
    eventBus.on('test-event', normalCallback);
    eventBus.emit('test-event', { data: 'test' });
    
    // Assert
    expect(consoleSpy).toHaveBeenCalled();
    expect(normalCallback).toHaveBeenCalled();
  });
});
```

## Mocking the EventBus

For testing components in isolation, use a mock EventBus:

```typescript
// Create a mock EventBus
const createMockEventBus = () => ({
  on: vi.fn().mockReturnValue(vi.fn()), // Return a mock unsubscribe function
  off: vi.fn(),
  emit: vi.fn(),
  once: vi.fn().mockReturnValue(vi.fn())
});
```

## Testing Component Event Subscriptions

When testing that a component subscribes to the right events:

```typescript
describe('ComponentWithEvents', () => {
  let component: ComponentWithEvents;
  let mockEventBus: any;
  
  beforeEach(() => {
    mockEventBus = createMockEventBus();
    component = new ComponentWithEvents(mockEventBus);
  });
  
  test('should subscribe to the right events', () => {
    // Assert component subscribed to expected events
    expect(mockEventBus.on).toHaveBeenCalledWith(
      'event1',
      expect.any(Function)
    );
    expect(mockEventBus.on).toHaveBeenCalledWith(
      'event2',
      expect.any(Function)
    );
  });
  
  test('should properly unsubscribe when disposed', () => {
    // Arrange
    const unsubscribe1 = vi.fn();
    const unsubscribe2 = vi.fn();
    
    // Mock the on method to return specific unsubscribe functions
    mockEventBus.on
      .mockReturnValueOnce(unsubscribe1)
      .mockReturnValueOnce(unsubscribe2);
    
    // Re-create the component to get the mocked unsubscribe functions
    component = new ComponentWithEvents(mockEventBus);
    
    // Act
    component.dispose();
    
    // Assert
    expect(unsubscribe1).toHaveBeenCalled();
    expect(unsubscribe2).toHaveBeenCalled();
  });
});
```

## Testing Component Event Emissions

When testing that a component emits the right events:

```typescript
describe('ComponentThatEmitsEvents', () => {
  let component: ComponentThatEmitsEvents;
  let mockEventBus: any;
  
  beforeEach(() => {
    mockEventBus = createMockEventBus();
    component = new ComponentThatEmitsEvents(mockEventBus);
  });
  
  test('should emit events when actions are performed', () => {
    // Act
    component.performAction('test data');
    
    // Assert
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'component:action-performed',
      expect.objectContaining({
        data: 'test data',
        timestamp: expect.any(Date)
      })
    );
  });
});
```

## Testing Event Handlers

When testing a component's event handlers:

```typescript
describe('ComponentWithEventHandlers', () => {
  let component: ComponentWithEventHandlers;
  let mockEventBus: any;
  
  beforeEach(() => {
    mockEventBus = createMockEventBus();
    component = new ComponentWithEventHandlers(mockEventBus);
  });
  
  test('should handle events correctly', () => {
    // Arrange
    // Extract the handler function passed to eventBus.on
    const handleEvent = mockEventBus.on.mock.calls.find(
      call => call[0] === 'test-event'
    )[1];
    
    // Mock an internal method that should be called by the handler
    const spy = vi.spyOn(component, 'processData');
    
    // Act
    // Manually call the handler function
    handleEvent({ data: 'test data' });
    
    // Assert
    expect(spy).toHaveBeenCalledWith('test data');
  });
});
```

## Integration Testing with Real EventBus

For testing communication between components:

```typescript
describe('Component integration', () => {
  let eventBus: EventBus;
  let componentA: ComponentA;
  let componentB: ComponentB;
  
  beforeEach(() => {
    // Use a real EventBus for integration tests
    eventBus = new EventBus();
    
    // Create components that share the EventBus
    componentA = new ComponentA(eventBus);
    componentB = new ComponentB(eventBus);
  });
  
  afterEach(() => {
    // Clean up
    componentA.dispose();
    componentB.dispose();
  });
  
  test('should communicate through events', () => {
    // Arrange
    const spy = vi.spyOn(componentB, 'handleDataFromA');
    
    // Act
    componentA.sendData('test data');
    
    // Assert
    expect(spy).toHaveBeenCalledWith('test data');
  });
});
```

## Testing Error Handling

When testing how errors in event handlers are managed:

```typescript
describe('Error handling in events', () => {
  let eventBus: EventBus;
  let errorHandler: ErrorHandler;
  let component: ComponentWithEvents;
  
  beforeEach(() => {
    // Create a real EventBus and ErrorHandler
    eventBus = new EventBus();
    errorHandler = new ErrorHandler();
    
    // Spy on the error handler
    vi.spyOn(errorHandler, 'handle');
    
    // Create component
    component = new ComponentWithEvents(eventBus, errorHandler);
  });
  
  test('should handle errors in event handlers', () => {
    // Arrange
    // Create an event that will cause an error in the component
    const errorEvent = {
      type: 'error-causing-event',
      data: null // Missing required data
    };
    
    // Act
    eventBus.emit(errorEvent.type, errorEvent.data);
    
    // Assert
    expect(errorHandler.handle).toHaveBeenCalled();
    expect(errorHandler.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('invalid data')
      })
    );
  });
});
```

## Testing Custom Event Utilities

For testing utilities like debounced event handlers:

```typescript
describe('Debounced event handler', () => {
  let eventBus: EventBus;
  let component: ComponentWithDebouncedEvents;
  
  beforeEach(() => {
    // Set up fake timers
    vi.useFakeTimers();
    
    // Create real EventBus
    eventBus = new EventBus();
    
    // Create component
    component = new ComponentWithDebouncedEvents(eventBus);
  });
  
  afterEach(() => {
    // Clean up
    vi.useRealTimers();
  });
  
  test('should debounce events', () => {
    // Arrange
    const spy = vi.spyOn(eventBus, 'emit');
    
    // Act - Trigger multiple rapid changes
    component.handleChange('change 1');
    component.handleChange('change 2');
    component.handleChange('final change');
    
    // Nothing should be emitted yet
    expect(spy).not.toHaveBeenCalled();
    
    // Fast-forward time
    vi.runAllTimers();
    
    // Assert - Only the last change should have triggered an event
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(
      'component:change',
      expect.objectContaining({
        data: 'final change'
      })
    );
  });
});
```

## Testing Event Communication Across Iframes

For testing iframe event bridging:

```typescript
describe('Iframe event bridging', () => {
  let eventBus: EventBus;
  let iframeBridge: IframeBridge;
  let iframe: HTMLIFrameElement;
  
  beforeEach(() => {
    // Set up
    eventBus = new EventBus();
    iframeBridge = new IframeBridge(eventBus);
    
    // Create an iframe
    iframe = document.createElement('iframe');
    iframe.src = 'about:blank';
    document.body.appendChild(iframe);
    
    // Wait for iframe to load
    return new Promise(resolve => {
      iframe.onload = resolve;
    });
  });
  
  afterEach(() => {
    // Clean up
    document.body.removeChild(iframe);
  });
  
  test('should send events to iframe', () => {
    // Arrange
    const spy = vi.spyOn(iframe.contentWindow!, 'postMessage');
    
    // Act
    iframeBridge.sendEventToIframe(iframe, 'test-event', { data: 'test' });
    
    // Assert
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'test-event',
        payload: { data: 'test' },
        source: 'parent'
      }),
      '*'
    );
  });
  
  test('should receive events from iframe', async () => {
    // Arrange
    const spy = vi.spyOn(eventBus, 'emit');
    
    // Set up listener for messages
    iframeBridge.initialize();
    
    // Act - Simulate message from iframe
    const messageEvent = new MessageEvent('message', {
      data: {
        type: 'iframe-event',
        payload: { data: 'from iframe' },
        source: 'iframe'
      },
      origin: window.location.origin
    });
    window.dispatchEvent(messageEvent);
    
    // Assert
    expect(eventBus.emit).toHaveBeenCalledWith(
      'iframe:iframe-event',
      expect.objectContaining({
        data: 'from iframe'
      })
    );
  });
});
```

## Testing Event-Based Component Coordination

Testing how components coordinate through events:

```typescript
describe('Component coordination', () => {
  let eventBus: EventBus;
  let editor: Editor;
  let preview: Preview;
  let coordinator: EditorPreviewCoordinator;
  
  beforeEach(() => {
    // Set up
    eventBus = new EventBus();
    
    // Create components
    editor = new Editor(document.createElement('div'), eventBus);
    preview = new Preview(document.createElement('div'), eventBus);
    
    // Create coordinator
    coordinator = new EditorPreviewCoordinator(eventBus);
  });
  
  afterEach(() => {
    // Clean up
    editor.dispose();
    preview.dispose();
    coordinator.dispose();
  });
  
  test('should update preview when editor content changes', () => {
    // Arrange
    const previewSpy = vi.spyOn(preview, 'setContent');
    
    // Act
    editor.setContent('new content');
    
    // Assert
    expect(previewSpy).toHaveBeenCalledWith('new content');
  });
});
```

## Testing Async Event Flows

For testing asynchronous event flows:

```typescript
describe('Async event flows', () => {
  let eventBus: EventBus;
  let component: AsyncComponent;
  
  beforeEach(() => {
    // Set up
    eventBus = new EventBus();
    component = new AsyncComponent(eventBus);
  });
  
  test('should complete async operations and emit completion event', async () => {
    // Arrange
    const completionListener = vi.fn();
    eventBus.on('operation:complete', completionListener);
    
    // Act
    component.startAsyncOperation();
    
    // Wait for async operations to complete
    await vi.runAllTimersAsync();
    
    // Assert
    expect(completionListener).toHaveBeenCalled();
    expect(completionListener).toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'success'
      })
    );
  });
});
```

## Testing Event-Based State Management

For testing state management that uses events:

```typescript
describe('Event-based state management', () => {
  let eventBus: EventBus;
  let stateManager: StateManager;
  
  beforeEach(() => {
    // Set up
    eventBus = new EventBus();
    stateManager = new StateManager(eventBus);
  });
  
  test('should update state based on events', () => {
    // Arrange
    const stateChangedListener = vi.fn();
    eventBus.on('state:changed', stateChangedListener);
    
    // Act
    eventBus.emit('state:update', { count: 1 });
    eventBus.emit('state:update', { user: 'test' });
    
    // Assert
    expect(stateChangedListener).toHaveBeenCalledTimes(2);
    expect(stateChangedListener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        count: 1,
        user: 'test'
      })
    );
    expect(stateManager.getState()).toEqual({
      count: 1,
      user: 'test'
    });
  });
});
```

## Test Coverage Goals

For the event system, aim for the following test coverage levels:

1. **EventBus Implementation**: 100% code coverage
2. **Component Event Handling**: ≥ 90% coverage
3. **Event Utilities**: 100% coverage
4. **Integration Tests**: Cover all major event flows
5. **Edge Cases**: Test error handling, race conditions, and boundary scenarios

## Testing Tools

Recommended tools for testing the event system:

1. **Vitest/Jest**: For unit and integration testing
2. **Sinon**: For more advanced mocking capabilities when needed
3. **Testing Library**: For testing event-driven UI components
4. **Puppeteer**: For end-to-end testing of iframe communication

## Common Testing Pitfalls

Watch out for these common issues when testing event-based systems:

1. **Not cleaning up subscriptions**: Make sure tests clean up event listeners to prevent test interference
2. **Timing issues**: Be cautious with debounced/throttled events and race conditions
3. **Missing error isolation**: Ensure that error handlers don't fail tests unexpectedly
4. **Fragile tests**: Avoid testing implementation details of the event system
5. **Mocking too much**: Use real EventBus in integration tests for better confidence

## Testing Strategy Checklist

When testing components that use the EventBus, ensure:

- [x] Unit tests for the EventBus implementation
- [x] Tests for component event subscriptions and unsubscriptions
- [x] Tests for component event emissions
- [x] Tests for event handlers within components
- [x] Integration tests for component coordination
- [x] Tests for error handling in event flows
- [x] Tests for async event flows
- [x] Tests for event-based state management
- [x] Tests for debounced/throttled events
- [x] Tests for iframe event bridging

## Conclusion

A comprehensive testing strategy for the event system is crucial for ensuring reliable communication between components in the DevPreview UI. By following these testing patterns, developers can be confident that event-driven components will function correctly in isolation and when integrated with the rest of the system.

Related documentation:
- [EventBusADR.md](./EventBusADR.md) - Architecture decision record for the event system
- [EventBus README.md](./README.md) - Overview of the event system
- [EventBusIntegrationPatterns.md](./EventBusIntegrationPatterns.md) - Patterns for integrating with the event system
- [IframeEventBridging.md](./IframeEventBridging.md) - Bridging events across iframe boundaries