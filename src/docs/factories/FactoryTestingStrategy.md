# Factory Testing Strategy

This document outlines the testing approach for the Factory architecture in the DevPreview UI system. It provides patterns and guidance for ensuring the factory components are thoroughly tested and behave as expected.

## Testing Goals

The factory testing strategy aims to achieve these key goals:

1. **Isolation**: Test factory components in isolation from concrete implementations
2. **Component Verification**: Verify that factories correctly create component instances
3. **Error Handling**: Validate error handling and error reporting mechanisms
4. **Integration**: Test integration with other system components (service container, event bus)
5. **Configuration**: Verify factories handle various configuration options correctly

## Unit Testing Patterns

### Factory Registry Testing

The `FactoryRegistry` is a core component that should be thoroughly tested:

```typescript
// Example FactoryRegistry test (pseudocode)
describe('FactoryRegistry', () => {
  let registry: FactoryRegistry;
  let mockErrorHandler: MockErrorHandler;
  let mockFactory: MockComponentFactory;
  
  beforeEach(() => {
    mockErrorHandler = new MockErrorHandler();
    registry = new FactoryRegistry(mockErrorHandler);
    mockFactory = new MockComponentFactory('editor', 'mock');
  });
  
  test('registers a factory successfully', () => {
    registry.registerFactory(mockFactory);
    
    const retrievedFactory = registry.getFactory('editor', 'mock');
    expect(retrievedFactory).toBe(mockFactory);
  });
  
  test('gets factories by type', () => {
    const mockFactory2 = new MockComponentFactory('editor', 'mock2');
    
    registry.registerFactory(mockFactory);
    registry.registerFactory(mockFactory2);
    
    const factories = registry.getFactoriesForType('editor');
    expect(factories).toHaveLength(2);
    expect(factories).toContain(mockFactory);
    expect(factories).toContain(mockFactory2);
  });
  
  test('handles registration errors', () => {
    // Set up factory to throw during registration
    mockFactory.throwOnRegistration = true;
    
    expect(() => registry.registerFactory(mockFactory)).toThrow();
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
      expect.stringContaining('FactoryRegistry.registerFactory'),
      expect.any(Error),
      expect.objectContaining({
        factoryInfo: 'editor:mock'
      })
    );
  });
});
```

### Concrete Factory Testing

Individual factories should be tested for correct behavior:

```typescript
// Example factory test (pseudocode)
describe('CodeMirrorEditorFactory', () => {
  let factory: CodeMirrorEditorFactory;
  let mockErrorHandler: MockErrorHandler;
  let mockContainer: MockServiceContainer;
  let mockEventBus: MockEventBus;
  
  beforeEach(() => {
    mockErrorHandler = new MockErrorHandler();
    mockEventBus = new MockEventBus();
    mockContainer = new MockServiceContainer();
    mockContainer.register('eventBus', mockEventBus);
    
    factory = new CodeMirrorEditorFactory(mockErrorHandler);
  });
  
  test('returns correct component type', () => {
    expect(factory.getComponentType()).toBe('editor');
  });
  
  test('returns correct factory ID', () => {
    expect(factory.getFactoryId()).toBe('codemirror');
  });
  
  test('creates editor instance', () => {
    const editor = factory.create({ containerId: 'test-container' }, mockContainer);
    
    expect(editor).toBeInstanceOf(CodeMirrorEditor);
    expect(editor.getContent).toBeDefined();
    expect(editor.setContent).toBeDefined();
  });
  
  test('throws with invalid config', () => {
    expect(() => {
      factory.create({ containerId: '' }, mockContainer);
    }).toThrow();
    
    expect(mockErrorHandler.handleError).toHaveBeenCalled();
  });
  
  test('emits creation event', () => {
    factory.create({ containerId: 'test-container' }, mockContainer);
    
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      'component:created',
      expect.objectContaining({
        type: 'editor',
        id: 'test-container',
        factoryId: 'codemirror'
      })
    );
  });
});
```

## Mock Implementation Patterns

### Mock Factory Base

A reusable mock factory pattern for testing:

```typescript
// Mock factory implementation
class MockComponentFactory<T, TConfig> implements IComponentFactory<T, TConfig> {
  throwOnRegistration = false;
  throwOnCreate = false;
  mockInstance: T;
  
  constructor(
    private readonly componentType: string,
    private readonly factoryId: string,
    mockInstance?: T
  ) {
    this.mockInstance = mockInstance || {} as T;
  }
  
  getComponentType(): string {
    if (this.throwOnRegistration) {
      throw new Error('Simulated registration error');
    }
    return this.componentType;
  }
  
  getFactoryId(): string {
    return this.factoryId;
  }
  
  create(config: TConfig, container: IServiceContainer): T {
    if (this.throwOnCreate) {
      throw new Error('Simulated creation error');
    }
    return this.mockInstance;
  }
}
```

