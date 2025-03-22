import { IComponentFactory } from './IComponentFactory';

/**
 * Registry for managing component factories
 * Provides a centralized system for registering and retrieving component factories
 */
export interface IFactoryRegistry {
  /**
   * Register a component factory with the registry
   * @param factory The factory to register
   * @throws Error if registration fails
   */
  registerFactory<T, TConfig>(factory: IComponentFactory<T, TConfig>): void;
  
  /**
   * Get a specific factory by component type and factory ID
   * @param componentType The component type identifier
   * @param factoryId The factory implementation identifier
   * @returns The component factory or undefined if not found
   */
  getFactory<T, TConfig>(componentType: string, factoryId: string): IComponentFactory<T, TConfig> | undefined;
  
  /**
   * Get all factories for a specific component type
   * @param componentType The component type identifier
   * @returns Array of factories for the specified component type
   */
  getFactoriesForType<T, TConfig>(componentType: string): Array<IComponentFactory<T, TConfig>>;
}