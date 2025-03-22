// Core factory exports
export * from './events';
export * from './BaseComponentFactory';
export * from './FactoryRegistry';

// Editor factory exports
export * from './editors/BaseEditorFactory';
export * from './editors/SimpleEditorFactory';

// Preview factory exports
export * from './previews/BasePreviewFactory';
export * from './previews/StandardPreviewFactory';

// Registration functions
import { IServiceContainer } from '../core/IServiceContainer';
import { IErrorHandler } from '../errors/IErrorHandler';
import { IFactoryRegistry } from '../interfaces/factories/IFactoryRegistry';
import { FactoryRegistry } from './FactoryRegistry';
import { SimpleEditorFactory } from './editors/SimpleEditorFactory';
import { StandardPreviewFactory } from './previews/StandardPreviewFactory';

/**
 * Register the factory registry with the service container
 * @param container The service container to register with
 * @param errorHandler Error handler for factory operations
 * @returns The registered factory registry
 */
export function registerFactoryRegistry(
  container: IServiceContainer,
  errorHandler: IErrorHandler
): IFactoryRegistry {
  // Create factory registry
  const factoryRegistry = new FactoryRegistry(errorHandler);
  
  // Register it with the container
  container.register('factoryRegistry', factoryRegistry);
  
  return factoryRegistry;
}

/**
 * Register all default factories with the registry
 * @param container The service container to register with
 * @param errorHandler Error handler for factory operations
 */
export function registerDefaultFactories(
  container: IServiceContainer, 
  errorHandler: IErrorHandler
): void {
  // Make sure registry exists
  if (!container.has('factoryRegistry')) {
    registerFactoryRegistry(container, errorHandler);
  }
  
  const registry = container.get<IFactoryRegistry>('factoryRegistry');
  
  // Register editor factories
  registry.registerFactory(new SimpleEditorFactory(errorHandler));
  
  // Register preview factories
  registry.registerFactory(new StandardPreviewFactory(errorHandler));
}