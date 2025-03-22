# Iframe Event Bridging

This document explains how to bridge event communication between the main application and iframes containing math visualization tools in DevPreview UI.

## Overview

DevPreview UI uses iframes to sandbox math visualization tools (Desmos, GeoGebra, etc.). Since these iframes operate in separate JavaScript contexts, we need a bridge to facilitate event-based communication while maintaining security.

## Architecture

The iframe event bridging system consists of:

1. **Main Application EventBus**: The central event system in the parent window
2. **Iframe Message Bridge**: A translator between EventBus events and postMessage
3. **Allowed Origins Registry**: A security mechanism for controlling communication
4. **Serialization Layer**: Ensures data can be passed through the postMessage boundary

```
┌─────────────────────────────────────────┐
│ Main Application                         │
│                                         │
│  ┌─────────────┐        ┌────────────┐  │
│  │  EventBus   │◄─────►│Iframe Bridge│  │
│  └─────────────┘        └────────────┘  │
│                               ▲          │
└───────────────────────────────┬─────────┘
                                │
                                ▼
┌─────────────────────────────────────────┐
│ Iframe (Math Tool)                      │
│                                         │
│  ┌─────────────┐        ┌────────────┐  │
│  │   Tool API  │◄─────►│Parent Bridge│  │
│  └─────────────┘        └────────────┘  │
│                                         │
└─────────────────────────────────────────┘
```

## Security Considerations

### Origin Validation

All postMessage communication must validate origins:

```typescript
// In the iframe bridge (parent window)
window.addEventListener('message', (event) => {
  // Validate the origin
  if (!this.isAllowedOrigin(event.origin)) {
    this.errorHandler.createAndHandle(
      ErrorType.SECURITY,
      `Message received from unauthorized origin: ${event.origin}`,
      { message: event.data }
    );
    return;
  }
  
  // Process the message
  this.processIncomingMessage(event.data, event.origin);
});
```

### Allowed Origins

Origins are registered in a configuration object:

```typescript
// Allowed origins configuration
const allowedOrigins = [
  'https://www.desmos.com',
  'https://www.geogebra.org', 
  'https://localhost:3000'
];

// Origin validation function
private isAllowedOrigin(origin: string): boolean {
  return allowedOrigins.includes(origin) || 
         origin === window.location.origin;
}
```

## Message Protocol

Messages between the parent and iframe follow a standardized format:

```typescript
interface IframeMessage {
  // Message type identifier
  type: string;
  
  // Message payload
  payload: any;
  
  // Optional correlation ID for request/response pairs
  correlationId?: string;
  
  // Source identifier
  source: 'parent' | 'iframe';
  
  // Optional target if multiple iframes are present
  target?: string;
}
```

## Event to postMessage Mapping

Events in the main application are mapped to postMessage communications:

```typescript
// Event to message mapping example
private eventToMessage(event: string, data: any): IframeMessage {
  switch (event) {
    case 'editor:content-changed':
      return {
        type: 'content-update',
        payload: {
          content: data.content,
          timestamp: data.timestamp
        },
        source: 'parent'
      };
      
    case 'preview:resize':
      return {
        type: 'viewport-change',
        payload: {
          width: data.width,
          height: data.height
        },
        source: 'parent'
      };
      
    // Other mappings...
    
    default:
      // Pass through events with standard prefix
      if (event.startsWith('iframe:')) {
        return {
          type: event.substring(7), // Remove 'iframe:' prefix
          payload: data,
          source: 'parent'
        };
      }
      
      // Ignore events not meant for iframes
      return null;
  }
}
```

## Parent-to-Iframe Communication

Events from the main application are sent to the iframe:

```typescript
/**
 * Sends an event to the iframe
 * @param iframe The target iframe element
 * @param event The event name
 * @param data The event data
 */
public sendEventToIframe(
  iframe: HTMLIFrameElement, 
  event: string, 
  data: any
): void {
  if (!iframe.contentWindow) {
    this.errorHandler.createAndHandle(
      ErrorType.IFRAME,
      'Cannot send message to iframe: contentWindow is null',
      { iframe, event, data }
    );
    return;
  }
  
  const message = this.eventToMessage(event, data);
  if (!message) return; // Event not mapped to iframe message
  
  iframe.contentWindow.postMessage(
    message,
    this.getTargetOrigin(iframe)
  );
}
```

## Iframe-to-Parent Communication

Messages from the iframe are converted to events in the main application:

