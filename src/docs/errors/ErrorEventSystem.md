# Error Event System Guide

## Overview

This guide explains how the Error Handler system integrates with the EventBus to create a comprehensive event-driven error handling system in the DevPreview UI application. Using events for error communication enables loosely-coupled components to respond to errors in a coordinated way.

## Standard Error Events

The Error Handler emits standardized events through the EventBus when errors occur:

| Event Name | Description | Payload |
|------------|-------------|---------|
| `error:occurred` | General error event emitted for all errors | Error details including type, message, and context |
| `error:network` | Network-related errors (API failures, etc.) | Network error details including URLs, status codes |
| `error:validation` | Input validation errors | Invalid input details and context |
| `error:iframe` | Errors occurring within iframes | Source iframe and error details |
| `error:factory` | Factory-related errors | Factory type and registration details |
| `error:component` | Component-specific errors | Component ID and error context |
| `error:recovery` | Error recovery attempts | Recovery strategy and status |

These events are defined in the `ErrorEventType` enum in the `ErrorHandler` implementation:

```typescript
export enum ErrorEventType {
  ERROR_OCCURRED = 'error:occurred',        // General error event
  COMPONENT_ERROR = 'error:component',      // Component-specific errors
  NETWORK_ERROR = 'error:network',          // Network-related errors
  VALIDATION_ERROR = 'error:validation',    // Validation errors
  IFRAME_ERROR = 'error:iframe',            // Iframe-specific errors
  FACTORY_ERROR = 'error:factory',          // Factory-related errors
  RECOVERY_ATTEMPT = 'error:recovery'       // Error recovery events
}
```

## Event Payload Structure

Error events follow a consistent payload structure:

```typescript
interface ErrorEventPayload {
  // The error type from ErrorType enum
  type: ErrorType;
  
  // Human-readable error message
  message: string;
  
  // Additional context (varies by error type)
  details?: any;
  
  // When the error occurred
  timestamp: Date;
  
  // Whether the error is recoverable (optional)
  recoverable?: boolean;
  
  // Source component or context (optional)
  source?: string;
}
```

## Implementing Error Event Listeners

Components can listen for error events to respond appropriately:

```typescript
/**
 * Example component that listens for error events
 */
export class PreviewComponent implements IPreview {
  private readonly errorHandler: IErrorHandler;
  private readonly eventBus: IEventBus;
  private readonly container: HTMLElement;
  private unsubscribeHandlers: Array<() => void> = [];
  
  constructor(
    container: HTMLElement,
    eventBus: IEventBus,
    errorHandler: IErrorHandler
  ) {
    this.container = container;
    this.eventBus = eventBus;
    this.errorHandler = errorHandler;
    
    // Subscribe to error events
    this.subscribeToErrorEvents();
  }
  
  private subscribeToErrorEvents(): void {
    // Listen for iframe-specific errors
    const unsubscribeIframeErrors = this.eventBus.on(
      ErrorEventType.IFRAME_ERROR,
      this.handleIframeError.bind(this)
    );
    
    // Listen for all errors (for logging/monitoring)
    const unsubscribeAllErrors = this.eventBus.on(
      ErrorEventType.ERROR_OCCURRED,
      this.logError.bind(this)
    );
    
    // Store unsubscribe functions for cleanup
    this.unsubscribeHandlers.push(unsubscribeIframeErrors, unsubscribeAllErrors);
  }
  
  private handleIframeError(payload: any): void {
    // Show fallback content when iframe errors occur
    this.showFallbackContent(payload.message);
    
    // Attempt recovery if possible
    if (payload.recoverable) {
      this.attemptRecovery(payload);
    }
  }
  
  private logError(payload: any): void {
    // Log all errors (could be used for analytics)
    console.debug('[PreviewComponent] Error detected:', payload);
  }
  
  private showFallbackContent(message: string): void {
    // Implementation for showing fallback content
    this.container.innerHTML = `
      <div class="error-container">
        <p class="error-message">${message}</p>
        <button class="retry-button">Retry</button>
      </div>
    `;
    
    // Add retry functionality
    const retryButton = this.container.querySelector('.retry-button');
    if (retryButton) {
      retryButton.addEventListener('click', this.reload.bind(this));
    }
  }
  
  private attemptRecovery(errorPayload: any): void {
    // Emit recovery event
    this.eventBus.emit(ErrorEventType.RECOVERY_ATTEMPT, {
      source: 'preview',
      errorType: errorPayload.type,
      strategy: 'reload',
      timestamp: new Date()
    });
    
    // Implement recovery logic
    // ...
  }
  
  private reload(): void {
    // Implementation for reloading preview content
    // ...
  }
  
  public dispose(): void {
    // Unsubscribe from all events
    this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    this.unsubscribeHandlers = [];
  }
}
```

