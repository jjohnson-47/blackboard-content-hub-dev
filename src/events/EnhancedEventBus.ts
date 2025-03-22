import { IEnhancedEventBus, EventCallback } from './EnhancedIEventBus';
import { ErrorType, AppError, IErrorHandler } from '../errors/IErrorHandler';

/**
 * Enhanced event bus implementation with improved type safety and error handling
 */
export class EnhancedEventBus implements IEnhancedEventBus {
  private listeners: Record<string, EventCallback[]> = {};
  private debugMode: boolean = false;
  
  /**
   * Create a new EnhancedEventBus
   * @param errorHandler Optional error handler for error processing
   */
  constructor(private errorHandler?: IErrorHandler) {}
  
  /**
   * Register an event listener with type safety
   * @param event Event name
   * @param callback Function to execute when event is emitted
   * @returns Unsubscribe function
   */
  public on<T = any>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event].push(callback as EventCallback<any>);
    
    if (this.debugMode) {
      console.log(`[EventBus] Registered listener for: ${event}`);
    }
    
    return () => this.off(event, callback);
  }
  
  /**
   * Remove an event listener
   * @param event Event name
   * @param callback Callback function to remove
   */
  public off<T = any>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(
      cb => cb !== callback
    );
    
    // Clean up empty listener arrays
    if (this.listeners[event].length === 0) {
      delete this.listeners[event];
    }
    
    if (this.debugMode) {
      console.log(`[EventBus] Removed listener for: ${event}`);
    }
  }
  
  /**
   * Emit an event with type safety
   * @param event Event name
   * @param data Data to pass to listeners
   */
  public emit<T = any>(event: string, data: T): void {
    if (this.debugMode) {
      console.log(`[EventBus] Emitting event: ${event}`, data);
    }
    
    if (!this.listeners[event]) return;
    
    // Create a copy of the listeners array to prevent issues
    // if listeners are added or removed during emission
    const callbacks = [...this.listeners[event]];
    
    for (const callback of callbacks) {
      try {
        callback(data);
      } catch (error) {
        // Log the error
        console.error(`Error in event listener for '${event}':`, error);
        
        // Use error handler if available
        if (this.errorHandler) {
          // Create an AppError with appropriate type and details
          const appError = new AppError(
            ErrorType.RUNTIME,
            `Error in event listener for '${event}': ${error instanceof Error ? error.message : String(error)}`,
            {
              event,
              timestamp: new Date(),
              listenerCount: callbacks.length,
              originalError: error
            }
          );
          this.errorHandler.handle(appError);
        }
      }
    }
  }
  
  /**
   * Register a one-time event listener with type safety
   * @param event Event name
   * @param callback Function to execute once when event is emitted
   * @returns Unsubscribe function
   */
  public once<T = any>(event: string, callback: EventCallback<T>): () => void {
    const onceWrapper = (data: T) => {
      unsubscribe();
      callback(data);
    };
    
    const unsubscribe = this.on<T>(event, onceWrapper);
    
    if (this.debugMode) {
      console.log(`[EventBus] Registered one-time listener for: ${event}`);
    }
    
    return unsubscribe;
  }
  
  /**
   * Check if an event has any listeners
   * @param event Event name
   * @returns Boolean indicating if the event has listeners
   */
  public hasListeners(event: string): boolean {
    return !!(this.listeners[event] && this.listeners[event].length > 0);
  }
  
  /**
   * Get a list of all active event names
   * @returns Array of event names that have active listeners
   */
  public getActiveEvents(): string[] {
    return Object.keys(this.listeners);
  }
  
  /**
   * Enable or disable debug mode
   * When enabled, all events will be logged to console
   * @param enabled Whether debug mode should be enabled
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    console.log(`[EventBus] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Get the number of listeners for a specific event
   * @param event Event name
   * @returns Number of listeners for the event
   */
  public getListenerCount(event: string): number {
    return this.listeners[event]?.length || 0;
  }
  
  /**
   * Clear all listeners for a specific event
   * @param event Event name
   */
  public clearEvent(event: string): void {
    if (this.listeners[event]) {
      delete this.listeners[event];
      
      if (this.debugMode) {
        console.log(`[EventBus] Cleared all listeners for: ${event}`);
      }
    }
  }
  
  /**
   * Clear all listeners for all events
   */
  public clearAllEvents(): void {
    this.listeners = {};
    
    if (this.debugMode) {
      console.log('[EventBus] Cleared all events and listeners');
    }
  }
}