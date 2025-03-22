# Iframe Error Handling Guide

## Overview

This guide addresses the unique challenges of error handling in iframe contexts within the DevPreview UI application. Since our application relies heavily on iframes for embedding math visualization tools, proper error handling across frame boundaries is essential for a robust user experience.

## Cross-Origin Considerations

### Security Constraints

When working with iframes, particularly those loading content from different origins, several security restrictions affect error handling:

- **Same-Origin Policy**: Errors in cross-origin iframes cannot be directly accessed by the parent window
- **Error Object Serialization**: Error objects cannot be fully serialized across frame boundaries
- **Stack Trace Limitations**: Stack traces are often stripped in cross-origin error messages

### Handling Cross-Origin Errors

To handle errors across origins:

```typescript
// In the parent window
window.addEventListener('message', (event) => {
  // Always validate the origin of incoming messages
  if (!isAllowedOrigin(event.origin)) {
    return;
  }
  
  const { type, payload } = event.data;
  
  if (type === 'error') {
    // Use the error handler to process the error
    errorHandler.createAndHandle(
      ErrorType.RUNTIME,
      payload.message || 'Error in iframe content',
      { 
        source: event.origin,
        details: payload.details,
        timestamp: new Date()
      }
    );
  }
});

// Helper function to validate message origins
function isAllowedOrigin(origin: string): boolean {
  const allowedOrigins = [
    'https://www.desmos.com',
    'https://www.geogebra.org',
    // Add other trusted origins
  ];
  
  return allowedOrigins.includes(origin);
}
```

## Parent-Iframe Error Communication

### Standardized Error Message Format

Use a consistent message structure for error communication:

```typescript
// Error message structure
interface IframeErrorMessage {
  type: 'error';
  payload: {
    errorType: string;     // Maps to our ErrorType enum
    message: string;       // Human-readable error message
    details?: any;         // Additional context
    code?: string;         // Error code if available
    recoverable?: boolean; // Whether the error is recoverable
  };
}
```

### Error Communication Patterns

#### 1. Iframe to Parent Communication

```typescript
// In the iframe
try {
  // Math API operation that might fail
} catch (error) {
  // Send error to parent
  window.parent.postMessage({
    type: 'error',
    payload: {
      errorType: 'runtime', // Will be mapped to ErrorType.RUNTIME
      message: error.message,
      details: { 
        apiName: 'Desmos',
        operation: 'graph-update',
        timestamp: new Date()
      }
    }
  }, '*'); // In production, specify exact parent origin for security
}
```

#### 2. Parent to Iframe Communication

```typescript
// In the parent window
function notifyIframeOfError(iframe: HTMLIFrameElement, message: string): void {
  iframe.contentWindow?.postMessage({
    type: 'error',
    payload: {
      errorType: 'validation',
      message: message,
      recoverable: true
    }
  }, iframe.src);
}
```

## Error Recovery Strategies

### Iframe Reload Mechanism

For unrecoverable errors, implement a reload mechanism:

```typescript
function handleIframeError(iframe: HTMLIFrameElement, error: AppError): void {
  errorHandler.handle(error);
  
  // If error is unrecoverable, reload the iframe
  if (isUnrecoverableError(error)) {
    reloadIframe(iframe);
  }
}

function reloadIframe(iframe: HTMLIFrameElement): void {
  const currentSrc = iframe.src;
  iframe.src = '';
  
  // Short timeout to ensure DOM updates
  setTimeout(() => {
    iframe.src = currentSrc;
  }, 100);
}
```

### Graceful Degradation

Implement fallback content when iframe content fails:

```typescript
function showFallbackContent(container: HTMLElement, error: AppError): void {
  container.innerHTML = `
    <div class="iframe-error-container">
      <h3>Visualization temporarily unavailable</h3>
      <p>We're having trouble displaying this content.</p>
      <button class="retry-button">Retry</button>
    </div>
  `;
  
  container.querySelector('.retry-button')?.addEventListener('click', () => {
    // Reload the iframe or retry the operation
    loadIframeContent(container);
  });
}
```

## Implementation in ErrorHandler

Extend the `ErrorHandler` class to handle iframe-specific errors:

```typescript
import { IErrorHandler, ErrorType, AppError } from './IErrorHandler';
import { IEventBus } from '../events/IEventBus';

export class ErrorHandler implements IErrorHandler {
  // Existing implementation...
  
  /**
   * Handles errors that occur within iframes
   * @param source The iframe element where the error occurred
   * @param message Error message
   * @param details Optional error details
   */
  public handleIframeError(
    source: HTMLIFrameElement, 
    message: string, 
    details?: any
  ): void {
    const error = new AppError(
      ErrorType.RUNTIME,
      `Error in iframe: ${message}`,
      { source: source.src, details }
    );
    
    this.handle(error);
    
    // Emit iframe-specific error event if EventBus is available
    if (this.eventBus) {
      this.eventBus.emit('iframe:error', {
        source,
        error,
        timestamp: new Date()
      });
    }
  }
}
```

## Testing Iframe Errors

Testing iframe error handling requires special considerations:

```typescript
describe('Iframe Error Handling', () => {
  it('should handle postMessage errors from iframes', () => {
    // Setup
    const errorHandler = new ErrorHandler();
    const handleSpy = vi.spyOn(errorHandler, 'handle');
    
    // Create a mock message event
    const mockEvent = new MessageEvent('message', {
      data: {
        type: 'error',
        payload: {
          errorType: 'runtime',
          message: 'Test iframe error',
          details: { source: 'Desmos' }
        }
      },
      origin: 'https://www.desmos.com'
    });
    
    // Trigger the message event handler
    window.dispatchEvent(mockEvent);
    
    // Assert error was handled
    expect(handleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ErrorType.RUNTIME,
        message: expect.stringContaining('Test iframe error')
      })
    );
  });
});
```

## Debugging Iframe Errors

Special debugging techniques for iframe errors:

1. **Cross-Origin Debugging**: Use `document.domain` for same-domain subdomains
2. **Console Proxy**: Forward console logs from the iframe to the parent
3. **DevTools**: Use Chrome DevTools to inspect iframes directly
4. **Error Logs**: Maintain detailed error logs with iframe source information

## Conclusion

Properly handling errors across iframe boundaries is crucial for maintaining a robust user experience in the DevPreview UI application. By implementing consistent error messaging formats, validation of message origins, and appropriate recovery strategies, we can ensure that the application gracefully handles failures in iframe content while providing meaningful feedback to users and developers.