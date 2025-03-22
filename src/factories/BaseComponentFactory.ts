import { IComponentFactory } from './IComponentFactory';
import { IServiceContainer } from '../core/IServiceContainer';
import { IErrorHandler, ErrorType, AppError } from '../errors/IErrorHandler';
import { IEventBus } from '../events/IEventBus';
import { FACTORY_EVENTS, ComponentCreatedEvent, ComponentCreateFailedEvent } from './events';

/**
 * Abstract base class for component factories
 * Provides common functionality for all factory implementations
 * 
 * @typeparam T The type of component this factory creates
 * @typeparam TConfig Configuration options for component creation
 */
export abstract class BaseComponentFactory<T, TConfig = unknown> implements IComponentFactory<T, TConfig> {
  /**
   * Creates a new base component factory
   * @param errorHandler Error handler for reporting factory errors
   */
  constructor(protected errorHandler: IErrorHandler) {}
  
  /**
   * Abstract method for component creation
   * Must be implemented by derived classes
   */
  abstract create(config: TConfig, container: IServiceContainer): T;
  
  /**
   * Abstract method to get component type
   * Must be implemented by derived classes
   */
  abstract getComponentType(): string;
  
  /**
   * Abstract method to get factory ID
   * Must be implemented by derived classes
   */
  abstract getFactoryId(): string;
  
  /**
   * Optional method to get supported features
   * Can be overridden by derived classes
   */
  getSupportedFeatures?(): string[];
  
  /**
   * Publishes a component creation event
   * @param eventBus Event bus for publishing events
   * @param config Component configuration
   * @param additionalData Additional event data
   */
  protected publishCreatedEvent(
    eventBus: IEventBus, 
    config: any, 
    additionalData: Record<string, any> = {}
  ): void {
    try {
      // Make sure we have a containerId
      const containerId = config?.containerId || 'unknown';
      
      const eventData: ComponentCreatedEvent = {
        type: this.getComponentType(),
        id: containerId,
        factoryId: this.getFactoryId(),
        timestamp: Date.now(),
        ...additionalData
      };
      
      eventBus.emit(FACTORY_EVENTS.COMPONENT_CREATED, eventData);
    } catch (error: any) {
      // Just log the error, don't let it interrupt component creation
      this.errorHandler.handle(
        new AppError(
          ErrorType.FACTORY,
          `Failed to publish component creation event: ${error.message}`,
          { componentType: this.getComponentType(), factoryId: this.getFactoryId() }
        )
      );
    }
  }
  
  /**
   * Publishes a component creation failed event
   * @param eventBus Event bus for publishing events
   * @param error Error that caused the failure
   * @param additionalData Additional event data
   */
  protected publishCreateFailedEvent(
    eventBus: IEventBus, 
    error: Error | string,
    additionalData: Record<string, any> = {}
  ): void {
    try {
      const eventData: ComponentCreateFailedEvent = {
        type: this.getComponentType(),
        factoryId: this.getFactoryId(),
        error,
        timestamp: Date.now(),
        ...additionalData
      };
      
      eventBus.emit(FACTORY_EVENTS.COMPONENT_CREATE_FAILED, eventData);
    } catch (eventError: any) {
      // Just log the error, don't let it interrupt error handling
      this.errorHandler.handle(
        new AppError(
          ErrorType.FACTORY,
          `Failed to publish component creation failed event: ${eventError.message}`,
          { componentType: this.getComponentType(), factoryId: this.getFactoryId(), originalError: error }
        )
      );
    }
  }
  
  /**
   * Handles component creation errors
   * @param error Error to handle
   * @param config Component configuration
   * @param container Service container
   */
  protected handleCreationError(error: any, config: TConfig, container: IServiceContainer): never {
    try {
      // Try to get the event bus to publish failure event
      if (container.has('eventBus')) {
        const eventBus = container.get<IEventBus>('eventBus');
        this.publishCreateFailedEvent(eventBus, error, { config });
      }
    } catch (eventError) {
      // Ignore errors from the event bus, focus on the original error
    }
    
    // Convert to AppError if needed
    const appError = error instanceof AppError 
      ? error 
      : new AppError(
          ErrorType.COMPONENT_CREATION,
          `Failed to create ${this.getComponentType()} component: ${error.message}`,
          { 
            componentType: this.getComponentType(),
            factoryId: this.getFactoryId(),
            config 
          }
        );
    
    // Report error through error handler
    this.errorHandler.handle(appError);
    
    // Re-throw to allow caller to handle
    throw appError;
  }
}