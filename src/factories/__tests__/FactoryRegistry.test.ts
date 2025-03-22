import { describe, it, expect, beforeEach } from 'vitest';
import { FactoryRegistry } from '../FactoryRegistry';
import { IComponentFactory } from '../IComponentFactory';
import { IErrorHandler, ErrorType, AppError } from '../../errors/IErrorHandler';
import { IServiceContainer } from '../../core/IServiceContainer';

// Mock dependencies and implementations
class MockErrorHandler implements IErrorHandler {
  public errors: Array<Error | AppError> = [];
  
  handle(error: Error | AppError): void {
    this.errors.push(error);
  }
  
  createAndHandle(type: ErrorType, message: string, details?: any): void {
    const error = new AppError(type, message, details);
    this.handle(error);
  }
  
  handleIframeError(source: HTMLIFrameElement | string, message: string, details?: any): void {
    const error = new AppError(
      ErrorType.RUNTIME,
      `Error in iframe: ${message}`,
      { source: typeof source === 'string' ? source : source.src || 'unknown-iframe', ...details }
    );
    this.handle(error);
  }
  
  handleMathApiError(apiType: string, message: string, details?: any): void {
    const error = new AppError(
      ErrorType.MATH_API,
      `Error in ${apiType} API: ${message}`,
      { apiType, ...details }
    );
    this.handle(error);
  }
  
  attemptRecovery(errorType: ErrorType, context: any): boolean {
    // In the mock, just record the recovery attempt and return true
    this.errors.push(new AppError(
      errorType,
      'Recovery attempt',
      { context, timestamp: new Date() }
    ));
    return true;
  }
}

class MockServiceContainer implements IServiceContainer {
  private services = new Map<string, any>();
  
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
}

class MockComponentFactory<T = any, TConfig = any> implements IComponentFactory<T, TConfig> {
  constructor(
    private componentType: string,
    private factoryId: string,
    private instance: T = {} as T
  ) {}
  
  create(config: TConfig, container: IServiceContainer): T {
    return this.instance;
  }
  
  getComponentType(): string {
    return this.componentType;
  }
  
  getFactoryId(): string {
    return this.factoryId;
  }
}

describe('FactoryRegistry', () => {
  let registry: FactoryRegistry;
  let errorHandler: MockErrorHandler;
  let serviceContainer: MockServiceContainer;
  
  beforeEach(() => {
    errorHandler = new MockErrorHandler();
    serviceContainer = new MockServiceContainer();
    registry = new FactoryRegistry(errorHandler);
  });
  
  describe('registerFactory', () => {
    it('should register a factory successfully', () => {
      // Arrange
      const factory = new MockComponentFactory('editor', 'mock');
      
      // Act
      registry.registerFactory(factory);
      
      // Assert
      const retrievedFactory = registry.getFactory('editor', 'mock');
      expect(retrievedFactory).toBe(factory);
    });
    
    it('should throw an error when registering a duplicate factory', () => {
      // Arrange
      const factory1 = new MockComponentFactory('editor', 'mock');
      const factory2 = new MockComponentFactory('editor', 'mock');
      registry.registerFactory(factory1);
      
      // Act & Assert
      expect(() => {
        registry.registerFactory(factory2);
      }).toThrow(/already registered/);
      expect(errorHandler.errors.length).toBeGreaterThan(0);
    });
    
    it('should throw an error when registering a null factory', () => {
      // Act & Assert
      expect(() => {
        registry.registerFactory(null as any);
      }).toThrow();
      expect(errorHandler.errors.length).toBeGreaterThan(0);
    });
  });
  
  describe('getFactory', () => {
    it('should retrieve a registered factory', () => {
      // Arrange
      const factory = new MockComponentFactory('editor', 'mock');
      registry.registerFactory(factory);
      
      // Act
      const retrievedFactory = registry.getFactory('editor', 'mock');
      
      // Assert
      expect(retrievedFactory).toBe(factory);
    });
    
    it('should return undefined for an unregistered factory', () => {
      // Act
      const retrievedFactory = registry.getFactory('editor', 'nonexistent');
      
      // Assert
      expect(retrievedFactory).toBeUndefined();
    });
    
    it('should return undefined for an unregistered component type', () => {
      // Act
      const retrievedFactory = registry.getFactory('nonexistent', 'mock');
      
      // Assert
      expect(retrievedFactory).toBeUndefined();
    });
  });
  
  describe('getFactoriesForType', () => {
    it('should retrieve all factories for a component type', () => {
      // Arrange
      const factory1 = new MockComponentFactory('editor', 'mock1');
      const factory2 = new MockComponentFactory('editor', 'mock2');
      const factory3 = new MockComponentFactory('preview', 'mock');
      registry.registerFactory(factory1);
      registry.registerFactory(factory2);
      registry.registerFactory(factory3);
      
      // Act
      const editorFactories = registry.getFactoriesForType('editor');
      
      // Assert
      expect(editorFactories.length).toBe(2);
      expect(editorFactories).toContain(factory1);
      expect(editorFactories).toContain(factory2);
      expect(editorFactories).not.toContain(factory3);
    });
    
    it('should return an empty array for an unregistered component type', () => {
      // Act
      const factories = registry.getFactoriesForType('nonexistent');
      
      // Assert
      expect(factories).toEqual([]);
    });
  });
});