## Broadcasting Error Events

Components can also broadcast errors through the event system:

```typescript
/**
 * Example of a component broadcasting errors
 */
export class EditorComponent implements IEditor {
  private readonly errorHandler: IErrorHandler;
  private readonly eventBus: IEventBus;
  
  constructor(
    container: HTMLElement,
    eventBus: IEventBus,
    errorHandler: IErrorHandler
  ) {
    this.eventBus = eventBus;
    this.errorHandler = errorHandler;
    // Other initialization...
  }
  
  public updateContent(content: string): void {
    try {
      // Attempt to update editor content
      this.validateContent(content);
      this.setContent(content);
    } catch (error) {
      // Handle the error through the error handler
      this.errorHandler.handle(error);
      
      // Optionally emit a component-specific error event
      this.eventBus.emit(ErrorEventType.COMPONENT_ERROR, {
        source: 'editor',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: { content },
        timestamp: new Date(),
        recoverable: true
      });
    }
  }
  
  private validateContent(content: string): void {
    // Validation logic that might throw errors
    if (!content) {
      throw new AppError(ErrorType.VALIDATION, 'Content cannot be empty');
    }
    
    // More validation...
  }
  
  private setContent(content: string): void {
    // Implementation...
  }
}
```

## Coordinated Error Recovery

The event system enables coordinated recovery strategies:

```typescript
/**
 * ErrorRecoveryCoordinator that listens for errors and coordinates recovery
 */
export class ErrorRecoveryCoordinator {
  private readonly eventBus: IEventBus;
  private readonly errorHandler: IErrorHandler;
  private unsubscribeHandlers: Array<() => void> = [];
  
  constructor(eventBus: IEventBus, errorHandler: IErrorHandler) {
    this.eventBus = eventBus;
    this.errorHandler = errorHandler;
    
    // Subscribe to error events
    this.subscribeToEvents();
  }
  
  private subscribeToEvents(): void {
    // Listen for all errors
    const unsubscribeErrors = this.eventBus.on(
      ErrorEventType.ERROR_OCCURRED,
      this.evaluateForRecovery.bind(this)
    );
    
    // Listen for recovery attempts
    const unsubscribeRecovery = this.eventBus.on(
      ErrorEventType.RECOVERY_ATTEMPT,
      this.logRecoveryAttempt.bind(this)
    );
    
    this.unsubscribeHandlers.push(unsubscribeErrors, unsubscribeRecovery);
  }
  
  private evaluateForRecovery(payload: any): void {
    // Determine if the error is recoverable
    const isRecoverable = this.isErrorRecoverable(payload);
    
    if (isRecoverable) {
      // Choose a recovery strategy
      const strategy = this.selectRecoveryStrategy(payload);
      
      // Execute the recovery strategy
      this.executeRecoveryStrategy(strategy, payload);
    }
  }
  
  private isErrorRecoverable(payload: any): boolean {
    // Logic to determine if the error is recoverable
    // For example, network errors might be recoverable through retries
    if (payload.type === ErrorType.NETWORK) {
      return true;
    }
    
    // Explicit recovery flag in the payload
    if (payload.recoverable === true) {
      return true;
    }
    
    return false;
  }
  
  private selectRecoveryStrategy(payload: any): string {
    // Logic to select an appropriate recovery strategy
    switch (payload.type) {
      case ErrorType.NETWORK:
        return 'retry';
      case ErrorType.VALIDATION:
        return 'fallback-input';
      case ErrorType.FACTORY:
        return 'use-default-factory';
      default:
        return 'reload';
    }
  }
  
  private executeRecoveryStrategy(strategy: string, errorPayload: any): void {
    // Notify the system of the recovery attempt
    this.eventBus.emit(ErrorEventType.RECOVERY_ATTEMPT, {
      originalError: errorPayload,
      strategy,
      timestamp: new Date()
    });
    
    // Execute the selected strategy
    switch (strategy) {
      case 'retry':
        // Retry the operation after a delay
        setTimeout(() => {
          this.eventBus.emit('retry:operation', {
            target: errorPayload.source,
            context: errorPayload.details
          });
        }, 1000);
        break;
      case 'reload':
        // Trigger a reload of the affected component
        this.eventBus.emit('reload:component', {
          target: errorPayload.source
        });
        break;
      // Other strategies...
    }
  }
  
  private logRecoveryAttempt(payload: any): void {
    console.log(`Recovery attempt: ${payload.strategy} for ${payload.originalError?.type || 'unknown error'}`);
  }
  
  public dispose(): void {
    // Unsubscribe from all events
    this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    this.unsubscribeHandlers = [];
  }
}
```