### Mock Service Container with Factory Support

```typescript
// Mock service container with factory support
class MockServiceContainer implements IServiceContainer {
  private services = new Map<string, any>();
  private factories = new Map<string, Map<string, IComponentFactory<any, any>>>();
  
  register<T>(id: string, instance: T): void {
    this.services.set(id, instance);
  }
  
  get<T>(id: string): T {
    const instance = this.services.get(id);
    if (!instance) {
      throw new Error(`Service not found: ${id}`);
    }
    return instance as T;
  }
  
  has(id: string): boolean {
    return this.services.has(id);
  }
  
  registerFactory<T, TConfig>(factory: IComponentFactory<T, TConfig>): void {
    const componentType = factory.getComponentType();
    const factoryId = factory.getFactoryId();
    
    if (!this.factories.has(componentType)) {
      this.factories.set(componentType, new Map());
    }
    
    const factoriesForType = this.factories.get(componentType)!;
    factoriesForType.set(factoryId, factory);
  }
  
  getFactory<T, TConfig>(componentType: string, factoryId: string): IComponentFactory<T, TConfig> {
    const factoriesForType = this.factories.get(componentType);
    if (!factoriesForType) {
      throw new Error(`No factories registered for component type: ${componentType}`);
    }
    
    const factory = factoriesForType.get(factoryId);
    if (!factory) {
      throw new Error(`Factory not found: ${componentType}:${factoryId}`);
    }
    
    return factory as IComponentFactory<T, TConfig>;
  }
  
  getFactoriesForType<T, TConfig>(componentType: string): Array<IComponentFactory<T, TConfig>> {
    const factoriesForType = this.factories.get(componentType);
    if (!factoriesForType) {
      return [];
    }
    
    return Array.from(factoriesForType.values()) as Array<IComponentFactory<T, TConfig>>;
  }
}
```

## Integration Testing Patterns

### Factory and Service Container Integration

```typescript
// Integration test example (pseudocode)
describe('Factory and ServiceContainer integration', () => {
  let container: ServiceContainer;
  let factoryRegistry: FactoryRegistry;
  let eventBus: EventBus;
  let errorHandler: ErrorHandler;
  
  beforeEach(() => {
    // Create real components
    container = new ServiceContainer();
    errorHandler = new ErrorHandler();
    eventBus = new EventBus();
    factoryRegistry = new FactoryRegistry(errorHandler);
    
    // Register core services
    container.register('errorHandler', errorHandler);
    container.register('eventBus', eventBus);
    container.register('factoryRegistry', factoryRegistry);
    
    // Extend container with factory capabilities
    const factoryEnabledContainer = new FactoryEnabledServiceContainer(container, factoryRegistry);
    
    // Use the enhanced container for tests
    container = factoryEnabledContainer;
  });
  
  test('registers and retrieves factories', () => {
    // Register test factories
    const editorFactory = new CodeMirrorEditorFactory(errorHandler);
    const previewFactory = new StandardPreviewFactory(errorHandler);
    
    container.registerFactory(editorFactory);
    container.registerFactory(previewFactory);
    
    // Retrieve and verify
    const retrievedEditorFactory = container.getFactory('editor', 'codemirror');
    expect(retrievedEditorFactory).toBe(editorFactory);
    
    const retrievedPreviewFactory = container.getFactory('preview', 'standard');
    expect(retrievedPreviewFactory).toBe(previewFactory);
  });
  
  test('creates components through factories', () => {
    // Register real factory
    const editorFactory = new CodeMirrorEditorFactory(errorHandler);
    container.registerFactory(editorFactory);
    
    // Create component through factory
    const factory = container.getFactory<IEditor, EditorConfig>('editor', 'codemirror');
    const editor = factory.create({ containerId: 'test-container' }, container);
    
    expect(editor).toBeInstanceOf(CodeMirrorEditor);
    expect(editor.getContent()).toEqual({
      html: '',
      css: '',
      js: ''
    });
  });
});
```

### Event Bus Integration Testing

