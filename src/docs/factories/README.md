# Factory Architecture Documentation

## Overview

The factory architecture in DevPreview UI provides a flexible, extensible approach to component creation. It enables support for multiple component implementations (like different math visualization backends) while maintaining a consistent interface for client code.

This section documents the design, implementation, integration patterns, and testing strategies for the factory system.

## Key Documents

- [**Factory Architecture ADR**](./FactoryArchitectureADR.md) - The architecture decision record for the factory pattern, explaining the rationale and consequences of this design choice.

- [**Factory Integration Patterns**](./FactoryIntegrationPatterns.md) - Patterns for integrating factories with other system components such as the service container, event bus, and error handler.

- [**Factory Testing Strategy**](./FactoryTestingStrategy.md) - Comprehensive testing approach for the factory system, including unit testing, integration testing, and special considerations.

- [**Factory Implementation Guide**](./FactoryImplementationGuide.md) - Step-by-step guide for implementing new factories, including code examples and best practices.

## Core Concepts

The factory system is built around several key concepts:

### 1. Component Factory Interfaces

Base interfaces that define the contract for all factories:

```typescript
interface IComponentFactory<T, TConfig = unknown> {
  create(config: TConfig, container: IServiceContainer): T;
  getComponentType(): string;
  getFactoryId(): string;
}
```

Specialized interfaces for specific component types:

```typescript
interface IEditorFactory extends IComponentFactory<IEditor, EditorConfig> { }
interface IPreviewFactory extends IComponentFactory<IPreview, PreviewConfig> { }
```

### 2. Factory Registry

A central service that manages factory registration and discovery:

```typescript
interface IFactoryRegistry {
  registerFactory<T, TConfig>(factory: IComponentFactory<T, TConfig>): void;
  getFactory<T, TConfig>(componentType: string, factoryId: string): IComponentFactory<T, TConfig> | undefined;
  getFactoriesForType<T, TConfig>(componentType: string): Array<IComponentFactory<T, TConfig>>;
}
```

### 3. Factory-Enabled Service Container

An extended service container that provides factory capabilities:

```typescript
interface IServiceContainer {
  // Existing methods
  register<T>(id: string, instance: T): void;
  get<T>(id: string): T;
  has(id: string): boolean;
  
  // Factory extensions
  registerFactory<T, TConfig>(factory: IComponentFactory<T, TConfig>): void;
  getFactory<T, TConfig>(componentType: string, factoryId: string): IComponentFactory<T, TConfig>;
  getFactoriesForType<T, TConfig>(componentType: string): Array<IComponentFactory<T, TConfig>>;
}
```

## Usage Examples

### Registering Factories

```typescript
// Register factories during application bootstrap
function registerFactories(container: IServiceContainer, errorHandler: IErrorHandler): void {
  // Editor factories
  container.registerFactory(new CodeMirrorEditorFactory(errorHandler));
  
  // Preview factories
  container.registerFactory(new StandardPreviewFactory(errorHandler));
  container.registerFactory(new DesmosPreviewFactory(errorHandler));
  container.registerFactory(new GeoGebraPreviewFactory(errorHandler));
}
```

### Creating Components

```typescript
// Create a component using a factory
function createEditor(containerId: string, serviceContainer: IServiceContainer): IEditor {
  const factory = serviceContainer.getFactory<IEditor, EditorConfig>('editor', 'codemirror');
  return factory.create({ containerId }, serviceContainer);
}

// Create a preview based on user selection
function createMathPreview(
  containerId: string, 
  mathType: string, 
  serviceContainer: IServiceContainer
): IPreview {
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

## Integration with Math APIs

The factory architecture was specifically designed to support multiple math visualization backends:

- **Desmos API** - Through `DesmosPreviewFactory`
- **GeoGebra API** - Through `GeoGebraPreviewFactory`
- **Custom Math APIs** - Through additional factory implementations

Each math API factory handles the specific initialization, configuration, and lifecycle management for its corresponding API, while presenting a consistent `IPreview` interface to the rest of the application.

## Extension Points

The factory system is designed to be extended in several ways:

1. **New Component Types** - Create new interfaces extending `IComponentFactory`
2. **New Implementations** - Create new factories for existing component types
3. **Enhanced Capabilities** - Add specialized methods to specific factory types
4. **Dynamic Loading** - Support for runtime-loaded factory implementations

## Related Documentation

- [Error Handling Architecture](../errors/README.md) - How the factory system integrates with error handling
- [Service Container](../core/ServiceContainer.md) - The dependency injection system factories use
- [Event System](../events/README.md) - How factories publish lifecycle events