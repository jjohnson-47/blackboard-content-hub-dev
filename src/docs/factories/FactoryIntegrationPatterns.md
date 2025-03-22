# Factory Integration Patterns

This document outlines how the Factory architecture integrates with other components of the DevPreview UI system. These patterns should be followed to ensure consistent behavior and maintainability.

## Service Container Integration

The factory system extends the `IServiceContainer` with factory management capabilities:

```typescript
// Extended IServiceContainer interface
interface IServiceContainer {
  // Existing methods
  register<T>(id: string, instance: T): void;
  get<T>(id: string): T;
  has(id: string): boolean;
  
  // Factory-specific extensions
  registerFactory<T, TConfig>(factory: IComponentFactory<T, TConfig>): void;
  getFactory<T, TConfig>(componentType: string, factoryId: string): IComponentFactory<T, TConfig>;
  getFactoriesForType<T, TConfig>(componentType: string): Array<IComponentFactory<T, TConfig>>;
}
```

### Implementation Strategy

Rather than modifying the `ServiceContainer` directly, we recommend using a decorator pattern:

```typescript
// Decorator pattern example (pseudocode)
class FactoryEnabledServiceContainer implements IServiceContainer {
  constructor(private baseContainer: IServiceContainer, private factoryRegistry: IFactoryRegistry) {}
  
  // Delegate base methods
  register<T>(id: string, instance: T): void {
    return this.baseContainer.register(id, instance);
  }
  
  get<T>(id: string): T {
    return this.baseContainer.get<T>(id);
  }
  
  has(id: string): boolean {
    return this.baseContainer.has(id);
  }
  
  // Implement factory methods
  registerFactory<T, TConfig>(factory: IComponentFactory<T, TConfig>): void {
    this.factoryRegistry.registerFactory(factory);
  }
  
  getFactory<T, TConfig>(componentType: string, factoryId: string): IComponentFactory<T, TConfig> {
    return this.factoryRegistry.getFactory(componentType, factoryId);
  }
  
  getFactoriesForType<T, TConfig>(componentType: string): Array<IComponentFactory<T, TConfig>> {
    return this.factoryRegistry.getFactoriesForType(componentType);
  }
}
```

## Event Bus Integration

The factory system publishes events through the `IEventBus` to communicate component lifecycle events:

### Component Creation Events

```typescript
// Event names
const FACTORY_EVENTS = {
  COMPONENT_CREATED: 'component:created',
  COMPONENT_CREATE_FAILED: 'component:createFailed',
  FACTORY_REGISTERED: 'factory:registered',
  FACTORY_REGISTRATION_FAILED: 'factory:registrationFailed'
};

// Event payloads
interface ComponentCreatedEvent {
  componentType: string;    // e.g., 'editor', 'preview'
  factoryId: string;        // e.g., 'codemirror', 'desmos' 
  containerId: string;      // DOM container ID
  timestamp: number;        // Creation timestamp
}

interface ComponentCreateFailedEvent {
  componentType: string;
  factoryId: string;
  error: Error | string;
  timestamp: number;
}

// Example usage
eventBus.emit(FACTORY_EVENTS.COMPONENT_CREATED, {
  componentType: 'editor',
  factoryId: 'codemirror',
  containerId: 'editor-container',
  timestamp: Date.now()
});
```

### Event Subscription Patterns

Components and consumers can subscribe to these events:

```typescript
// Example subscription
eventBus.on(FACTORY_EVENTS.COMPONENT_CREATED, (event: ComponentCreatedEvent) => {
  console.log(`Component ${event.componentType} created with ${event.factoryId}`);
  
  // Initialize any dependent systems
  if (event.componentType === 'editor') {
    // Set up editor-specific features
  }
});
```

## Error Handler Integration

The factory system integrates with the `IErrorHandler` to provide consistent error reporting:

### Factory-Specific Error Types

```typescript
// Add factory-specific error types
enum ErrorType {
  // Existing types
  INITIALIZATION = 'initialization',
  NETWORK = 'network',
  STORAGE = 'storage',
  VALIDATION = 'validation',
  RUNTIME = 'runtime',
  
  // New factory types
  FACTORY = 'factory',
  FACTORY_REGISTRATION = 'factory-registration',
  COMPONENT_CREATION = 'component-creation'
}
```

### Error Handling Patterns

