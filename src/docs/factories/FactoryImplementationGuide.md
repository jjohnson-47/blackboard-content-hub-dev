# Factory Implementation Guide

This guide provides practical instructions for implementing the factory pattern within the DevPreview UI architecture. It includes step-by-step guidance, best practices, and examples focused on component creation.

## Table of Contents

1. [Implementation Process](#implementation-process)
2. [Best Practices](#best-practices)
3. [Implementation Examples](#implementation-examples)
4. [Extending the Factory System](#extending-the-factory-system)
5. [Testing Your Factories](#testing-your-factories)

## Implementation Process

### 1. Create Specialized Factory Interface

Start by creating or extending a specialized factory interface for your component type:

```typescript
// For a new component type
interface IVisualizationFactory extends IComponentFactory<IVisualization, VisualizationConfig> {
  // Visualization-specific factory methods
  getSupportedGraphTypes(): string[];
}

// Configuration for the component
interface VisualizationConfig {
  containerId: string;
  initialData?: any;
  dimensions?: { width: number, height: number };
}
```

### 2. Create Abstract Base Factory Class

Implement an abstract base class that handles common functionality:

```typescript
abstract class BaseVisualizationFactory implements IVisualizationFactory {
  constructor(protected errorHandler: IErrorHandler) {}
  
  abstract create(config: VisualizationConfig, container: IServiceContainer): IVisualization;
  
  getComponentType(): string {
    return 'visualization';
  }
  
  abstract getFactoryId(): string;
  
  abstract getSupportedGraphTypes(): string[];
  
  // Common validation logic
  protected validateConfig(config: VisualizationConfig): void {
    if (!config?.containerId) {
      throw new Error('Visualization container ID is required');
    }
  }
}
```

### 3. Implement Concrete Factory Classes

Create concrete factory implementations:

```typescript
class ChartJsVisualizationFactory extends BaseVisualizationFactory {
  getFactoryId(): string {
    return 'chartjs';
  }
  
  getSupportedGraphTypes(): string[] {
    return ['bar', 'line', 'pie', 'scatter'];
  }
  
  create(config: VisualizationConfig, container: IServiceContainer): IVisualization {
    try {
      this.validateConfig(config);
      
      // Get dependencies
      const eventBus = container.get<IEventBus>('eventBus');
      
      // Create the component
      const visualization = new ChartJsVisualization(
        config.containerId,
        config.initialData,
        config.dimensions,
        eventBus
      );
      
      // Publish creation event
      eventBus.emit('component:created', {
        type: this.getComponentType(),
        id: config.containerId,
        factoryId: this.getFactoryId(),
        timestamp: Date.now()
      });
      
      return visualization;
    } catch (error) {
      this.errorHandler.handle(error);
      throw error;
    }
  }
}
```

### 4. Register Factory with Container

Register your factory with the service container:

```typescript
// During application initialization
function initializeFactories(container: IServiceContainer, errorHandler: IErrorHandler): void {
  // Register factories
  container.registerFactory(new ChartJsVisualizationFactory(errorHandler));
  container.registerFactory(new D3VisualizationFactory(errorHandler));
}
```

### 5. Use Factory in Client Code

Use the factory in client code:

```typescript
function createVisualization(
  containerId: string,
  visualizationType: string,
  serviceContainer: IServiceContainer
): IVisualization {
  try {
    const factory = serviceContainer.getFactory<IVisualization, VisualizationConfig>(
      'visualization',
      visualizationType
    );
    
    if (!factory) {
      throw new Error(`Visualization type ${visualizationType} is not supported`);
    }
    
    return factory.create({
      containerId,
      dimensions: { width: 600, height: 400 }
    }, serviceContainer);
  } catch (error) {
    // Handle error (e.g., show fallback UI, log error)
    console.error(`Failed to create visualization: ${error.message}`);
    throw error;
  }
}
```

## Best Practices

### Naming Conventions

- **Factory Interfaces**: Use `I[ComponentType]Factory` naming (e.g., `IEditorFactory`)
- **Base Classes**: Use `Base[ComponentType]Factory` naming (e.g., `BaseEditorFactory`)
- **Concrete Factories**: Use `[Implementation][ComponentType]Factory` naming (e.g., `CodeMirrorEditorFactory`)
- **Component Type IDs**: Use lowercase, simple names (e.g., `'editor'`, `'preview'`, `'visualization'`)
- **Factory IDs**: Use lowercase, descriptive names (e.g., `'codemirror'`, `'desmos'`, `'chartjs'`)

### Validation Patterns

- Validate configuration in base classes when possible
- Use early returns or exceptions for invalid configurations
- Include detailed error messages that reference the specific validation failure
- Consider providing default values for optional configuration

```typescript
protected validateConfig(config: EditorConfig): void {
  if (!config) {
    throw new Error('Editor configuration is required');
  }
  
  if (!config.containerId) {
    throw new Error('Editor container ID is required');
  }
  
  // Component-specific validation
  if (config.readOnly && config.autoSave) {
    throw new Error('Auto-save cannot be enabled in read-only mode');
  }
}
```

### Error Handling

- Use the central error handler for all errors
- Include contextual information with errors
- Consider recovery strategies for non-critical errors
- Use appropriate error types from the error handling system

```typescript
try {
  // Factory operation
} catch (error) {
  this.errorHandler.handle(
    new AppError(
      ErrorType.FACTORY,
      `Failed to create ${this.getComponentType()} component`,
      { 
        factoryId: this.getFactoryId(),
        config,
        originalError: error
      }
    )
  );
  throw error;
}
```

### Event Publishing

- Publish component lifecycle events
- Include all relevant context in event data
- Use consistent event naming

```typescript
// Event naming patterns
const FACTORY_EVENTS = {
  COMPONENT_CREATED: 'component:created',
  COMPONENT_CREATE_FAILED: 'component:createFailed',
  FACTORY_REGISTERED: 'factory:registered'
};

// Event data
eventBus.emit(FACTORY_EVENTS.COMPONENT_CREATED, {
  type: this.getComponentType(),
  id: config.containerId,
  factoryId: this.getFactoryId(),
  timestamp: Date.now(),
  // Component-specific data
  features: this.getSupportedFeatures()
});
```

## Implementation Examples

### Basic Editor Factory

```typescript
// Simple editor factory implementation
class SimpleEditorFactory implements IEditorFactory {
  constructor(private errorHandler: IErrorHandler) {}
  
  getComponentType(): string {
    return 'editor';
  }
  
  getFactoryId(): string {
    return 'simple';
  }
  
  create(config: EditorConfig, container: IServiceContainer): IEditor {
    try {
      if (!config?.containerId) {
        throw new Error('Editor container ID is required');
      }
      
      const eventBus = container.get<IEventBus>('eventBus');
      
      // Simple implementation with a textarea
      const editor = {
        getContent(): EditorContent {
          // Implementation
          return { html: '', css: '', js: '' };
        },
        
        setContent(data: EditorContent): void {
          // Implementation
        },
        
        formatCode(): void {
          // Implementation
        },
        
        addEventListener(listener: EditorChangeListener): () => void {
          // Implementation
          return () => {}; // Unsubscribe function
        }
      };
      
      eventBus.emit('component:created', {
        type: this.getComponentType(),
        id: config.containerId,
        factoryId: this.getFactoryId()
      });
      
      return editor;
    } catch (error) {
      this.errorHandler.handle(error);
      throw error;
    }
  }
}
```

### Math API Preview Factory

```typescript
// Desmos preview factory
class DesmosPreviewFactory implements IPreviewFactory {
  constructor(private errorHandler: IErrorHandler) {}
  
  getComponentType(): string {
    return 'preview';
  }
  
  getFactoryId(): string {
    return 'desmos';
  }
  
  getSupportedFeatures(): string[] {
    return ['2d-graphing', 'interactive-points', 'function-visualization'];
  }
  
  getApiVersion(): string {
    return window.Desmos ? window.Desmos.version : 'unknown';
  }
  
  create(config: PreviewConfig, container: IServiceContainer): IPreview {
    try {
      if (!config?.containerId) {
        throw new Error('Preview container ID is required');
      }
      
      // Check if Desmos is available
      if (typeof window.Desmos === 'undefined') {
        throw new Error('Desmos API is not loaded');
      }
      
      const eventBus = container.get<IEventBus>('eventBus');
      
      // Create iframe element
      const iframe = document.createElement('iframe');
      iframe.id = `${config.containerId}-frame`;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      
      // Get container
      const container = document.getElementById(config.containerId);
      if (!container) {
        throw new Error(`Container element not found: ${config.containerId}`);
      }
      
      container.appendChild(iframe);
      
      // Initialize Desmos calculator in iframe
      const calculator = window.Desmos.GraphingCalculator(iframe);
      
      // Create and return preview interface
      const preview: IPreview = {
        update(content: ComponentData): void {
          // Process content and update Desmos calculator
          try {
            // Extract expressions from JS content
            const expressions = parseExpressionsFromCode(content.js);
            
            // Set expressions in calculator
            expressions.forEach(expr => calculator.setExpression(expr));
            
            // Apply any styling from CSS
            applyDesmosStyles(calculator, content.css);
          } catch (error) {
            this.errorHandler.handle(error);
          }
        },
        
        setDeviceSize(size: DeviceSize): void {
          // Adjust calculator view for different device sizes
          let width: string, height: string;
          
          switch (size) {
            case DeviceSize.MOBILE:
              width = '320px';
              height = '568px';
              break;
            case DeviceSize.TABLET:
              width = '768px';
              height = '1024px';
              break;
            case DeviceSize.DESKTOP:
            default:
              width = '100%';
              height = '100%';
              break;
          }
          
          iframe.style.width = width;
          iframe.style.height = height;
          
          // Resize calculator to fit new dimensions
          calculator.resize();
        },
        
        getIframe(): HTMLIFrameElement {
          return iframe;
        }
      };
      
      // Emit creation event
      eventBus.emit('component:created', {
        type: this.getComponentType(),
        id: config.containerId,
        factoryId: this.getFactoryId(),
        features: this.getSupportedFeatures()
      });
      
      return preview;
    } catch (error) {
      this.errorHandler.handle(error);
      throw error;
    }
  }
  
  // Helper methods for Desmos integration
  private parseExpressionsFromCode(js: string): any[] {
    // Implementation to extract expressions from JavaScript code
    // ...
    return [];
  }
  
  private applyDesmosStyles(calculator: any, css: string): void {
    // Implementation to apply CSS to Desmos calculator
    // ...
  }
}
```

## Extending the Factory System

### Supporting New Component Types

To add a new component type:

1. Define the component interface (e.g., `IDataSource`)
2. Create a factory interface extending `IComponentFactory`
3. Implement concrete factories
4. Register factories with the service container

```typescript
// New component interface
interface IDataSource {
  fetchData(): Promise<any>;
  setQueryParams(params: Record<string, string>): void;
  getLastResult(): any;
}

// New factory interface
interface IDataSourceFactory extends IComponentFactory<IDataSource, DataSourceConfig> {
  getSupportedDataFormats(): string[];
}

// Configuration
interface DataSourceConfig {
  endpoint: string;
  initialParams?: Record<string, string>;
  refreshInterval?: number;
}
```

### Adding Math API Support

To support a new math API:

1. Create a new factory implementing `IPreviewFactory`
2. Handle API-specific initialization
3. Map between your internal model and the API's model
4. Implement proper cleanup and resource management
5. Register the factory

```typescript
// New math API factory
class GeoGebraPreviewFactory implements IPreviewFactory {
  // Implementation similar to DesmosPreviewFactory but for GeoGebra
  // ...
}

// Register during initialization
container.registerFactory(new GeoGebraPreviewFactory(errorHandler));
```

### Feature Detection and Negotiation

Implement feature detection to select the appropriate factory:

```typescript
// Find factory supporting specific features
function findMathFactoryWithFeatures(
  container: IServiceContainer,
  requiredFeatures: string[]
): IPreviewFactory | null {
  const previewFactories = container.getFactoriesForType<IPreview, PreviewConfig>('preview');
  
  // Filter to math-related factories
  const mathFactories = previewFactories.filter(f => 
    f.getFactoryId().startsWith('math-') || 
    ['desmos', 'geogebra', 'mathjs'].includes(f.getFactoryId())
  );
  
  // Find factory supporting all required features
  for (const factory of mathFactories) {
    if (factory.getSupportedFeatures) {
      const supportedFeatures = factory.getSupportedFeatures();
      const hasAllFeatures = requiredFeatures.every(f => supportedFeatures.includes(f));
      
      if (hasAllFeatures) {
        return factory;
      }
    }
  }
  
  return null;
}
```

## Testing Your Factories

Follow the [Factory Testing Strategy](./FactoryTestingStrategy.md) document for comprehensive testing guidelines. Key aspects include:

1. **Unit Testing**: Test each factory in isolation
   - Verify component creation
   - Test configuration validation
   - Check error handling
   - Verify event emission

2. **Integration Testing**: Test factories with real dependencies
   - Integration with service container
   - Event propagation
   - Error handler integration

3. **API-Specific Testing**: For math APIs
   - Mock external APIs
   - Test API loading
   - Verify feature detection

See the testing strategy document for detailed examples and patterns.

## Conclusion

This guide provides a foundation for implementing factories in the DevPreview UI architecture. By following these patterns and best practices, you'll create factories that:

1. Integrate seamlessly with the dependency injection system
2. Provide consistent error handling
3. Emit appropriate lifecycle events
4. Support multiple implementation strategies
5. Maintain clear separation of concerns

Remember that factories should balance flexibility with simplicity, providing a consistent component creation experience while encapsulating implementation details.