/**
 * Type for event callbacks with improved type safety
 */
export type EventCallback<T = any> = (data: T) => void;

/**
 * Enhanced event bus interface with improved type safety and additional functionality
 */
export interface IEnhancedEventBus {
  /**
   * Register an event listener with type safety
   * @param event Event name
   * @param callback Function to execute when event is emitted
   * @returns Unsubscribe function
   */
  on<T = any>(event: string, callback: EventCallback<T>): () => void;
  
  /**
   * Remove an event listener
   * @param event Event name
   * @param callback Callback function to remove
   */
  off<T = any>(event: string, callback: EventCallback<T>): void;
  
  /**
   * Emit an event with type safety
   * @param event Event name
   * @param data Data to pass to listeners
   */
  emit<T = any>(event: string, data: T): void;
  
  /**
   * Register a one-time event listener with type safety
   * @param event Event name
   * @param callback Function to execute once when event is emitted
   * @returns Unsubscribe function
   */
  once<T = any>(event: string, callback: EventCallback<T>): () => void;
  
  /**
   * Check if an event has any listeners
   * @param event Event name
   * @returns Boolean indicating if the event has listeners
   */
  hasListeners(event: string): boolean;
  
  /**
   * Get a list of all active event names
   * @returns Array of event names that have active listeners
   */
  getActiveEvents(): string[];
  
  /**
   * Enable or disable debug mode
   * When enabled, all events will be logged to console
   * @param enabled Whether debug mode should be enabled
   */
  setDebugMode(enabled: boolean): void;
}