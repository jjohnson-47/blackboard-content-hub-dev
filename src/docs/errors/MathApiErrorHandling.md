# Math API Error Handling Guide

## Overview

This guide provides specialized error handling strategies for math visualization tool integrations in the DevPreview UI application. Since our application integrates with various math APIs (Desmos, GeoGebra, etc.), properly handling API-specific errors is crucial for a robust user experience.

## Common Math API Error Types

Math visualization APIs typically produce the following categories of errors:

1. **Initialization Errors**: Failures during API loading or initialization
2. **Expression Parsing Errors**: Invalid mathematical expressions or syntax
3. **Calculation Errors**: Runtime errors during computation (division by zero, etc.)
4. **Rendering Errors**: Failures to display visualizations properly
5. **Resource Limitation Errors**: Exceeding memory, computation time, or complexity limits
6. **Network Errors**: Connection failures when API is hosted remotely

## Desmos API Error Handling

### Common Desmos Error Patterns

Desmos Calculator API (v1.x) typically produces errors in these contexts:

```typescript
// Initialization errors
try {
  const calculator = Desmos.GraphingCalculator(element, options);
} catch (error) {
  errorHandler.createAndHandle(
    ErrorType.INITIALIZATION,
    'Failed to initialize Desmos calculator',
    { 
      element: element.id, 
      options, 
      originalError: error.message 
    }
  );
}

// Expression parsing errors
try {
  calculator.setExpression({ id: 'graph1', latex: userInput });
} catch (error) {
  errorHandler.createAndHandle(
    ErrorType.VALIDATION,
    'Invalid mathematical expression',
    { 
      latex: userInput, 
      originalError: error.message 
    }
  );
}
```

### Desmos API-Specific Error Handler

Create an adapter to handle Desmos-specific errors:

```typescript
/**
 * Handles errors specific to the Desmos API
 */
export class DesmosErrorHandler {
  constructor(private errorHandler: IErrorHandler) {}

  /**
   * Handles Desmos expression errors
   * @param expressionError The error from Desmos
   * @param expression The original expression
   */
  handleExpressionError(expressionError: any, expression: string): void {
    // Desmos error schema varies, but typically includes:
    // - error.message: The error message
    // - error.type: The error type
    // - error.details: Additional context

    let errorType = ErrorType.VALIDATION;
    let details = { expression };

    // Classify the error based on its properties
    if (expressionError.type === 'domain-error') {
      errorType = ErrorType.RUNTIME;
      details = { 
        ...details, 
        errorType: 'domain-error', 
        recoverable: true 
      };
    } else if (expressionError.message?.includes('syntax')) {
      details = { 
        ...details, 
        errorType: 'syntax-error',
        position: expressionError.position // If available
      };
    }

    this.errorHandler.createAndHandle(
      errorType,
      this.formatDesmosErrorMessage(expressionError),
      details
    );
  }

  /**
   * Creates a user-friendly error message from Desmos error objects
   * @param error The Desmos error object
   * @returns Formatted error message
   */
  private formatDesmosErrorMessage(error: any): string {
    // Desmos provides technical error messages - make them user-friendly
    if (error.message?.includes('division by zero')) {
      return 'Cannot divide by zero';
    } else if (error.message?.includes('undefined')) {
      return 'Expression contains undefined values';
    } else if (error.message?.includes('syntax')) {
      return 'Invalid mathematical syntax';
    }
    
    return error.message || 'Error in mathematical expression';
  }
}
```

## GeoGebra API Error Handling

### Common GeoGebra Error Patterns

GeoGebra API errors typically occur during:

```typescript
// Command execution errors
try {
  applet.evalCommand(userCommand);
} catch (error) {
  errorHandler.createAndHandle(
    ErrorType.VALIDATION,
    'Invalid GeoGebra command',
    { 
      command: userCommand, 
      originalError: error.message 
    }
  );
}

// Construction errors
try {
  const pointA = applet.evalCommandGetLabels('A = (1,2)');
  const pointB = applet.evalCommandGetLabels('B = (3,4)');
  applet.evalCommand(`Line[${pointA}, ${pointB}]`);
} catch (error) {
  errorHandler.createAndHandle(
    ErrorType.RUNTIME,
    'Could not create geometric construction',
    { 
      points: [pointA, pointB],
      originalError: error.message 
    }
  );
}
```

