import { IServiceContainer } from '../core/IServiceContainer';

/**
 * Base factory interface for creating components
 * @typeparam T The type of component this factory creates
 * @typeparam TConfig Configuration options for component creation
 */
export interface IComponentFactory<T, TConfig = unknown> {
  /**
   * Creates a component instance with appropriate configuration
   * @param config Configuration options for the component
   * @param container Service container for dependency injection
   * @returns A new instance of the component
   */
  create(config: TConfig, container: IServiceContainer): T;
  
  /**
   * Returns the component type identifier for registration
   * @returns String identifier for the component type
   */
  getComponentType(): string;
  
  /**
   * Returns the specific implementation identifier
   * @returns String identifier for the implementation
   */
  getFactoryId(): string;
}