```typescript
/**
 * Process an incoming message from an iframe
 * @param message The message data
 * @param origin The origin of the message
 */
private processIncomingMessage(message: IframeMessage, origin: string): void {
  if (message.source !== 'iframe') {
    return; // Ignore messages not from iframe
  }
  
  const event = this.messageToEvent(message);
  if (!event) return; // Message not mapped to any event
  
  // Emit the event on the main EventBus
  this.eventBus.emit(event.name, event.data);
}
```

## Request-Response Pattern

For operations requiring a response:

```typescript
/**
 * Sends a request to the iframe and returns a promise for the response
 * @param iframe The target iframe
 * @param requestType The request type
 * @param data The request payload
 * @returns Promise resolving to the response
 */
public requestFromIframe<T>(
  iframe: HTMLIFrameElement,
  requestType: string,
  data: any
): Promise<T> {
  return new Promise((resolve, reject) => {
    const correlationId = this.generateCorrelationId();
    
    // Set up one-time listener for the response
    const messageHandler = (event: MessageEvent) => {
      if (!this.isAllowedOrigin(event.origin)) return;
      
      const message = event.data as IframeMessage;
      if (
        message.type === `${requestType}-response` &&
        message.correlationId === correlationId
      ) {
        // Remove the listener
        window.removeEventListener('message', messageHandler);
        
        if (message.payload.error) {
          reject(new Error(message.payload.error));
        } else {
          resolve(message.payload.result);
        }
      }
    };
    
    // Listen for the response
    window.addEventListener('message', messageHandler);
    
    // Send the request
    iframe.contentWindow?.postMessage(
      {
        type: requestType,
        payload: data,
        correlationId,
        source: 'parent'
      },
      this.getTargetOrigin(iframe)
    );
    
    // Set timeout for response
    setTimeout(() => {
      window.removeEventListener('message', messageHandler);
      reject(new Error(`Request timeout: ${requestType}`));
    }, 5000);
  });
}
```

## Implementation in Iframe Content

The iframe content must implement a matching protocol:

```typescript
// In the iframe's JavaScript
window.addEventListener('message', (event) => {
  // Always validate the origin
  if (!isAllowedParentOrigin(event.origin)) {
    console.error(`Message received from unauthorized origin: ${event.origin}`);
    return;
  }
  
  const message = event.data;
  
  // Handle different message types
  switch (message.type) {
    case 'content-update':
      // Update the math visualization with new content
      updateVisualization(message.payload.content);
      break;
      
    case 'viewport-change':
      // Adjust the visualization size
      resizeVisualization(
        message.payload.width,
        message.payload.height
      );
      break;
      
    case 'get-state':
      // Handle request-response pattern
      sendToParent({
        type: 'get-state-response',
        correlationId: message.correlationId,
        payload: {
          result: getCurrentState()
        },
        source: 'iframe'
      });
      break;
  }
});

// Send a message to the parent
function sendToParent(message) {
  window.parent.postMessage(message, '*');
}
```

## Integration with Math Visualization Tools

### Desmos Integration

```typescript
/**
 * Bridges Desmos calculator events to the main application
 * @param calculator Desmos calculator instance
 * @param eventBridge Iframe event bridge
 */
function setupDesmosEventBridge(calculator, eventBridge) {
  // Listen for Desmos calculator state changes
  calculator.observeEvent('change', () => {
    // Send state change to parent
    sendToParent({
      type: 'calculator-state-changed',
      payload: {
        state: calculator.getState(),
        timestamp: new Date()
      },
      source: 'iframe'
    });
  });
  
  // Listen for parent events
  window.addEventListener('message', (event) => {
    if (!isAllowedParentOrigin(event.origin)) return;
    
    const message = event.data;
    
    // Handle state updates from parent
    if (message.type === 'set-calculator-state') {
      calculator.setState(message.payload.state);
    }
  });
}
```

### GeoGebra Integration

