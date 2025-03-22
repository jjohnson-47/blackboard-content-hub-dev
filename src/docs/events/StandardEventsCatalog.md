# Standard Events Catalog

This document catalogs the standard events used throughout the DevPreview UI application. It serves as the definitive reference for event names, expected payloads, and usage patterns.

## How to Use This Catalog

When implementing components that use the EventBus:

1. **Emitting Events**: Check if a standard event already exists for your use case before creating a new one.
2. **Subscribing to Events**: Refer to this catalog to understand what data to expect in event payloads.
3. **Contributing**: When adding new standard events, update this catalog to maintain it as a comprehensive reference.

## Event Naming Conventions

Events follow a consistent naming pattern: `domain:action` or `domain:subdomain:action`. Examples:

- `editor:content-changed`
- `preview:rendered`
- `factory:component:created`

## Standard Event Payload Structure

Most events should include these common fields in their payload:

```typescript
interface BaseEventPayload {
  // When the event occurred
  timestamp: Date;
  
  // Optional: Who/what triggered the event
  source?: string;
  
  // Optional: ID of the related component
  componentId?: string;
}
```

## Component Lifecycle Events

Events related to component creation, initialization, and disposal.

| Event Name | Description | Payload Properties |
|------------|-------------|-------------------|
| `component:created` | A component was successfully created | `{ type: string, id: string, config: any, timestamp: Date }` |
| `component:initialized` | A component finished initialization | `{ type: string, id: string, timestamp: Date }` |
| `component:disposed` | A component was destroyed | `{ type: string, id: string, timestamp: Date }` |
| `component:create-failed` | Component creation failed | `{ type: string, error: string, config: any, timestamp: Date }` |

### Example Usage

```typescript
// When a component is created
eventBus.emit('component:created', {
  type: 'editor',
  id: 'editor-1',
  config: { theme: 'light', language: 'javascript' },
  timestamp: new Date()
});
```

## Editor Events

Events related to the editor component.

| Event Name | Description | Payload Properties |
|------------|-------------|-------------------|
| `editor:content-changed` | Editor content was changed | `{ content: string, source: string, isUserChange: boolean, timestamp: Date }` |
| `editor:selection-changed` | Selection in editor changed | `{ selection: { start: number, end: number }, timestamp: Date }` |
| `editor:focus` | Editor received focus | `{ source: string, timestamp: Date }` |
| `editor:blur` | Editor lost focus | `{ source: string, timestamp: Date }` |
| `editor:theme-changed` | Editor theme was changed | `{ theme: string, timestamp: Date }` |
| `editor:language-changed` | Editor language was changed | `{ language: string, timestamp: Date }` |
| `editor:save-requested` | User requested to save content | `{ content: string, timestamp: Date }` |

### Example Usage

```typescript
// When the editor content changes
eventBus.emit('editor:content-changed', {
  content: 'const x = 10;',
  source: 'user-input',
  isUserChange: true,
  selection: { start: 10, end: 10 },
  timestamp: new Date()
});
```

## Preview Events

Events related to the preview component.

| Event Name | Description | Payload Properties |
|------------|-------------|-------------------|
| `preview:rendered` | Preview finished rendering content | `{ timestamp: Date }` |
| `preview:render-failed` | Preview failed to render content | `{ error: string, timestamp: Date }` |
| `preview:resize` | Preview container was resized | `{ width: number, height: number, timestamp: Date }` |
| `preview:interaction` | User interacted with the preview | `{ type: string, details: any, timestamp: Date }` |
| `preview:reload-requested` | Request to reload the preview | `{ timestamp: Date }` |
| `preview:visibility-changed` | Preview visibility changed | `{ visible: boolean, timestamp: Date }` |

### Example Usage

```typescript
// When the preview finishes rendering
eventBus.emit('preview:rendered', {
  timestamp: new Date()
});
```

## Error Events

Events related to error handling. See [ErrorEventSystem.md](../errors/ErrorEventSystem.md) for details.

