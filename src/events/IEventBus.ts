/**
 * Callback type for event listeners
 */
export type EventCallback = (...args: any[]) => void;

/**
 * Event bus interface for event-driven communication
 */
export interface IEventBus {
  /**
   * Register an event listener
   * @param event Event name
   * @param callback Function to execute when event is emitted
   * @returns Unsubscribe function
   */
  on(event: string, callback: EventCallback): () => void;
  
  /**
   * Remove an event listener
   * @param event Event name
   * @param callback Callback function to remove
   */
  off(event: string, callback: EventCallback): void;
  
  /**
   * Emit an event
   * @param event Event name
   * @param args Arguments to pass to listeners
   */
  emit(event: string, ...args: any[]): void;
  
  /**
   * Register a one-time event listener
   * @param event Event name
   * @param callback Function to execute once when event is emitted
   * @returns Unsubscribe function
   */
  once(event: string, callback: EventCallback): () => void;
}