```typescript
/**
 * Bridges GeoGebra applet events to the main application
 * @param applet GeoGebra applet instance
 * @param eventBridge Iframe event bridge
 */
function setupGeoGebraEventBridge(applet, eventBridge) {
  // Register GeoGebra update listener
  applet.registerUpdateListener(() => {
    // Send state to parent
    sendToParent({
      type: 'geogebra-state-changed',
      payload: {
        xml: applet.getXML(),
        timestamp: new Date()
      },
      source: 'iframe'
    });
  });
  
  // Listen for parent events
  window.addEventListener('message', (event) => {
    if (!isAllowedParentOrigin(event.origin)) return;
    
    const message = event.data;
    
    // Handle different message types
    if (message.type === 'set-geogebra-state') {
      applet.setXML(message.payload.xml);
    } else if (message.type === 'evaluate-command') {
      try {
        const result = applet.evalCommand(message.payload.command);
        sendToParent({
          type: 'evaluate-command-response',
          correlationId: message.correlationId,
          payload: { result },
          source: 'iframe'
        });
      } catch (error) {
        sendToParent({
          type: 'evaluate-command-response',
          correlationId: message.correlationId,
          payload: { error: error.message },
          source: 'iframe'
        });
      }
    }
  });
}
```

## Event Mapping Reference

| Main Application Event | Iframe Message Type | Description |
|------------------------|---------------------|-------------|
| `editor:content-changed` | `content-update` | Content changed in the editor |
| `preview:resize` | `viewport-change` | Preview container was resized |
| `preview:request-state` | `get-state` | Request current state from the iframe |
| `iframe:update-visualization` | `update-visualization` | Direct command to update the visualization |
| `iframe:run-command` | `run-command` | Execute a tool-specific command |
| `iframe:calculator-state-changed` | `calculator-state-changed` | Desmos calculator state changed |
| `iframe:geogebra-state-changed` | `geogebra-state-changed` | GeoGebra applet state changed |

## Error Handling

Errors in iframe communication are handled through the ErrorHandler:

```typescript
try {
  iframe.contentWindow.postMessage(message, targetOrigin);
} catch (error) {
  this.errorHandler.createAndHandle(
    ErrorType.IFRAME,
    'Failed to send message to iframe',
    {
      error: error.message,
      iframe: iframe.id,
      message
    }
  );
  
  // Emit an event for the error
  this.eventBus.emit(
    'iframe:communication-error',
    {
      iframeId: iframe.id,
      error: error.message,
      timestamp: new Date()
    }
  );
}
```

## Testing the Iframe Bridge

For testing the iframe bridge:

```typescript
describe('IframeBridge', () => {
  let bridge;
  let mockEventBus;
  let mockErrorHandler;
  let iframe;
  
  beforeEach(() => {
    // Set up mock EventBus
    mockEventBus = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      once: vi.fn()
    };
    
    // Set up mock ErrorHandler
    mockErrorHandler = {
      handle: vi.fn(),
      createAndHandle: vi.fn()
    };
    
    // Create iframe element
    iframe = document.createElement('iframe');
    iframe.src = 'https://example.com';
    document.body.appendChild(iframe);
    
    // Create bridge
    bridge = new IframeBridge(mockEventBus, mockErrorHandler);
  });
  
  afterEach(() => {
    document.body.removeChild(iframe);
  });
  
  test('should validate origin of incoming messages', () => {
    // Simulate message event with invalid origin
    const messageEvent = new MessageEvent('message', {
      data: { type: 'test', payload: {}, source: 'iframe' },
      origin: 'https://malicious-site.com'
    });
    
    window.dispatchEvent(messageEvent);
    
    // Should reject message with error
    expect(mockErrorHandler.createAndHandle).toHaveBeenCalledWith(
      ErrorType.SECURITY,
      expect.stringContaining('unauthorized origin'),
      expect.any(Object)
    );
    
    // Should not emit any events
    expect(mockEventBus.emit).not.toHaveBeenCalled();
  });
});
```

## Best Practices

1. **Always Validate Origins**: Never skip origin validation as it's a critical security measure
2. **Use Correlation IDs**: For request-response patterns to correctly match responses with requests
3. **Implement Timeouts**: Add timeouts for requests to prevent hanging promises
4. **Serialize Data**: Ensure all data being passed is serializable
5. **Handle Errors**: Implement robust error handling for communication failures
6. **Close Event Listeners**: Properly clean up event listeners when components are disposed
7. **Throttle Events**: For high-frequency events like mouse movements, throttle events to prevent performance issues
8. **Document Message Types**: Keep a registry of supported message types and their expected payloads

## Conclusion

The iframe event bridging system provides a secure and effective way to integrate third-party math visualization tools with the DevPreview UI event system. By following the patterns described in this document, components can communicate across iframe boundaries while maintaining security and performance.

Related documentation:
- [EventBusADR.md](./EventBusADR.md) - Architecture decision record for the event system
- [EventBus README.md](./README.md) - Overview of the event system
- [ErrorEventSystem.md](../errors/ErrorEventSystem.md) - Error handling with events