### GeoGebra-Specific Error Handling

```typescript
/**
 * Handles errors specific to the GeoGebra API
 */
export class GeoGebraErrorHandler {
  constructor(private errorHandler: IErrorHandler) {}
  
  /**
   * Handles GeoGebra command errors
   * @param commandError The error from GeoGebra
   * @param command The original command
   */
  handleCommandError(commandError: any, command: string): void {
    let errorType = ErrorType.VALIDATION;
    let errorMessage = 'Invalid GeoGebra command';
    let details = { command };
    
    // GeoGebra errors are often generic - try to categorize based on message
    if (commandError.message?.includes('undefined')) {
      errorType = ErrorType.VALIDATION;
      errorMessage = 'Command uses undefined objects';
    } else if (commandError.message?.includes('syntax')) {
      errorType = ErrorType.VALIDATION;
      errorMessage = 'Command has incorrect syntax';
    } else if (commandError.message?.includes('exists')) {
      errorType = ErrorType.VALIDATION;
      errorMessage = 'Object with that name already exists';
    } else {
      errorType = ErrorType.RUNTIME;
    }
    
    this.errorHandler.createAndHandle(
      errorType,
      errorMessage,
      details
    );
  }
}
```

## Generic Math API Error Handling

For consistent error handling across math APIs, implement a common adapter pattern:

```typescript
/**
 * Interface for math API error handlers
 */
export interface IMathApiErrorHandler {
  handleExpressionError(error: any, expression: string): void;
  handleRuntimeError(error: any, context: any): void;
  handleInitializationError(error: any, config: any): void;
}

/**
 * Factory to create API-specific error handlers
 */
export class MathApiErrorHandlerFactory {
  constructor(private errorHandler: IErrorHandler) {}
  
  /**
   * Create an appropriate error handler for the given API type
   * @param apiType The type of math API ('desmos', 'geogebra', etc.)
   * @returns API-specific error handler
   */
  createErrorHandler(apiType: string): IMathApiErrorHandler {
    switch (apiType.toLowerCase()) {
      case 'desmos':
        return new DesmosErrorHandler(this.errorHandler);
      case 'geogebra':
        return new GeoGebraErrorHandler(this.errorHandler);
      default:
        // Return a generic handler for unknown APIs
        return new GenericMathApiErrorHandler(this.errorHandler);
    }
  }
}
```

## Error Recovery Strategies

### Fallback Visualizations

When a math API fails to render, provide fallback visualizations:

```typescript
/**
 * Creates a fallback visualization when the main API fails
 */
function createFallbackVisualization(container: HTMLElement, expression: string): void {
  // Clear the container
  container.innerHTML = '';
  
  // Create fallback UI
  const fallbackEl = document.createElement('div');
  fallbackEl.className = 'fallback-visualization';
  
  // Add error message
  const messageEl = document.createElement('p');
  messageEl.textContent = 'Unable to display the visualization.';
  fallbackEl.appendChild(messageEl);
  
  // Add expression display
  const expressionEl = document.createElement('code');
  expressionEl.textContent = expression;
  fallbackEl.appendChild(expressionEl);
  
  // Add retry button
  const retryButton = document.createElement('button');
  retryButton.textContent = 'Retry';
  retryButton.addEventListener('click', () => {
    try {
      // Attempt to initialize the API again
      initializeMathApi(container, expression);
    } catch (error) {
      errorHandler.handle(error);
    }
  });
  fallbackEl.appendChild(retryButton);
  
  // Add to container
  container.appendChild(fallbackEl);
}
```

### Expression Auto-Correction

For minor syntax errors, implement auto-correction:

```typescript
/**
 * Attempts to correct common syntax errors in mathematical expressions
 * @param expression The original expression
 * @returns Corrected expression or null if unable to correct
 */
function attemptExpressionCorrection(expression: string): string | null {
  // Common corrections
  const corrections = [
    // Missing multiplication signs
    { pattern: /(\d)([a-zA-Z(])/g, replacement: '$1*$2' },
    // Missing closing parentheses
    { pattern: /\(([^()]*[^()])\)?$/g, replacement: '($1)' },
    // Extra closing parentheses
    { pattern: /\)([^()]*)\)/g, replacement: ')$1' }
  ];
  
  // Apply each correction
  let correctedExpression = expression;
  for (const correction of corrections) {
    correctedExpression = correctedExpression.replace(
      correction.pattern,
      correction.replacement
    );
  }
  
  // Return corrected expression if it was modified
  return correctedExpression !== expression ? correctedExpression : null;
}
```