| Event Name | Description | Payload Properties |
|------------|-------------|-------------------|
| `error:occurred` | General error occurred | `{ type: ErrorType, message: string, details?: any, timestamp: Date }` |
| `error:component` | Component-specific error | `{ source: string, type: ErrorType, message: string, details?: any, timestamp: Date }` |
| `error:network` | Network-related error | `{ url: string, status?: number, message: string, timestamp: Date }` |
| `error:validation` | Validation error | `{ field?: string, message: string, value?: any, timestamp: Date }` |
| `error:iframe` | Error in iframe | `{ source: string, message: string, details?: any, timestamp: Date }` |
| `error:factory` | Factory-related error | `{ factoryType: string, message: string, details?: any, timestamp: Date }` |
| `error:recovery-attempt` | Recovery attempt for an error | `{ originalError: any, strategy: string, timestamp: Date }` |

### Example Usage

```typescript
// When a network error occurs
eventBus.emit('error:network', {
  url: 'https://api.example.com/data',
  status: 404,
  message: 'Resource not found',
  timestamp: new Date()
});
```

## Storage Events

Events related to data storage operations.

| Event Name | Description | Payload Properties |
|------------|-------------|-------------------|
| `storage:save:started` | Save operation started | `{ id: string, timestamp: Date }` |
| `storage:save:completed` | Save operation completed | `{ id: string, success: boolean, timestamp: Date }` |
| `storage:save:failed` | Save operation failed | `{ id: string, error: string, timestamp: Date }` |
| `storage:load:started` | Load operation started | `{ id: string, timestamp: Date }` |
| `storage:load:completed` | Load operation completed | `{ id: string, success: boolean, data?: any, timestamp: Date }` |
| `storage:load:failed` | Load operation failed | `{ id: string, error: string, timestamp: Date }` |

### Example Usage

```typescript
// When a save operation completes
eventBus.emit('storage:save:completed', {
  id: 'document-123',
  success: true,
  timestamp: new Date()
});
```

## UI Events

Events related to the application user interface.

| Event Name | Description | Payload Properties |
|------------|-------------|-------------------|
| `ui:theme-changed` | Application theme changed | `{ theme: string, timestamp: Date }` |
| `ui:layout-changed` | UI layout configuration changed | `{ layout: any, timestamp: Date }` |
| `ui:panel-toggled` | UI panel toggled (open/closed) | `{ panel: string, isOpen: boolean, timestamp: Date }` |
| `ui:modal-opened` | Modal dialog opened | `{ id: string, data?: any, timestamp: Date }` |
| `ui:modal-closed` | Modal dialog closed | `{ id: string, result?: any, timestamp: Date }` |

### Example Usage

```typescript
// When the application theme changes
eventBus.emit('ui:theme-changed', {
  theme: 'dark',
  timestamp: new Date()
});
```

## Iframe Events

Events related to iframe communication. See [IframeEventBridging.md](./IframeEventBridging.md) for details.

| Event Name | Description | Payload Properties |
|------------|-------------|-------------------|
| `iframe:loaded` | Iframe finished loading | `{ source: string, timestamp: Date }` |
| `iframe:unloaded` | Iframe was unloaded | `{ source: string, timestamp: Date }` |
| `iframe:message-received` | Message received from iframe | `{ source: string, type: string, data: any, timestamp: Date }` |
| `iframe:message-sent` | Message sent to iframe | `{ target: string, type: string, data: any, timestamp: Date }` |
| `iframe:error` | Error occurred in iframe | `{ source: string, message: string, details?: any, timestamp: Date }` |
| `iframe:communication-error` | Error in iframe communication | `{ target: string, error: string, timestamp: Date }` |

### Example Usage

```typescript
// When an iframe is fully loaded
eventBus.emit('iframe:loaded', {
  source: 'desmos-calculator',
  timestamp: new Date()
});
```

## Math Visualization Tool Events

Events specific to math visualization tools like Desmos and GeoGebra.

| Event Name | Description | Payload Properties |
|------------|-------------|-------------------|
| `math:calculator-state-changed` | Calculator state changed | `{ type: string, state: any, timestamp: Date }` |
| `math:expression-added` | Mathematical expression added | `{ id: string, latex: string, timestamp: Date }` |
| `math:expression-removed` | Mathematical expression removed | `{ id: string, timestamp: Date }` |
| `math:expression-error` | Error in mathematical expression | `{ id: string, error: string, details?: any, timestamp: Date }` |
| `math:visualization-ready` | Math visualization is ready | `{ type: string, timestamp: Date }` |
| `math:computation-completed` | Computation finished | `{ duration: number, timestamp: Date }` |

