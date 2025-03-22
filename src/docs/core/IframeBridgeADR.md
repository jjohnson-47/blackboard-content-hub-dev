# Architecture Decision Record: Iframe Communication Bridge

## Status

Accepted

## Context

The DevPreview UI needs to establish secure, reliable communication between the parent window and iframes that contain previewed content and math visualization tools. This communication is essential for:

1. Updating preview content when the editor changes
2. Sending commands to math visualization tools inside iframes
3. Receiving events and state updates from the iframe content
4. Handling errors that occur within iframes
5. Managing the lifecycle of iframe content

Cross-origin communication between windows presents several challenges:

1. **Security**: We need to prevent cross-site scripting (XSS) and ensure only trusted sources can communicate
2. **Consistency**: Different browsers may handle postMessage slightly differently
3. **Error Handling**: Network issues, content security policies, or other factors may disrupt communication
4. **Serialization**: Only serializable data can be passed between windows
5. **Event Management**: We need a clean way to subscribe to and unsubscribe from iframe events

## Decision

We will implement an Iframe Communication Bridge with the following components:

1. **IIframeBridge Interface**: A common interface that defines methods for establishing connections, sending/receiving messages, and managing the lifecycle of iframe communications.

2. **IframeBridge Implementation**: A concrete implementation that uses the postMessage API with proper origin validation and error handling.

3. **Event Bus Integration**: The bridge will integrate with our existing event bus system to provide a consistent event-based communication pattern.

4. **Serialization Helpers**: Utilities to handle serialization/deserialization of complex data structures.

5. **Error Handling**: Specialized error handling for iframe communication issues, integrated with our central error handling system.

The bridge interface will include methods for:
- Connecting to an iframe with origin validation
- Sending events to the iframe
- Sending events to the parent window
- Disconnecting and cleaning up resources

## Consequences

### Positive

1. **Security**: Proper origin validation and message structure validation will prevent malicious cross-origin attacks.

2. **Abstraction**: The bridge abstracts away the complexities of postMessage, providing a clean API for the rest of the application.

3. **Consistency**: A single implementation ensures consistent behavior across the application.

4. **Error Handling**: Centralized error handling for iframe communication issues improves reliability.

5. **Event-Based Architecture**: Integration with the event bus maintains our event-driven architecture pattern.

### Negative

1. **Complexity**: Adds another layer of abstraction to the system.

2. **Performance Overhead**: Message serialization/deserialization and event dispatching add some performance overhead.

3. **Debugging Challenges**: Debugging cross-window communication can be more difficult than in-process communication.

## Implementation Details

### IIframeBridge Interface

```typescript
import { IEventBus } from './IEventBus';

export interface IIframeBridge {
  connect(iframe: HTMLIFrameElement, targetOrigin: string): Promise<void>;
  sendToIframe(eventName: string, data: any): void;
  sendToParent(eventName: string, data: any): void;
  disconnect(): void;
  getEventBus(): IEventBus;
}
```

### Message Structure

Messages sent between windows will follow a consistent structure:

```typescript
interface IframeMessage {
  type: 'event' | 'command' | 'response' | 'error';
  name: string;
  data?: any;
  id?: string; // For correlating responses with commands
  timestamp: number;
}
```

### Security Considerations

1. **Origin Validation**: Always validate the origin of incoming messages against the expected origin.

```typescript
window.addEventListener('message', (event) => {
  if (event.origin !== this.targetOrigin) {
    return; // Ignore messages from unexpected origins
  }
  // Process the message
});
```

2. **Content Security Policy**: Recommend appropriate CSP headers to prevent unauthorized script execution.

3. **Data Validation**: Validate all incoming message data before processing.

### Error Handling

Iframe communication errors will be handled through the central error handling system with a specific error type:

```typescript
// In ErrorEventType enum
IFRAME_ERROR = 'error:iframe'

// In ErrorHandler class
handleIframeError(source: HTMLIFrameElement | string, message: string, details?: any): void
```

## Alternatives Considered

### Direct postMessage Usage

Using postMessage directly throughout the application would be simpler initially but would lead to duplicated code, inconsistent error handling, and potential security issues.

### Third-Party Libraries

Libraries like iframe-resizer or postmate provide similar functionality but would add external dependencies and may not integrate as well with our event system.

### Server-Side Communication

Using the server as an intermediary for communication would be more secure but would add latency and complexity, and would not work for offline usage.

## References

- [Window.postMessage() - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [Content Security Policy - MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [HTML5 Security Cheatsheet](https://html5sec.org/)