## Global Error State Management

The event system can be used to maintain a global error state:

```typescript
/**
 * ErrorStateManager maintains global error state and history
 */
export class ErrorStateManager {
  private readonly eventBus: IEventBus;
  private errors: Array<ErrorRecord> = [];
  private unsubscribeHandlers: Array<() => void> = [];
  
  constructor(eventBus: IEventBus) {
    this.eventBus = eventBus;
    
    // Subscribe to error events
    this.subscribeToEvents();
  }
  
  private subscribeToEvents(): void {
    // Listen for all errors
    const unsubscribeErrors = this.eventBus.on(
      ErrorEventType.ERROR_OCCURRED,
      this.recordError.bind(this)
    );
    
    // Listen for recovery attempts
    const unsubscribeRecovery = this.eventBus.on(
      ErrorEventType.RECOVERY_ATTEMPT,
      this.recordRecoveryAttempt.bind(this)
    );
    
    this.unsubscribeHandlers.push(unsubscribeErrors, unsubscribeRecovery);
  }
  
  private recordError(payload: any): void {
    // Create an error record
    const errorRecord: ErrorRecord = {
      id: this.generateId(),
      timestamp: payload.timestamp || new Date(),
      type: payload.type,
      message: payload.message,
      details: payload.details,
      source: payload.source,
      recoveryAttempts: []
    };
    
    // Add to error history
    this.errors.push(errorRecord);
    
    // Limit history size
    if (this.errors.length > 100) {
      this.errors.shift();
    }
    
    // Emit updated state
    this.emitStateUpdate();
  }
  
  private recordRecoveryAttempt(payload: any): void {
    // Find the error this recovery relates to
    const errorRecord = this.findErrorRecordForRecovery(payload);
    
    if (errorRecord) {
      // Record the recovery attempt
      errorRecord.recoveryAttempts.push({
        timestamp: payload.timestamp || new Date(),
        strategy: payload.strategy,
        successful: payload.successful
      });
      
      // Emit updated state
      this.emitStateUpdate();
    }
  }
  
  private findErrorRecordForRecovery(recoveryPayload: any): ErrorRecord | undefined {
    if (recoveryPayload.originalError?.id) {
      // If the recovery payload includes an error ID, use that
      return this.errors.find(err => err.id === recoveryPayload.originalError.id);
    }
    
    // Otherwise, find the most recent error from the same source
    if (recoveryPayload.source) {
      return [...this.errors]
        .reverse()
        .find(err => err.source === recoveryPayload.source);
    }
    
    // If all else fails, assume it's for the most recent error
    return this.errors[this.errors.length - 1];
  }
  
  private emitStateUpdate(): void {
    this.eventBus.emit('error:state-updated', {
      count: this.errors.length,
      latest: this.errors[this.errors.length - 1],
      hasActiveErrors: this.errors.length > 0
    });
  }
  
  public getErrorHistory(): ErrorRecord[] {
    return [...this.errors];
  }
  
  public clearHistory(): void {
    this.errors = [];
    this.emitStateUpdate();
  }
  
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  public dispose(): void {
    // Unsubscribe from all events
    this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    this.unsubscribeHandlers = [];
  }
}

/**
 * Error record structure
 */
interface ErrorRecord {
  id: string;
  timestamp: Date;
  type: ErrorType;
  message: string;
  details?: any;
  source?: string;
  recoveryAttempts: Array<{
    timestamp: Date;
    strategy: string;
    successful?: boolean;
  }>;
}
```

## Creating an Error Status UI Component

The error event system can drive error status UI components:

