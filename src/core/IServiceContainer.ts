/**
 * Service container interface for dependency injection
 */
export interface IServiceContainer {
    /**
     * Register a service instance with the container
     * @param id Unique identifier for the service
     * @param instance The service instance
     */
    register<T>(id: string, instance: T): void;
    
    /**
     * Retrieve a service from the container
     * @param id Unique identifier for the service
     * @returns The service instance
     * @throws Error if service is not registered
     */
    get<T>(id: string): T;
    
    /**
     * Check if a service is registered
     * @param id Unique identifier for the service
     * @returns True if service exists
     */
    has(id: string): boolean;
  }