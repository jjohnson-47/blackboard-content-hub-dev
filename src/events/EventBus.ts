import { IEventBus, EventCallback } from './IEventBus';

/**
 * Event bus implementation for event-driven communication
 */
export class EventBus implements IEventBus {
  private listeners: Record<string, EventCallback[]> = {};
  
  /**
   * Register an event listener
   * @param event Event name
   * @param callback Function to execute when event is emitted
   * @returns Unsubscribe function
   */
  public on(event: string, callback: EventCallback): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    
    this.listeners[event].push(callback);
    
    return () => this.off(event, callback);
  }
  
  /**
   * Remove an event listener
   * @param event Event name
   * @param callback Callback function to remove
   */
  public off(event: string, callback: EventCallback): void {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    
    // Clean up empty listener arrays
    if (this.listeners[event].length === 0) {
      delete this.listeners[event];
    }
  }
  
  /**
   * Emit an event
   * @param event Event name
   * @param args Arguments to pass to listeners
   */
  public emit(event: string, ...args: any[]): void {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event listener for '${event}':`, error);
      }
    });
  }
  
  /**
   * Register a one-time event listener
   * @param event Event name
   * @param callback Function to execute once when event is emitted
   * @returns Unsubscribe function
   */
  public once(event: string, callback: EventCallback): () => void {
    const onceWrapper = (...args: any[]) => {
      unsubscribe();
      callback(...args);
    };
    
    const unsubscribe = this.on(event, onceWrapper);
    return unsubscribe;
  }
}