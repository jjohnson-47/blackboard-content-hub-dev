import { IErrorHandler, ErrorType, AppError } from './IErrorHandler';
import { IEventBus } from '../events/IEventBus';

/**
 * Standard error event names
 */
export enum ErrorEventType {
  ERROR_OCCURRED = 'error:occurred',        // General error event
  COMPONENT_ERROR = 'error:component',      // Component-specific errors
  NETWORK_ERROR = 'error:network',          // Network-related errors
  VALIDATION_ERROR = 'error:validation',    // Validation errors
  IFRAME_ERROR = 'error:iframe',            // Iframe-specific errors
  FACTORY_ERROR = 'error:factory',          // Factory-related errors
  MATH_API_ERROR = 'error:math-api',        // Math API-related errors
  RECOVERY_ATTEMPT = 'error:recovery'       // Error recovery events
}

/**
 * Error handler implementation
 */
export class ErrorHandler implements IErrorHandler {
  private readonly toast: any;
  private readonly eventBus?: IEventBus;
  
  /**
   * Creates a new ErrorHandler instance
   * @param toast Optional toast notification service
   * @param eventBus Optional event bus for broadcasting errors
   */
  constructor(toast?: any, eventBus?: IEventBus) {
    this.toast = toast;
    this.eventBus = eventBus;
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
    
    // Broadcast error event if EventBus is available
    if (this.eventBus) {
      // Emit a general error event
      this.eventBus.emit(ErrorEventType.ERROR_OCCURRED, {
        type: appError.type,
        message: appError.message,
        details: appError.details,
        timestamp: new Date()
      });
      
      // Emit a type-specific error event
      this.emitTypedErrorEvent(appError);
    }
    
    // Optional: report error to monitoring service
    this.reportError(appError);
  }
  
  /**
   * Handle errors that occur within iframes
   * @param source The iframe element or source identifier
   * @param message Error message
   * @param details Optional error details
   */
  public handleIframeError(
    source: HTMLIFrameElement | string,
    message: string,
    details?: any
  ): void {
    const sourceIdentifier = typeof source === 'string'
      ? source
      : source.src || 'unknown-iframe';
      
    const error = new AppError(
      ErrorType.RUNTIME,
      `Error in iframe: ${message}`,
      { source: sourceIdentifier, ...details }
    );
    
    this.handle(error);
    
    // Emit iframe-specific error event
    if (this.eventBus) {
      this.eventBus.emit(ErrorEventType.IFRAME_ERROR, {
        source: sourceIdentifier,
        message,
        details,
        timestamp: new Date()
      });
    }
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
   * Emits a typed error event based on the error type
   * @param error The AppError to emit an event for
   * @private
   */
  private emitTypedErrorEvent(error: AppError): void {
    if (!this.eventBus) return;

    // Map error type to specific event type
    let eventType: string;
    switch (error.type) {
      case ErrorType.NETWORK:
        eventType = ErrorEventType.NETWORK_ERROR;
        break;
      case ErrorType.VALIDATION:
        eventType = ErrorEventType.VALIDATION_ERROR;
        break;
      case ErrorType.FACTORY:
      case ErrorType.FACTORY_REGISTRATION:
      case ErrorType.COMPONENT_CREATION:
        eventType = ErrorEventType.FACTORY_ERROR;
        break;
      default:
        // For other types, we already emitted the general error event
        return;
    }

    // Emit the type-specific event
    this.eventBus.emit(eventType, {
      type: error.type,
      message: error.message,
      details: error.details,
      timestamp: new Date()
    });
  }
/**
 * Handle errors that occur within math API integrations
 * @param apiType The math API type (e.g., 'desmos', 'geogebra')
 * @param message Error message
 * @param details Optional error details
 */
public handleMathApiError(
  apiType: string,
  message: string,
  details?: any
): void {
  const error = new AppError(
    ErrorType.MATH_API,
    `Error in ${apiType} API: ${message}`,
    { apiType, ...details }
  );
  
  this.handle(error);
  
  // Emit math API-specific error event
  if (this.eventBus) {
    this.eventBus.emit(ErrorEventType.MATH_API_ERROR, {
      apiType,
      message,
      details,
      timestamp: new Date()
    });
  }
}

/**
 * Attempt to recover from an error
 * @param errorType The type of error to recover from
 * @param context Recovery context information
 * @returns True if recovery was attempted
 */
public attemptRecovery(errorType: ErrorType, context: any): boolean {
  if (this.eventBus) {
    this.eventBus.emit(ErrorEventType.RECOVERY_ATTEMPT, {
      errorType,
      context,
      timestamp: new Date()
    });
    return true;
  }
  return false;
}

/**
 * Report error to monitoring service
 * @param error Error to report
 * @private
 */
private reportError(error: AppError): void {
  // Implement error reporting logic (e.g., to Sentry, LogRocket, etc.)
  // This is a placeholder for future implementation
  
  // Example implementation (commented out):
  // if (typeof window !== 'undefined' && (window as any).Sentry) {
  //   (window as any).Sentry.captureException(error);
  // }
}
}