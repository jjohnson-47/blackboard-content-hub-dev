# Error Handler Integration Patterns

## Overview

This document outlines recommended patterns for integrating the Error Handler system with other components of the DevPreview UI application. Consistent error handling across the application ensures a better developer experience and more reliable user experience.

## Core Integration Patterns

### 1. Dependency Injection

The Error Handler should be injected into components and services through the Service Container:

```typescript
// In Bootstrap.ts or similar initialization code
const errorHandler = new ErrorHandler();
serviceContainer.register('errorHandler', errorHandler);

// In a component or service
class SomeComponent {
  constructor(private errorHandler: IErrorHandler) {}
  
  // Component methods...
}

// When creating the component
const component = new SomeComponent(serviceContainer.get<IErrorHandler>('errorHandler'));
```

### 2. Try-Catch Pattern

Use try-catch blocks with the Error Handler for operations that might fail:

```typescript
class DataService {
  constructor(private errorHandler: IErrorHandler) {}
  
  async fetchData(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new AppError(
          ErrorType.NETWORK,
          `Failed to fetch data: ${response.status} ${response.statusText}`,
          { url, status: response.status }
        );
      }
      
      return await response.json();
    } catch (error) {
      this.errorHandler.handle(error);
      // Re-throw or return a default value depending on requirements
      throw error;
    }
  }
}
```

### 3. Error Propagation

Decide on a consistent approach to error propagation:

```typescript
// Option 1: Re-throw after handling (forces caller to handle or propagate)
async function riskyOperation(): Promise<Result> {
  try {
    // Operation that might fail
    return result;
  } catch (error) {
    this.errorHandler.handle(error);
    throw error; // Re-throw to propagate
  }
}

// Option 2: Return null/default value after handling (caller doesn't need to handle)
async function riskyOperation(): Promise<Result | null> {
  try {
    // Operation that might fail
    return result;
  } catch (error) {
    this.errorHandler.handle(error);
    return null; // Caller checks for null
  }
}

// Option 3: Return result object with success flag
async function riskyOperation(): Promise<{ success: boolean; data?: Result; error?: Error }> {
  try {
    // Operation that might fail
    return { success: true, data: result };
  } catch (error) {
    this.errorHandler.handle(error);
    return { success: false, error: error as Error };
  }
}
```

Choose the approach that best fits the specific component or operation context.

## Component-Specific Patterns

### UI Components

UI components should handle errors in a way that preserves the user experience:

```typescript
class EditorComponent {
  constructor(private errorHandler: IErrorHandler) {}
  
  saveContent(): void {
    try {
      // Save content logic
    } catch (error) {
      // Handle error but keep UI functional
      this.errorHandler.handle(error);
      this.showFallbackUI(); // Show appropriate UI feedback
    }
  }
  
  private showFallbackUI(): void {
    // Display appropriate fallback UI
  }
}
```

### Service Layer

Services should categorize errors appropriately:

```typescript
class StorageService {
  constructor(private errorHandler: IErrorHandler) {}
  
  saveData(key: string, data: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      // Categorize as storage error
      this.errorHandler.createAndHandle(
        ErrorType.STORAGE,
        `Failed to save data for key: ${key}`,
        { key, error }
      );
      return false;
    }
  }
}
```

### API Adapters

API adapters should provide detailed context for network errors:

```typescript
class ApiAdapter {
  constructor(private errorHandler: IErrorHandler) {}
  
  async fetchFromApi(endpoint: string, options?: RequestInit): Promise<any> {
    try {
      const response = await fetch(endpoint, options);
      
      if (!response.ok) {
        throw new AppError(
          ErrorType.NETWORK,
          `API request failed: ${response.status} ${response.statusText}`,
          { 
            endpoint, 
            status: response.status,
            statusText: response.statusText,
            options
          }
        );
      }
      
      return await response.json();
    } catch (error) {
      if (!(error instanceof AppError)) {
        // Convert to AppError if it's not already
        error = new AppError(
          ErrorType.NETWORK,
          `API request failed: ${error.message}`,
          { endpoint, options, originalError: error }
        );
      }
      
      this.errorHandler.handle(error);
      throw error; // Re-throw for the caller to handle
    }
  }
}
```

## Advanced Integration Patterns

### 1. Error Boundaries (for React-based UIs)

If using React, implement error boundaries that use the Error Handler:

```typescript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.errorHandler = props.errorHandler;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.errorHandler.handle(
      new AppError(ErrorType.RUNTIME, error.message, { 
        componentStack: errorInfo.componentStack 
      })
    );
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}
```

### 2. Async Error Handling

For async operations, ensure errors are properly caught and handled:

```typescript
// Using async/await
async function asyncOperation() {
  try {
    const result = await someAsyncFunction();
    return result;
  } catch (error) {
    errorHandler.handle(error);
    throw error;
  }
}

// Using promises
function promiseOperation() {
  return somePromiseFunction()
    .then(result => {
      return result;
    })
    .catch(error => {
      errorHandler.handle(error);
      throw error;
    });
}
```

### 3. Event-Based Error Reporting

For non-critical errors that shouldn't interrupt the flow, consider using the EventBus:

```typescript
class BackgroundService {
  constructor(
    private errorHandler: IErrorHandler,
    private eventBus: IEventBus
  ) {}
  
  startBackgroundSync(): void {
    setInterval(() => {
      this.sync().catch(error => {
        // Handle error
        this.errorHandler.handle(error);
        
        // Emit event for UI to show sync failed
        this.eventBus.emit('sync:failed', { error: error.message });
      });
    }, 30000);
  }
  
  private async sync(): Promise<void> {
    // Sync logic that might throw
  }
}
```

## Best Practices

1. **Be Specific**: Use the most specific error type possible to aid in debugging and monitoring.
2. **Include Context**: Always include relevant context in error details.
3. **Consistent Propagation**: Be consistent in how errors are propagated (re-throw or return null/default).
4. **User Experience**: Prioritize user experience by showing appropriate error messages and fallback UIs.
5. **Avoid Silent Failures**: Never silently catch errors without at least logging them.
6. **Centralized Handling**: Use the Error Handler for all errors, even if they're also handled locally.
7. **Graceful Degradation**: Design components to continue functioning (possibly with reduced capabilities) after non-critical errors.

## Anti-Patterns to Avoid

1. **Console-Only Logging**: Don't use `console.error` directly; always use the Error Handler.
2. **Empty Catch Blocks**: Never use empty catch blocks that swallow errors.
3. **Generic Error Messages**: Avoid generic error messages that don't provide context.
4. **Inconsistent Error Types**: Don't use inconsistent error types for similar errors.
5. **Excessive Error Details**: Don't include sensitive information in error details.

## Conclusion

Consistent integration of the Error Handler throughout the application ensures that errors are properly logged, reported, and handled. By following these patterns, we can create a more robust application with better developer and user experiences.