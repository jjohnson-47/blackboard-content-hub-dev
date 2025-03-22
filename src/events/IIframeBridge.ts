import { IEnhancedEventBus } from './EnhancedIEventBus';

/**
 * Message type for iframe communication
 * Defines the structure of messages passed between parent and iframes
 */
export interface IframeMessage {
  /** Message type identifier */
  type: string;
  
  /** Message payload data */
  payload: any;
  
  /** Optional correlation ID for request/response pattern */
  correlationId?: string;
  
  /** Source identifier */
  source: 'parent' | 'iframe';
  
  /** Optional target if multiple iframes are present */
  target?: string;
}

/**
 * Interface for bridge between EventBus and iframe postMessage communication
 */
export interface IIframeBridge {
  /**
   * Initialize the bridge and start listening for messages
   */
  initialize(): void;
  
  /**
   * Send an event to a specific iframe
   * @param iframe The target iframe element
   * @param event The event name
   * @param data The event data
   */
  sendEventToIframe(iframe: HTMLIFrameElement, event: string, data: any): void;
  
  /**
   * Sends a request to the iframe and returns a promise for the response
   * @param iframe The target iframe
   * @param requestType The request type
   * @param data The request payload
   * @returns Promise resolving to the response
   */
  requestFromIframe<T = any>(
    iframe: HTMLIFrameElement,
    requestType: string,
    data: any
  ): Promise<T>;
  
  /**
   * Set allowed origins for security validation
   * @param origins Array of allowed origins
   */
  setAllowedOrigins(origins: string[]): void;
  
  /**
   * Add an allowed origin to the existing list
   * @param origin Origin to add to allowed list
   */
  addAllowedOrigin(origin: string): void;
  
  /**
   * Stop listening for messages and clean up resources
   */
  dispose(): void;
  
  /**
   * Check if an origin is in the allowed list
   * @param origin Origin to check
   * @returns Whether the origin is allowed
   */
  isAllowedOrigin(origin: string): boolean;
}