```typescript
// Error handling in factory operations
try {
  const component = factory.create(config, container);
  return component;
} catch (error) {
  errorHandler.createAndHandle(
    ErrorType.COMPONENT_CREATION,
    `Failed to create ${config.componentType} using ${factoryId} factory`,
    { config, error }
  );
  throw error; // Or handle gracefully depending on context
}
```

## Math API Integration Pattern

The factory architecture specifically addresses integration with different math visualization APIs:

### Math API Factory Pattern

```typescript
// Math API factory interface (pseudocode)
interface IMathPreviewFactory extends IComponentFactory<IPreview, MathPreviewConfig> {
  getSupportedFeatures(): string[];
  getApiVersion(): string;
}

// Configuration for math previews
interface MathPreviewConfig {
  containerId: string;
  initialExpression?: string;
  apiSpecificOptions?: Record<string, unknown>;
}

// Example Math API Factories:
// - DesmosPreviewFactory
// - GeoGebraPreviewFactory
// - CustomMathPreviewFactory
```

### Feature Detection Pattern

Factories should provide feature detection to allow runtime decision making:

```typescript
// Feature detection example
const availableMathFactories = container.getFactoriesForType<IPreview, MathPreviewConfig>('preview');

// Find a factory supporting a specific feature
const factory = availableMathFactories.find(f => 
  f.getFactoryId().startsWith('math') && 
  f.getSupportedFeatures().includes('3d-graphing')
);

if (factory) {
  return factory.create({ containerId: 'preview-container' }, container);
} else {
  // Fall back to a default implementation
  const defaultFactory = container.getFactory<IPreview, MathPreviewConfig>('preview', 'default');
  return defaultFactory.create({ containerId: 'preview-container' }, container);
}
```

## Client Usage Patterns

### Basic Component Creation

```typescript
// Simple component creation
function createEditor(containerId: string, serviceContainer: IServiceContainer): IEditor {
  const factory = serviceContainer.getFactory<IEditor, EditorConfig>('editor', 'codemirror');
  return factory.create({ containerId }, serviceContainer);
}
```

### Dynamic Factory Selection

```typescript
// Dynamic factory selection based on user preference or environment
function createPreview(containerId: string, mathType: string, serviceContainer: IServiceContainer): IPreview {
  const factory = serviceContainer.getFactory<IPreview, PreviewConfig>('preview', mathType);
  
  if (!factory) {
    throw new Error(`Math type ${mathType} is not supported`);
  }
  
  return factory.create({
    containerId,
    mathApiType: mathType
  }, serviceContainer);
}
```

### Listing Available Implementations

```typescript
// List available implementations
function getAvailableMathTypes(serviceContainer: IServiceContainer): string[] {
  const previewFactories = serviceContainer.getFactoriesForType<IPreview, PreviewConfig>('preview');
  return previewFactories
    .filter(factory => factory.getFactoryId().startsWith('math-'))
    .map(factory => factory.getFactoryId().replace('math-', ''));
}
```

## Factory Registration Patterns

### Automatic Factory Registration

```typescript
// Auto-registration pattern during application startup
function registerFactories(container: IServiceContainer, errorHandler: IErrorHandler): void {
  // Editor factories
  container.registerFactory(new CodeMirrorEditorFactory(errorHandler));
  container.registerFactory(new MonacoEditorFactory(errorHandler));
  
  // Preview factories
  container.registerFactory(new StandardPreviewFactory(errorHandler));
  container.registerFactory(new DesmosPreviewFactory(errorHandler));
  container.registerFactory(new GeoGebraPreviewFactory(errorHandler));
}
```

### Dynamic Factory Loading

For more advanced scenarios:

```typescript
// Dynamic factory loading (pseudocode)
async function loadMathFactories(container: IServiceContainer): Promise<void> {
  // Get available factory modules
  const modules = await import('./math-factories/*.js');
  
  for (const module of modules) {
    const factory = module.createFactory();
    container.registerFactory(factory);
    console.log(`Registered ${factory.getComponentType()} factory: ${factory.getFactoryId()}`);
  }
}
```

## Conclusion

These integration patterns ensure that the factory system works seamlessly with the rest of the DevPreview UI architecture. They provide guidance for both implementers and consumers of the factory system, promoting consistency and maintainability.

By following these patterns, we create a system that:

1. Integrates naturally with our existing architectural components
2. Provides clear patterns for common usage scenarios
3. Handles errors in a consistent manner
4. Supports dynamic discovery of available implementations
5. Enables seamless integration of different math visualization backends

These patterns should be used as a guide when implementing the factory system and when developing components that use factories.