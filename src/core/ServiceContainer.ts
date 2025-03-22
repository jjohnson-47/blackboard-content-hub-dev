import { IServiceContainer } from './IServiceContainer';

/**
 * Service container implementation for dependency injection
 */
export class ServiceContainer implements IServiceContainer {
  private services: Map<string, any> = new Map();
  
  /**
   * Register a service instance with the container
   * @param id Unique identifier for the service
   * @param instance The service instance
   */
  public register<T>(id: string, instance: T): void {
    this.services.set(id, instance);
  }
  
  /**
   * Retrieve a service from the container
   * @param id Unique identifier for the service
   * @returns The service instance
   * @throws Error if service is not registered
   */
  public get<T>(id: string): T {
    if (!this.has(id)) {
      throw new Error(`Service '${id}' not registered`);
    }
    return this.services.get(id) as T;
  }
  
  /**
   * Check if a service is registered
   * @param id Unique identifier for the service
   * @returns True if service exists
   */
  public has(id: string): boolean {
    return this.services.has(id);
  }
}