```typescript
// Testing factory event emission (pseudocode)
describe('Factory event integration', () => {
  let container: ServiceContainer;
  let eventBus: EventBus;
  let factory: CodeMirrorEditorFactory;
  
  beforeEach(() => {
    // Set up with real components
    eventBus = new EventBus();
    container = new ServiceContainer();
    container.register('eventBus', eventBus);
    
    factory = new CodeMirrorEditorFactory(new ErrorHandler());
  });
  
  test('emits creation event when component is created', () => {
    // Set up event listener
    const eventListener = jest.fn();
    eventBus.on('component:created', eventListener);
    
    // Create component
    factory.create({ containerId: 'test-container' }, container);
    
    // Verify event was emitted with correct data
    expect(eventListener).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'editor',
        id: 'test-container',
        factoryId: 'codemirror'
      })
    );
  });
});
```

## Testing Math API Factory Implementations

Math API integrations require special testing consideration:

```typescript
// Math API factory testing (pseudocode)
describe('DesmosPreviewFactory', () => {
  let factory: DesmosPreviewFactory;
  let mockContainer: MockServiceContainer;
  
  beforeEach(() => {
    mockContainer = new MockServiceContainer();
    mockContainer.register('eventBus', new MockEventBus());
    factory = new DesmosPreviewFactory(new MockErrorHandler());
  });
  
  test('identifies supported features', () => {
    const features = factory.getSupportedFeatures();
    expect(features).toContain('2d-graphing');
    expect(features).toContain('interactive-points');
  });
  
  test('returns API version', () => {
    expect(factory.getApiVersion()).toBe('1.0');
  });
  
  test('creates preview with Desmos integration', () => {
    // Mock the global Desmos object
    global.Desmos = {
      GraphingCalculator: jest.fn().mockImplementation(() => ({
        setExpression: jest.fn(),
        resize: jest.fn()
      }))
    };
    
    const preview = factory.create({ 
      containerId: 'preview-container',
      mathApiType: 'desmos'
    }, mockContainer);
    
    expect(preview).toBeInstanceOf(DesmosPreview);
    expect(global.Desmos.GraphingCalculator).toHaveBeenCalled();
  });
  
  test('handles missing Desmos API gracefully', () => {
    // Remove Desmos global
    delete global.Desmos;
    
    expect(() => {
      factory.create({ 
        containerId: 'preview-container',
        mathApiType: 'desmos'
      }, mockContainer);
    }).toThrow();
    
    // Should report specific error about Desmos API
    expect(mockErrorHandler.handleError).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Error),
      expect.objectContaining({
        errorType: 'API_MISSING'
      })
    );
  });
});
```

## Test Coverage Requirements

Factory implementations should maintain:

1. **Core Factory Classes**: 100% coverage
2. **Factory Registry**: 100% coverage
3. **Factory Interface Extensions**: 100% coverage
4. **Factory Implementations**: 90%+ coverage, focusing on:
   - Creation logic
   - Configuration validation
   - Error handling
   - Event emission

## Special Considerations

### Iframe Testing

When testing preview factories that create iframes:

```typescript
// Iframe testing setup (pseudocode)
beforeEach(() => {
  // Mock document methods for iframe creation
  document.createElement = jest.fn().mockImplementation((tag) => {
    if (tag === 'iframe') {
      return {
        contentWindow: {
          document: {
            write: jest.fn(),
            close: jest.fn()
          }
        },
        style: {},
        addEventListener: jest.fn((event, callback) => {
          if (event === 'load') {
            callback();
          }
        })
      };
    }
    return document.createElement(tag);
  });
});
```

### API Loading

For testing factories that load external APIs:

```typescript
// API loading tests (pseudocode)
test('loads API script when not present', () => {
  // Mock document.head.appendChild to track script loading
  const originalAppendChild = document.head.appendChild;
  const appendChildSpy = jest.fn((child) => {
    // Simulate script load
    if (child.tagName === 'SCRIPT') {
      setTimeout(() => {
        child.onload?.();
      }, 0);
    }
    return originalAppendChild.call(document.head, child);
  });
  
  document.head.appendChild = appendChildSpy;
  
  // Remove API from global scope
  delete window.ExternalMathAPI;
  
  // Create preview, which should trigger API loading
  factory.create({
    containerId: 'preview-container'
  }, mockContainer);
  
  // Verify script was added
  expect(appendChildSpy).toHaveBeenCalled();
  expect(appendChildSpy.mock.calls[0][0].src).toContain('external-math-api.js');
});
```

## Conclusion

This testing strategy ensures the factory system is thoroughly tested while maintaining flexibility for different implementation approaches. By following these patterns, we can ensure that:

1. The core factory architecture is robust and reliable
2. Component creation works correctly in all scenarios
3. Error cases are handled appropriately
4. The factory system integrates properly with other system components
5. Math API integrations work as expected

The testing strategy also supports the co-located architecture by focusing tests on behavior rather than structure, allowing for flexibility in implementation while maintaining strict contracts.