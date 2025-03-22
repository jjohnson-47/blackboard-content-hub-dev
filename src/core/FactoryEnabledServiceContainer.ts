import { IServiceContainer } from './IServiceContainer';
import { IFactoryRegistry } from '../interfaces/factories/IFactoryRegistry';
import { IComponentFactory } from '../interfaces/factories/IComponentFactory';
import { IErrorHandler, ErrorType, AppError } from '../errors/IErrorHandler';

/**
 * Service container decorator that adds factory registration and retrieval capabilities
 * Uses the decorator pattern to extend the base service container without modifying it
 */
export class FactoryEnabledServiceContainer implements IServiceContainer {
  /**
   * Creates a new factory-enabled service container
   * @param baseContainer The base service container to delegate to
   * @param factoryRegistry The registry for managing factories
   * @param errorHandler Error handler for reporting errors
   */
  constructor(
    private baseContainer: IServiceContainer,
    private factoryRegistry: IFactoryRegistry,
    private errorHandler: IErrorHandler
  ) {}
  
  /**
   * Register a service instance with the container
   * Delegates to the base container
   */
  register<T>(id: string, instance: T): void {
    return this.baseContainer.register(id, instance);
  }
  
  /**
   * Retrieve a service from the container
   * Delegates to the base container
   */
  get<T>(id: string): T {
    return this.baseContainer.get<T>(id);
  }
  
  /**
   * Check if a service is registered
   * Delegates to the base container
   */
  has(id: string): boolean {
    return this.baseContainer.has(id);
  }
  
  /**
   * Register a component factory with the container
   * @param factory The factory to register
   * @throws Error if registration fails
   */
  registerFactory<T, TConfig>(factory: IComponentFactory<T, TConfig>): void {
    try {
      this.factoryRegistry.registerFactory(factory);
    } catch (error: any) {
      // Error is already handled by the registry, but we add context here
      this.errorHandler.handle(
        new AppError(
          ErrorType.FACTORY_REGISTRATION,
          `Service container failed to register factory: ${error.message}`,
          { factoryDetails: `${factory.getComponentType()}:${factory.getFactoryId()}` }
        )
      );
      throw error;
    }
  }
  
  /**
   * Get a specific factory by component type and factory ID
   * @param componentType The component type identifier
   * @param factoryId The factory implementation identifier
   * @returns The component factory
   * @throws Error if factory is not found
   */
  getFactory<T, TConfig>(componentType: string, factoryId: string): IComponentFactory<T, TConfig> {
    const factory = this.factoryRegistry.getFactory<T, TConfig>(componentType, factoryId);
    
    if (!factory) {
      const error = new AppError(
        ErrorType.FACTORY,
        `Factory not found: ${componentType}:${factoryId}`,
        { componentType, factoryId }
      );
      this.errorHandler.handle(error);
      throw error;
    }
    
    return factory;
  }
  
  /**
   * Get all factories for a specific component type
   * @param componentType The component type identifier
   * @returns Array of factories for the specified component type
   */
  getFactoriesForType<T, TConfig>(componentType: string): Array<IComponentFactory<T, TConfig>> {
    return this.factoryRegistry.getFactoriesForType<T, TConfig>(componentType);
  }
}