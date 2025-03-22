/**
 * Factory system event constants
 * These events are published through the event bus during factory operations
 */
export const FACTORY_EVENTS = {
  /**
   * Emitted when a component is successfully created
   * Event data: { type: string, id: string, factoryId: string, timestamp: number }
   */
  COMPONENT_CREATED: 'component:created',
  
  /**
   * Emitted when component creation fails
   * Event data: { type: string, factoryId: string, error: Error | string, timestamp: number }
   */
  COMPONENT_CREATE_FAILED: 'component:createFailed',
  
  /**
   * Emitted when a factory is registered
   * Event data: { type: string, factoryId: string, timestamp: number }
   */
  FACTORY_REGISTERED: 'factory:registered',
  
  /**
   * Emitted when factory registration fails
   * Event data: { factoryInfo: string, error: Error | string, timestamp: number }
   */
  FACTORY_REGISTRATION_FAILED: 'factory:registrationFailed'
};

/**
 * Component created event data interface
 */
export interface ComponentCreatedEvent {
  /**
   * Component type (e.g., 'editor', 'preview')
   */
  type: string;
  
  /**
   * DOM container ID
   */
  id: string;
  
  /**
   * Factory implementation ID
   */
  factoryId: string;
  
  /**
   * Creation timestamp
   */
  timestamp: number;
  
  /**
   * Optional additional properties
   */
  [key: string]: any;
}

/**
 * Component creation failed event data interface
 */
export interface ComponentCreateFailedEvent {
  /**
   * Component type (e.g., 'editor', 'preview')
   */
  type: string;
  
  /**
   * Factory implementation ID
   */
  factoryId: string;
  
  /**
   * Error that caused the failure
   */
  error: Error | string;
  
  /**
   * Failure timestamp
   */
  timestamp: number;
  
  /**
   * Optional additional properties
   */
  [key: string]: any;
}

/**
 * Factory registered event data interface
 */
export interface FactoryRegisteredEvent {
  /**
   * Component type (e.g., 'editor', 'preview')
   */
  type: string;
  
  /**
   * Factory implementation ID
   */
  factoryId: string;
  
  /**
   * Registration timestamp
   */
  timestamp: number;
}

/**
 * Factory registration failed event data interface
 */
export interface FactoryRegistrationFailedEvent {
  /**
   * Factory information (type:id)
   */
  factoryInfo: string;
  
  /**
   * Error that caused the failure
   */
  error: Error | string;
  
  /**
   * Failure timestamp
   */
  timestamp: number;
}