### Example Usage

```typescript
// When a Desmos calculator state changes
eventBus.emit('math:calculator-state-changed', {
  type: 'desmos',
  state: { expressions: { list: [...] } },
  timestamp: new Date()
});
```

## System Events

Events related to the application system state.

| Event Name | Description | Payload Properties |
|------------|-------------|-------------------|
| `system:initialized` | Application system initialized | `{ timestamp: Date }` |
| `system:configuration-loaded` | System configuration loaded | `{ config: any, timestamp: Date }` |
| `system:ready` | System is ready for user interaction | `{ timestamp: Date }` |
| `system:shutdown` | System is shutting down | `{ reason: string, timestamp: Date }` |
| `system:heartbeat` | Periodic system health check | `{ status: string, metrics?: any, timestamp: Date }` |

### Example Usage

```typescript
// When the system is fully initialized and ready
eventBus.emit('system:ready', {
  timestamp: new Date()
});
```

## Request-Response Events

Events used in the request-response pattern.

| Event Name | Description | Payload Properties |
|------------|-------------|-------------------|
| `request` | Request for data or action | `{ target: string, requestId: string, data: any, timestamp: Date }` |
| `response` | Response to a request | `{ requestId: string, error?: string, data?: any, timestamp: Date }` |

### Example Usage

```typescript
// Requesting data
eventBus.emit('request', {
  target: 'storage-service',
  requestId: 'req_12345',
  data: { operation: 'get', id: 'document-123' },
  timestamp: new Date()
});

// Responding to a request
eventBus.emit('response', {
  requestId: 'req_12345',
  data: { document: { ... } },
  timestamp: new Date()
});
```

## State Management Events

Events used for state management.

| Event Name | Description | Payload Properties |
|------------|-------------|-------------------|
| `state:update` | Update application state | `{ [key: string]: any, timestamp: Date }` |
| `state:reset` | Reset application state | `{ timestamp: Date }` |
| `state:changed` | State has changed | `{ [key: string]: any, timestamp: Date }` |

### Example Usage

```typescript
// Updating state
eventBus.emit('state:update', {
  currentDocument: 'doc-123',
  isEditing: true,
  timestamp: new Date()
});
```

## Adding New Standard Events

When adding new standard events to the system:

1. Follow the naming conventions (`domain:action` or `domain:subdomain:action`)
2. Include standard fields like `timestamp` in all payloads
3. Document the event in this catalog
4. Consider backward compatibility if modifying existing events
5. Add appropriate event handling in relevant components

## Checking for Event Existence

Use the following approach to check if an event exists:

```typescript
/**
 * Check if an event exists
 * @param eventName Name of the event to check
 * @returns Boolean indicating if event has any subscribers
 */
hasListeners(eventName: string): boolean {
  return !!(this.listeners[eventName] && this.listeners[eventName].length > 0);
}
```

## Event Debugging

For debugging events in development:

```typescript
// Enable event debugging
localStorage.setItem('debug-events', 'true');

// In EventBus implementation
private logEvent(event: string, data: any): void {
  if (
    typeof localStorage !== 'undefined' && 
    localStorage.getItem('debug-events') === 'true'
  ) {
    console.log(`[EventBus] ${event}`, data);
  }
}
```

## Conclusion

This catalog provides a comprehensive reference of standard events in the DevPreview UI application. By consistently using these standard events, components can communicate effectively while maintaining loose coupling.

Related documentation:
- [EventBusADR.md](./EventBusADR.md) - Architecture decision record for the event system
- [EventBus README.md](./README.md) - Overview of the event system
- [EventBusIntegrationPatterns.md](./EventBusIntegrationPatterns.md) - Patterns for integrating with the event system
- [IframeEventBridging.md](./IframeEventBridging.md) - Bridging events across iframe boundaries
- [EventBusTestingStrategy.md](./EventBusTestingStrategy.md) - Testing the event system
- [ErrorEventSystem.md](../errors/ErrorEventSystem.md) - Error handling with events