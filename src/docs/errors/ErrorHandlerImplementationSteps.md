# Error Handler Implementation Steps

## Overview

This document provides a step-by-step guide for implementing the Error Handler system in the DevPreview UI application. It follows the co-located interfaces pattern and ensures proper integration with other components.

## Prerequisites

Before implementing the Error Handler, ensure:

1. The project structure is set up according to the master plan
2. Basic TypeScript configuration is in place
3. Testing infrastructure (Vitest) is configured

## Implementation Steps

### Step 1: Create the Error Handler Interface

Create the file `src/errors/IErrorHandler.ts`:

```typescript
/**
 * Error types for categorizing application errors
 */
export enum ErrorType {
  INITIALIZATION = 'initialization',
  NETWORK = 'network',
  STORAGE = 'storage',
  VALIDATION = 'validation',
  RUNTIME = 'runtime',
  
  // Factory-related error types
  FACTORY = 'factory',
  FACTORY_REGISTRATION = 'factory-registration',
  COMPONENT_CREATION = 'component-creation'
}

/**
 * Application-specific error class that extends the standard Error
 */
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Interface for the error handling system
 */
export interface IErrorHandler {
  /**
   * Handles application errors
   * @param error The error to handle (either a standard Error or AppError)
   */
  handle(error: Error | AppError): void;
  
  /**
   * Creates and handles an application error
   * @param type Error type
   * @param message Error message
   * @param details Optional error details
   */
  createAndHandle(type: ErrorType, message: string, details?: any): void;
}
```

### Step 2: Implement the Error Handler

Create the file `src/errors/ErrorHandler.ts`:

```typescript
import { IErrorHandler, ErrorType, AppError } from './IErrorHandler';

/**
 * Error handler implementation
 */
export class ErrorHandler implements IErrorHandler {
  private readonly toast: any;
  
  /**
   * Creates a new ErrorHandler instance
   * @param toast Optional toast notification service
   */
  constructor(toast?: any) {
    this.toast = toast;
  }
  
  /**
   * Handle an application error
   * @param error Error instance to handle
   */
  public handle(error: Error | AppError): void {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(ErrorType.RUNTIME, error.message);
    
    console.error(`[${appError.type}] ${appError.message}`, appError.details);
    // Present user-friendly error if Toast is available
    if (this.toast) {
      this.toast.error('Error', appError.message);
    } else if (typeof window !== 'undefined' && (window as any).Toast) {
      // Use global Toast if available and not injected
      (window as any).Toast.error('Error', appError.message);
    }
    
    // Optional: report error to monitoring service
    this.reportError(appError);
  }
  
  /**
   * Create and handle an application error
   * @param type Error type
   * @param message Error message
   * @param details Optional error details
   */
  public createAndHandle(type: ErrorType, message: string, details?: any): void {
    const error = new AppError(type, message, details);
    this.handle(error);
  }
  
  /**
   * Report error to monitoring service
   * @param error Error to report
   * @private
   */
  private reportError(error: AppError): void {
    // Implement error reporting logic (e.g., to Sentry, LogRocket, etc.)
    // This is a placeholder for future implementation
  }
}
```

### Step 3: Create Unit Tests

Create the file `src/errors/__tests__/ErrorHandler.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandler } from '../ErrorHandler';
import { AppError, ErrorType } from '../IErrorHandler';

describe('ErrorHandler', () => {
  const originalConsoleError = console.error;
  let mockConsoleError: any;
  
  beforeEach(() => {
    mockConsoleError = vi.fn();
    console.error = mockConsoleError;
    
    // Mock window.Toast if needed for tests
    if (typeof window !== 'undefined') {
      (window as any).Toast = {
        error: vi.fn()
      };
    }
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
    
    // Clean up Toast mock
    if (typeof window !== 'undefined') {
      delete (window as any).Toast;
    }
  });
  
  it('should handle AppError correctly', () => {
    // Arrange
    const errorHandler = new ErrorHandler();
    const appError = new AppError(ErrorType.VALIDATION, 'Invalid input', { field: 'username' });
    
    // Act
    errorHandler.handle(appError);
    
    // Assert
    expect(mockConsoleError).toHaveBeenCalledWith(
      '[validation] Invalid input', 
      { field: 'username' }
    );
  });
  
  it('should convert regular Error to AppError', () => {
    // Arrange
    const errorHandler = new ErrorHandler();
    const standardError = new Error('Something went wrong');
    
    // Act
    errorHandler.handle(standardError);
    
    // Assert
    expect(mockConsoleError).toHaveBeenCalledWith(
      '[runtime] Something went wrong', 
      undefined
    );
  });
  
  it('should create and handle an error', () => {
    // Arrange
    const errorHandler = new ErrorHandler();
    const spy = vi.spyOn(errorHandler, 'handle');
    
    // Act
    errorHandler.createAndHandle(ErrorType.NETWORK, 'Failed to fetch data', { status: 404 });
    
    // Assert
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ErrorType.NETWORK,
        message: 'Failed to fetch data',
        details: { status: 404 }
      })
    );
  });
});
```

### Step 4: Create a Barrel File

Create the file `src/errors/index.ts`:

```typescript
export * from './IErrorHandler';
export * from './ErrorHandler';
```

### Step 5: Register in Service Container

Update the Service Container registration code (typically in `src/core/Bootstrap.ts`):

```typescript
import { ServiceContainer } from './ServiceContainer';
import { ErrorHandler } from '../errors/ErrorHandler';

export function bootstrap(): void {
  const container = new ServiceContainer();
  
  // Register error handler
  container.register('errorHandler', new ErrorHandler());
  
  // Register other services...
}
```

### Step 6: Update Main Index Exports

Update the main index file (`src/index.ts`) to export the Error Handler:

```typescript
// Core framework exports
export * from './core/ServiceContainer';
// ... other exports

// Error handling exports
export * from './errors';
```

### Step 7: Document Usage Patterns

Create documentation for the Error Handler in `src/docs/errors/` directory:

1. Create `ErrorHandler.md` with design details
2. Create `ErrorHandlerADR.md` with architectural decision record
3. Create `ErrorHandlerTestingStrategy.md` with testing approach
4. Create `ErrorHandlerIntegrationPatterns.md` with integration patterns
5. Create `README.md` as an index for all error handling documentation

## Integration Examples

### Example 1: Using in a Component

```typescript
import { IErrorHandler } from '../errors/IErrorHandler';

export class Editor {
  constructor(private errorHandler: IErrorHandler) {}
  
  saveContent(): void {
    try {
      // Save content logic
    } catch (error) {
      this.errorHandler.handle(error);
    }
  }
}
```

### Example 2: Using in a Service

```typescript
import { IErrorHandler, ErrorType } from '../errors/IErrorHandler';

export class StorageService {
  constructor(private errorHandler: IErrorHandler) {}
  
  saveData(key: string, data: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
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

## Verification Steps

After implementation, verify:

1. Unit tests pass for the Error Handler
2. Error Handler can be registered in the Service Container
3. Components can use the Error Handler through dependency injection
4. Errors are properly logged to the console
5. User-facing error messages appear when a toast service is provided

## Next Steps

After implementing the Error Handler:

1. Implement the Storage Service (which will use the Error Handler)
2. Implement the API Service (which will use the Error Handler)
3. Implement UI components that use the Error Handler

## Conclusion

The Error Handler is a foundational component of the DevPreview UI architecture. By implementing it early and ensuring it's properly integrated with other components, you'll establish a consistent error handling pattern throughout the application.