## User Feedback Strategies

### Error Visualization

Present errors visually within the mathematical context:

```typescript
/**
 * Highlights the error position in an expression
 * @param container The container element
 * @param expression The expression with error
 * @param position Error position (if available)
 */
function highlightExpressionError(
  container: HTMLElement, 
  expression: string, 
  position?: number
): void {
  const errorDisplay = document.createElement('div');
  errorDisplay.className = 'expression-error';
  
  // If we have the error position, highlight it
  if (position !== undefined && position >= 0) {
    const before = expression.substring(0, position);
    const errorChar = expression.charAt(position);
    const after = expression.substring(position + 1);
    
    errorDisplay.innerHTML = `
      <code>${before}<span class="error-highlight">${errorChar}</span>${after}</code>
      <div class="error-pointer" style="left: ${position + 0.5}em;"></div>
    `;
  } else {
    // Otherwise just show the expression
    errorDisplay.innerHTML = `<code>${expression}</code>`;
  }
  
  container.appendChild(errorDisplay);
}
```

### Smart Error Messages

Provide context-aware error messages for math errors:

```typescript
/**
 * Creates a context-aware error message for mathematical errors
 * @param error The error object
 * @param expression The expression that caused the error
 * @returns User-friendly error message
 */
function getSmartErrorMessage(error: any, expression: string): string {
  // Check for common mathematical errors
  if (expression.includes('/0')) {
    return 'Division by zero is not allowed.';
  } else if (/\w+\(/.test(expression) && error.message?.includes('undefined')) {
    return 'The function you\'re trying to use is not defined.';
  } else if (expression.includes('√') && /[-]/.test(expression)) {
    return 'Cannot take the square root of a negative number in the real number system.';
  } else if (error.message?.includes('parentheses')) {
    return 'Check your parentheses - they may be unbalanced.';
  }
  
  return error.message || 'There was an error in your mathematical expression.';
}
```

## Testing Math API Error Handling

### Mock Math APIs

Create mock versions of math APIs for testing:

```typescript
/**
 * Creates a mock Desmos API for testing error scenarios
 */
export function createMockDesmosApi() {
  return {
    setExpression(options: { id: string, latex: string }) {
      // Simulate various error conditions
      if (options.latex.includes('/0')) {
        throw new Error('Division by zero');
      } else if (options.latex.includes('√(-')) {
        throw new Error('Domain error');
      } else if (options.latex.includes('sin(')) {
        // Success case
        return true;
      } else {
        throw new Error('Syntax error');
      }
    },
    // More mock methods...
  };
}
```

### Error Scenario Testing

Test various error scenarios:

```typescript
describe('Math API Error Handling', () => {
  it('should properly handle division by zero errors', async () => {
    // Arrange
    const mockDesmos = createMockDesmosApi();
    const errorHandler = new ErrorHandler();
    const handleSpy = vi.spyOn(errorHandler, 'handle');
    const desmosHandler = new DesmosErrorHandler(errorHandler);
    
    // Act
    try {
      mockDesmos.setExpression({ id: 'test', latex: '1/0' });
    } catch (error) {
      desmosHandler.handleExpressionError(error, '1/0');
    }
    
    // Assert
    expect(handleSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ErrorType.RUNTIME,
        message: 'Cannot divide by zero'
      })
    );
  });
});
```

## Conclusion

Implementing specialized error handling for math APIs is essential for a robust DevPreview UI application. By using API-specific error handlers, creating appropriate recovery strategies, and providing meaningful feedback to users, we can ensure that errors in mathematical computations don't degrade the overall user experience.

The approaches outlined in this guide should be integrated with the central ErrorHandler system, leveraging the EventBus for communicating errors to other components of the application. This ensures a consistent error handling pattern while addressing the unique challenges of math visualization tools.