```typescript
/**
 * Error status component that displays current errors
 */
export class ErrorStatusComponent {
  private readonly container: HTMLElement;
  private readonly eventBus: IEventBus;
  private unsubscribeHandlers: Array<() => void> = [];
  
  constructor(container: HTMLElement, eventBus: IEventBus) {
    this.container = container;
    this.eventBus = eventBus;
    
    // Initialize UI
    this.initializeUI();
    
    // Subscribe to error state updates
    this.subscribeToEvents();
  }
  
  private initializeUI(): void {
    this.container.innerHTML = `
      <div class="error-status">
        <div class="error-indicator"></div>
        <div class="error-count">0</div>
        <div class="error-details hidden">
          <h3>Error Details</h3>
          <div class="error-list"></div>
          <button class="clear-errors">Clear All</button>
        </div>
      </div>
    `;
    
    // Add event listeners
    const indicator = this.container.querySelector('.error-indicator');
    if (indicator) {
      indicator.addEventListener('click', this.toggleErrorDetails.bind(this));
    }
    
    const clearButton = this.container.querySelector('.clear-errors');
    if (clearButton) {
      clearButton.addEventListener('click', this.clearErrors.bind(this));
    }
  }
  
  private subscribeToEvents(): void {
    // Listen for error state updates
    const unsubscribeState = this.eventBus.on(
      'error:state-updated',
      this.updateErrorDisplay.bind(this)
    );
    
    // Listen for new errors
    const unsubscribeErrors = this.eventBus.on(
      ErrorEventType.ERROR_OCCURRED,
      this.flashErrorIndicator.bind(this)
    );
    
    this.unsubscribeHandlers.push(unsubscribeState, unsubscribeErrors);
  }
  
  private updateErrorDisplay(state: any): void {
    // Update error count
    const countElement = this.container.querySelector('.error-count');
    if (countElement) {
      countElement.textContent = state.count.toString();
    }
    
    // Update error indicator
    const indicator = this.container.querySelector('.error-indicator');
    if (indicator) {
      indicator.classList.toggle('has-errors', state.hasActiveErrors);
    }
    
    // Update error list
    this.updateErrorList(state.latest);
  }
  
  private updateErrorList(latestError?: any): void {
    if (!latestError) return;
    
    const errorList = this.container.querySelector('.error-list');
    if (!errorList) return;
    
    // Add the latest error to the list
    const errorElement = document.createElement('div');
    errorElement.className = 'error-item';
    errorElement.innerHTML = `
      <div class="error-time">${this.formatTime(latestError.timestamp)}</div>
      <div class="error-message">${latestError.message}</div>
      <div class="error-source">${latestError.source || 'unknown'}</div>
    `;
    
    // Add to the list (newest at top)
    errorList.insertBefore(errorElement, errorList.firstChild);
    
    // Limit the number of displayed errors
    while (errorList.children.length > 10) {
      errorList.removeChild(errorList.lastChild!);
    }
  }
  
  private formatTime(date: Date): string {
    return date.toLocaleTimeString();
  }
  
  private flashErrorIndicator(): void {
    const indicator = this.container.querySelector('.error-indicator');
    if (indicator) {
      // Add a temporary flash class
      indicator.classList.add('flash');
      
      // Remove it after animation completes
      setTimeout(() => {
        indicator.classList.remove('flash');
      }, 1000);
    }
  }
  
  private toggleErrorDetails(): void {
    const details = this.container.querySelector('.error-details');
    if (details) {
      details.classList.toggle('hidden');
    }
  }
  
  private clearErrors(): void {
    // Emit event to clear error history
    this.eventBus.emit('error:clear-history');
    
    // Update UI
    const errorList = this.container.querySelector('.error-list');
    if (errorList) {
      errorList.innerHTML = '';
    }
    
    const countElement = this.container.querySelector('.error-count');
    if (countElement) {
      countElement.textContent = '0';
    }
    
    const indicator = this.container.querySelector('.error-indicator');
    if (indicator) {
      indicator.classList.remove('has-errors');
    }
  }
  
  public dispose(): void {
    // Unsubscribe from all events
    this.unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    this.unsubscribeHandlers = [];
    
    // Remove event listeners
    this.container.innerHTML = '';
  }
}
```

## Conclusion

The integration of the Error Handler with the EventBus creates a powerful, event-driven error handling system for the DevPreview UI application. This approach enables:

1. **Loose Coupling**: Components can respond to errors without direct dependencies
2. **Coordinated Recovery**: Multiple components can coordinate error recovery
3. **Centralized Monitoring**: Global error state can be maintained and displayed
4. **Extensibility**: New error handling behaviors can be added without modifying existing components

By using standard error events with consistent payload structures, the system ensures that errors are properly communicated throughout the application, leading to better error handling, improved user experience, and easier debugging.