import { IFactoryRegistry } from './IFactoryRegistry';
import { IComponentFactory } from './IComponentFactory';
import { IErrorHandler, ErrorType, AppError } from '../errors/IErrorHandler';

/**
 * Registry for managing component factories
 * Provides a centralized system for registering and retrieving factories
 */
export class FactoryRegistry implements IFactoryRegistry {
  /**
   * Map of component types to factories
   * Structure: Map<componentType, Map<factoryId, factory>>
   */
  private factories: Map<string, Map<string, IComponentFactory<any, any>>> = new Map();
  
  /**
   * Creates a new factory registry
   * @param errorHandler Error handler for reporting registry errors
   */
  constructor(private errorHandler: IErrorHandler) {}
  
  /**
   * Register a component factory with the registry
   * @param factory The factory to register
   * @throws Error if registration fails
   */
  registerFactory<T, TConfig>(factory: IComponentFactory<T, TConfig>): void {
    try {
      if (!factory) {
        throw new Error('Cannot register null or undefined factory');
      }
      
      const componentType = factory.getComponentType();
      const factoryId = factory.getFactoryId();
      
      if (!componentType) {
        throw new Error('Factory must provide a component type');
      }
      
      if (!factoryId) {
        throw new Error('Factory must provide a factory ID');
      }
      
      // Create component type map if it doesn't exist
      if (!this.factories.has(componentType)) {
        this.factories.set(componentType, new Map());
      }
      
      const factoriesForType = this.factories.get(componentType)!;
      
      // Check if this factory ID is already registered
      if (factoriesForType.has(factoryId)) {
        throw new Error(
          `Factory with ID '${factoryId}' is already registered for component type '${componentType}'`
        );
      }
      
      // Register the factory
      factoriesForType.set(factoryId, factory);
    } catch (error: any) {
      // Convert to AppError if it's not already
      const appError = error instanceof AppError 
        ? error 
        : new AppError(
            ErrorType.FACTORY_REGISTRATION,
            `Failed to register factory: ${error.message}`,
            {
              factoryInfo: `${factory?.getComponentType?.() || 'unknown'}:${factory?.getFactoryId?.() || 'unknown'}`
            }
          );
      
      this.errorHandler.handle(appError);
      throw error; // Re-throw to allow caller to handle
    }
  }
  
  /**
   * Get a specific factory by component type and factory ID
   * @param componentType The component type identifier
   * @param factoryId The factory implementation identifier
   * @returns The component factory or undefined if not found
   */
  getFactory<T, TConfig>(componentType: string, factoryId: string): IComponentFactory<T, TConfig> | undefined {
    try {
      const factoriesForType = this.factories.get(componentType);
      
      if (!factoriesForType) {
        return undefined;
      }
      
      return factoriesForType.get(factoryId) as IComponentFactory<T, TConfig> | undefined;
    } catch (error: any) {
      this.errorHandler.handle(
        new AppError(
          ErrorType.FACTORY,
          `Error retrieving factory: ${error.message}`,
          { componentType, factoryId }
        )
      );
      return undefined;
    }
  }
  
  /**
   * Get all factories for a specific component type
   * @param componentType The component type identifier
   * @returns Array of factories for the specified component type
   */
  getFactoriesForType<T, TConfig>(componentType: string): Array<IComponentFactory<T, TConfig>> {
    try {
      const factoriesForType = this.factories.get(componentType);
      
      if (!factoriesForType) {
        return [];
      }
      
      return Array.from(factoriesForType.values()) as Array<IComponentFactory<T, TConfig>>;
    } catch (error: any) {
      this.errorHandler.handle(
        new AppError(
          ErrorType.FACTORY,
          `Error retrieving factories for type: ${error.message}`,
          { componentType }
        )
      );
      return [];
    }
  }
}