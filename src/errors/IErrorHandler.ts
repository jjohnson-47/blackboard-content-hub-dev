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
  COMPONENT_CREATION = 'component-creation',
  
  // Math API-related error type
  MATH_API = 'math-api'
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
  
  /**
   * Handle errors that occur within iframes
   * @param source The iframe element or source identifier
   * @param message Error message
   * @param details Optional error details
   */
  handleIframeError(source: HTMLIFrameElement | string, message: string, details?: any): void;
  
  /**
   * Handle errors that occur within math API integrations
   * @param apiType The math API type (e.g., 'desmos', 'geogebra')
   * @param message Error message
   * @param details Optional error details
   */
  handleMathApiError(apiType: string, message: string, details?: any): void;
  
  /**
   * Attempt to recover from an error
   * @param errorType The type of error to recover from
   * @param context Recovery context information
   * @returns True if recovery was attempted
   */
  attemptRecovery(errorType: ErrorType, context: any): boolean;
}