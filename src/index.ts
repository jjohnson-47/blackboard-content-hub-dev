// Main entry point for the DevPreview UI library

// Core framework exports
export * from './core/ServiceContainer';
export * from './events/EventBus';
export * from './errors'; // Use barrel file for error handling exports
// export * from './core/Bootstrap'; // Not implemented yet

// Models exports with domain-specific naming
export { 
  // Primary domain-specific types
  ComponentMetadata,
  // Legacy alias for backward compatibility 
  Component 
} from './models/ComponentMetadata';

export { 
  // Primary domain-specific type
  StorageComponentContent,
  // Legacy aliases for backward compatibility
  ComponentContentData, 
  ComponentData 
} from './models/ComponentContent';

// Interface exports (co-located with implementations)
export * from './components';
export * from './adapters/IStorageAdapter';
export * from './events/IEventBus';
export * from './core/IServiceContainer';
// export * from './factories/IComponentFactory'; // Not implemented yet

// Service exports
export * from './services/IStorageService';
export * from './services/StorageService';
// export * from './services/IApiService'; // Not implemented yet

// Note: Explicit exports with domain-specific names help IDEs provide better suggestions
// and avoid type naming collisions across different parts of the application.