# Detailed Implementation Plan for DevPreview UI Core Components

Below is a comprehensive implementation plan for the core components you need to build. I'll follow your co-located interfaces structure and provide code templates based on your master plan.

## 0. Domain-Specific Naming Implementation

Before proceeding with the core components implementation, we need to establish and implement our domain-specific naming strategy in accordance with the Architecture Decision Record for naming conventions.

### Step 1: Update Model Naming
**File:** `src/models/ComponentMetadata.ts` (renamed from Component.ts)

```typescript
export type ComponentLocationType = 'local' | 'remote';

/**
 * Component metadata model
 * Represents the descriptive information about a component
 */
export interface ComponentMetadata {
  id: string;
  name: string;
  locationType: ComponentLocationType;
  lastEdited?: Date;
  tags?: string[];
}

/**
 * @deprecated Use ComponentMetadata instead
 */
export type Component = ComponentMetadata;
```

**File:** `src/models/ComponentContent.ts` (renamed from ComponentData.ts)

```typescript
/**
 * Component Content model interface
 * Represents the actual content of a component in the storage system
 */
export interface StorageComponentContent {
  /**
   * HTML content of the component
   */
  html: string;
  
  /**
   * CSS content of the component
   */
  css: string;
  
  /**
   * JavaScript content of the component
   */
  js: string;
  
  /**
   * Optional additional metadata for the component
   * This can store configuration, settings, or other component-specific data
   */
  metadata?: Record<string, any>;
}

/**
 * @deprecated Use StorageComponentContent instead
 */
export type ComponentContentData = StorageComponentContent;

/**
 * @deprecated Use StorageComponentContent instead to avoid naming conflicts with EditorContent
 */
export type ComponentData = StorageComponentContent;
```

### Step 2: Update Editor Interface
**File:** `src/components/IEditor.ts`

```typescript
/**
 * Editor content data structure
 */
export interface EditorContent {
  html: string;
  css: string;
  js: string;
}

/**
 * @deprecated Use EditorContent instead
 */
export type ComponentData = EditorContent;

/**
 * Editor change listener type
 */
export type EditorChangeListener = (data: EditorContent) => void;

/**
 * Editor interface
 */
export interface IEditor {
  /**
   * Get editor content
   * @returns Current editor content
   */
  getContent(): EditorContent;
  
  /**
   * Set editor content
   * @param data Content to set
   */
  setContent(data: EditorContent): void;
  
  /**
   * Format code in the editor
   */
  formatCode(): void;
  
  /**
   * Add change event listener
   * @param listener Function to call when content changes
   * @returns Function to remove the listener
   */
  addEventListener(listener: EditorChangeListener): () => void;
}
```

### Step 3: Update Models Index
**File:** `src/models/index.ts`

```typescript
/**
 * Models module exports
 */

// Component models with domain-specific naming
export { ComponentMetadata, Component } from './ComponentMetadata';
export {
  StorageComponentContent,
  // Legacy aliases for backward compatibility
  ComponentContentData,
  ComponentData
} from './ComponentContent';
```

### Step 4: Update Service Interface
**File:** `src/services/IStorageService.ts`

```typescript
import { ComponentMetadata } from '../models/ComponentMetadata';
import { StorageComponentContent } from '../models/index';

/**
 * Storage Service Interface
 * Provides methods for persistent storage of components and their content
 */
export interface IStorageService {
  /**
   * Saves component data to storage
   * @param metadata Component metadata
   * @param content Component content data
   * @returns True if save was successful
   */
  saveComponent(metadata: ComponentMetadata, content: StorageComponentContent): boolean;
  
  /**
   * Loads component data from storage
   * @param id Component ID
   * @returns Component content or throws if not found
   * @throws AppError with type ErrorType.STORAGE if component not found
   */
  loadComponent(id: string): StorageComponentContent;
  
  /**
   * Gets the last edited component
   * @returns Component metadata or null if no components exist
   */
  getLastEditedComponent(): ComponentMetadata | null;
  
  /**
   * Gets all locally stored components
   * @returns Array of component metadata
   */
  getAllLocalComponents(): ComponentMetadata[];
  
  /**
   * Deletes a component from storage
   * @param id Component ID
   * @returns True if deletion was successful
   */
  deleteComponent(id: string): boolean;
}
```

## 1. Error Handler Interface & Implementation

### Step 1: Update IErrorHandler Interface
**File:** `src/errors/IErrorHandler.ts`

```typescript
import { AppError, ErrorType } from './ErrorHandler';

export interface IErrorHandler {
  /**
   * Handles application errors
   * @param error The error to handle (either a standard Error or AppError)
   */
  handle(error: Error | AppError): void;
  
  /**
   * Creates and handles an application error
   * @param type Error type
   * @param message Error message
   * @param details Optional error details
   */
  createAndHandle(type: ErrorType, message: string, details?: any): void;
  
  /**
   * Handle errors that occur within iframes
   * @param source The iframe element or source identifier
   * @param message Error message
   * @param details Optional error details
   */
  handleIframeError(source: HTMLIFrameElement | string, message: string, details?: any): void;
  
  /**
   * Handle errors that occur within math API integrations
   * @param apiType The math API type (e.g., 'desmos', 'geogebra')
   * @param message Error message
   * @param details Optional error details
   */
  handleMathApiError(apiType: string, message: string, details?: any): void;
  
  /**
   * Attempt to recover from an error
   * @param errorType The type of error to recover from
   * @param context Recovery context information
   * @returns True if recovery was attempted
   */
  attemptRecovery(errorType: ErrorType, context: any): boolean;
}
```

### Step 2: Ensure ErrorHandler Implementation
**File:** `src/errors/ErrorHandler.ts`

```typescript
import { IErrorHandler } from './IErrorHandler';

export enum ErrorType {
  INITIALIZATION = 'initialization',
  NETWORK = 'network',
  STORAGE = 'storage',
  VALIDATION = 'validation',
  RUNTIME = 'runtime',
  FACTORY = 'factory',
  FACTORY_REGISTRATION = 'factory-registration',
  COMPONENT_CREATION = 'component-creation',
  MATH_API = 'math-api'
}

export enum ErrorEventType {
  ERROR_OCCURRED = 'error:occurred',
  COMPONENT_ERROR = 'error:component',
  NETWORK_ERROR = 'error:network',
  VALIDATION_ERROR = 'error:validation',
  IFRAME_ERROR = 'error:iframe',
  FACTORY_ERROR = 'error:factory',
  MATH_API_ERROR = 'error:math-api',
  RECOVERY_ATTEMPT = 'error:recovery'
}

export class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ErrorHandler implements IErrorHandler {
  private readonly toast: any;
  private readonly eventBus?: IEventBus;
  
  constructor(toast?: any, eventBus?: IEventBus) {
    this.toast = toast;
    this.eventBus = eventBus;
  }
  
  handle(error: AppError | Error): void {
    const appError = error instanceof AppError ? error :
      new AppError(ErrorType.RUNTIME, error.message);
    
    console.error(`[${appError.type}] ${appError.message}`, appError.details);
    
    if (this.toast) {
      this.toast.error('Error', appError.message);
    } else if (typeof window !== 'undefined' && (window as any).Toast) {
      // Use global Toast if available and not injected
      (window as any).Toast.error('Error', appError.message);
    }
    
    // Broadcast error event if EventBus is available
    if (this.eventBus) {
      // Emit a general error event
      this.eventBus.emit(ErrorEventType.ERROR_OCCURRED, {
        type: appError.type,
        message: appError.message,
        details: appError.details,
        timestamp: new Date()
      });
      
      // Emit a type-specific error event
      this.emitTypedErrorEvent(appError);
    }
  }
  
  createAndHandle(type: ErrorType, message: string, details?: any): void {
    const error = new AppError(type, message, details);
    this.handle(error);
  }
  
  handleIframeError(source: HTMLIFrameElement | string, message: string, details?: any): void {
    const sourceIdentifier = typeof source === 'string'
      ? source
      : source.src || 'unknown-iframe';
      
    const error = new AppError(
      ErrorType.RUNTIME,
      `Error in iframe: ${message}`,
      { source: sourceIdentifier, ...details }
    );
    
    this.handle(error);
    
    // Emit iframe-specific error event
    if (this.eventBus) {
      this.eventBus.emit(ErrorEventType.IFRAME_ERROR, {
        source: sourceIdentifier,
        message,
        details,
        timestamp: new Date()
      });
    }
  }
  
  handleMathApiError(apiType: string, message: string, details?: any): void {
    const error = new AppError(
      ErrorType.MATH_API,
      `Error in ${apiType} API: ${message}`,
      { apiType, ...details }
    );
    
    this.handle(error);
    
    // Emit math API-specific error event
    if (this.eventBus) {
      this.eventBus.emit(ErrorEventType.MATH_API_ERROR, {
        apiType,
        message,
        details,
        timestamp: new Date()
      });
    }
  }
  
  attemptRecovery(errorType: ErrorType, context: any): boolean {
    if (this.eventBus) {
      this.eventBus.emit(ErrorEventType.RECOVERY_ATTEMPT, {
        errorType,
        context,
        timestamp: new Date()
      });
      return true;
    }
    return false;
  }
  
  private emitTypedErrorEvent(error: AppError): void {
    if (!this.eventBus) return;

    // Map error type to specific event type
    let eventType: string;
    switch (error.type) {
      case ErrorType.NETWORK:
        eventType = ErrorEventType.NETWORK_ERROR;
        break;
      case ErrorType.VALIDATION:
        eventType = ErrorEventType.VALIDATION_ERROR;
        break;
      case ErrorType.FACTORY:
      case ErrorType.FACTORY_REGISTRATION:
      case ErrorType.COMPONENT_CREATION:
        eventType = ErrorEventType.FACTORY_ERROR;
        break;
      case ErrorType.MATH_API:
        eventType = ErrorEventType.MATH_API_ERROR;
        break;
      default:
        // For other types, we already emitted the general error event
        return;
    }

    // Emit the type-specific event
    this.eventBus.emit(eventType, {
      type: error.type,
      message: error.message,
      details: error.details,
      timestamp: new Date()
    });
  }
}
```

### Step 3: Create Test for ErrorHandler
**File:** `src/errors/__tests__/ErrorHandler.test.ts`

```typescript
import { ErrorHandler, AppError, ErrorType, ErrorEventType } from '../ErrorHandler';
import { IEventBus } from '../../events/IEventBus';

describe('ErrorHandler', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let mockEventBus: IEventBus;
  
  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockEventBus = {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    };
  });
  
  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllMocks();
  });
  
  it('should log AppError with its type and message', () => {
    const errorHandler = new ErrorHandler();
    const appError = new AppError(ErrorType.NETWORK, 'Network failed');
    
    errorHandler.handle(appError);
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[network] Network failed', 
      undefined
    );
  });
  
  it('should convert standard Error to AppError with RUNTIME type', () => {
    const errorHandler = new ErrorHandler();
    const error = new Error('Standard error');
    
    errorHandler.handle(error);
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[runtime] Standard error', 
      undefined
    );
  });
  
  it('should use toast service if provided', () => {
    const toastMock = { error: jest.fn() };
    const errorHandler = new ErrorHandler(toastMock);
    const error = new Error('Test error');
    
    errorHandler.handle(error);
    
    expect(toastMock.error).toHaveBeenCalledWith('Error', 'Test error');
  });
  
  it('should emit events through event bus if provided', () => {
    const errorHandler = new ErrorHandler(undefined, mockEventBus);
    const appError = new AppError(ErrorType.NETWORK, 'Network error');
    
    errorHandler.handle(appError);
    
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      ErrorEventType.ERROR_OCCURRED,
      expect.objectContaining({
        type: ErrorType.NETWORK,
        message: 'Network error',
        timestamp: expect.any(Date)
      })
    );
    
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      ErrorEventType.NETWORK_ERROR,
      expect.objectContaining({
        type: ErrorType.NETWORK,
        message: 'Network error',
        timestamp: expect.any(Date)
      })
    );
  });
  
  it('should handle iframe errors with proper event emission', () => {
    const errorHandler = new ErrorHandler(undefined, mockEventBus);
    const iframe = document.createElement('iframe');
    iframe.src = 'https://example.com';
    
    errorHandler.handleIframeError(iframe, 'Iframe load failed');
    
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      ErrorEventType.IFRAME_ERROR,
      expect.objectContaining({
        source: 'https://example.com',
        message: 'Iframe load failed',
        timestamp: expect.any(Date)
      })
    );
  });
  
  it('should handle math API errors with proper event emission', () => {
    const errorHandler = new ErrorHandler(undefined, mockEventBus);
    
    errorHandler.handleMathApiError('desmos', 'Graph rendering failed', { errorCode: 'RENDER_ERROR' });
    
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      ErrorEventType.MATH_API_ERROR,
      expect.objectContaining({
        apiType: 'desmos',
        message: 'Graph rendering failed',
        details: expect.objectContaining({ errorCode: 'RENDER_ERROR' }),
        timestamp: expect.any(Date)
      })
    );
  });
  
  it('should attempt recovery and emit recovery event', () => {
    const errorHandler = new ErrorHandler(undefined, mockEventBus);
    const context = { component: 'calculator', retryCount: 1 };
    
    const result = errorHandler.attemptRecovery(ErrorType.MATH_API, context);
    
    expect(result).toBe(true);
    expect(mockEventBus.emit).toHaveBeenCalledWith(
      ErrorEventType.RECOVERY_ATTEMPT,
      expect.objectContaining({
        errorType: ErrorType.MATH_API,
        context,
        timestamp: expect.any(Date)
      })
    );
  });
  
  it('should return false from attemptRecovery when no event bus is available', () => {
    const errorHandler = new ErrorHandler();
    
    const result = errorHandler.attemptRecovery(ErrorType.MATH_API, { component: 'calculator' });
    
    expect(result).toBe(false);
  });
});
```

## 2. Storage Service Interface & Implementation

### Step 1: Use Updated Component Models
**Note:** Component models have already been created as part of the domain-specific naming implementation in Step 0.

### Step 2: Create Storage Service Interface
**File:** `src/services/IStorageService.ts`

```typescript
import { Component } from '../models/Component';
import { ComponentData } from '../models/ComponentData';

export interface IStorageService {
  /**
   * Saves component data to storage
   * @param component Component metadata
   * @param data Component content data
   * @returns True if save was successful
   */
  saveComponent(component: Component, data: ComponentData): boolean;
  
  /**
   * Loads component data from storage
   * @param id Component ID
   * @returns Component data or throws if not found
   */
  loadComponent(id: string): ComponentData;
  
  /**
   * Gets the last edited component
   * @returns Component or null if no components exist
   */
  getLastEditedComponent(): Component | null;
  
  /**
   * Gets all locally stored components
   * @returns Array of component metadata
   */
  getAllLocalComponents(): Component[];
  
  /**
   * Deletes a component from storage
   * @param id Component ID
   * @returns True if deletion was successful
   */
  deleteComponent(id: string): boolean;
}
```

### Step 2: Update Storage Service Interface
**Note:** The interface has already been updated as part of the domain-specific naming implementation in Step 0.

### Step 3: Implement Storage Service with Domain-Specific Names
**File:** `src/services/StorageService.ts`

```typescript
import { IStorageService } from './IStorageService';
import { IStorageAdapter } from '../adapters/IStorageAdapter';
import { IErrorHandler } from '../errors/IErrorHandler';
import { ComponentMetadata } from '../models/ComponentMetadata';
import { StorageComponentContent } from '../models/index';
import { AppError, ErrorType } from '../errors/ErrorHandler';

export class StorageService implements IStorageService {
  private readonly COMPONENT_LIST_KEY = 'devpreview_components';
  private readonly COMPONENT_DATA_PREFIX = 'devpreview_component_';
  private readonly LAST_EDITED_KEY = 'devpreview_last_edited';
  
  constructor(
    private storageAdapter: IStorageAdapter,
    private errorHandler: IErrorHandler
  ) {}
  
  saveComponent(metadata: ComponentMetadata, content: StorageComponentContent): boolean {
    try {
      // Update last edited time
      metadata.lastEdited = new Date();
      
      // Save component content
      const contentKey = this.COMPONENT_DATA_PREFIX + metadata.id;
      this.storageAdapter.setItem(contentKey, content);
      
      // Update component in list or add if new
      const componentList = this.getAllLocalComponents();
      const index = componentList.findIndex(c => c.id === metadata.id);
      
      if (index >= 0) {
        componentList[index] = metadata;
      } else {
        componentList.push(metadata);
      }
      
      this.storageAdapter.setItem(this.COMPONENT_LIST_KEY, componentList);
      
      // Update last edited component
      this.storageAdapter.setItem(this.LAST_EDITED_KEY, metadata.id);
      
      return true;
    } catch (error) {
      this.errorHandler.handle(
        new AppError(
          ErrorType.STORAGE,
          `Failed to save component: ${metadata.id}`,
          error
        )
      );
      return false;
    }
  }
  
  loadComponent(id: string): StorageComponentContent {
    try {
      const contentKey = this.COMPONENT_DATA_PREFIX + id;
      const content = this.storageAdapter.getItem(contentKey);
      
      if (!content) {
        throw new AppError(
          ErrorType.STORAGE,
          `Component not found: ${id}`
        );
      }
      
      // Update last edited component
      this.storageAdapter.setItem(this.LAST_EDITED_KEY, id);
      
      return content;
    } catch (error) {
      this.errorHandler.handle(error instanceof AppError ? error :
        new AppError(
          ErrorType.STORAGE,
          `Failed to load component: ${id}`,
          error
        )
      );
      throw error;
    }
  }
  
  getLastEditedComponent(): ComponentMetadata | null {
    try {
      const lastEditedId = this.storageAdapter.getItem(this.LAST_EDITED_KEY);
      if (!lastEditedId) return null;
      
      const componentList = this.getAllLocalComponents();
      return componentList.find(c => c.id === lastEditedId) || null;
    } catch (error) {
      this.errorHandler.handle(
        new AppError(
          ErrorType.STORAGE,
          'Failed to get last edited component',
          error
        )
      );
      return null;
    }
  }
  
  getAllLocalComponents(): ComponentMetadata[] {
    try {
      const componentList = this.storageAdapter.getItem(this.COMPONENT_LIST_KEY);
      return componentList || [];
    } catch (error) {
      this.errorHandler.handle(
        new AppError(
          ErrorType.STORAGE,
          'Failed to get all components',
          error
        )
      );
      return [];
    }
  }
  
  deleteComponent(id: string): boolean {
    try {
      // Remove component data
      const dataKey = this.COMPONENT_DATA_PREFIX + id;
      this.storageAdapter.removeItem(dataKey);
      
      // Remove from component list
      const components = this.getAllLocalComponents();
      const filteredComponents = components.filter(c => c.id !== id);
      this.storageAdapter.setItem(this.COMPONENT_LIST_KEY, filteredComponents);
      
      // Update last edited if needed
      const lastEditedId = this.storageAdapter.getItem(this.LAST_EDITED_KEY);
      if (lastEditedId === id && filteredComponents.length > 0) {
        this.storageAdapter.setItem(this.LAST_EDITED_KEY, filteredComponents[0].id);
      } else if (filteredComponents.length === 0) {
        this.storageAdapter.removeItem(this.LAST_EDITED_KEY);
      }
      
      return true;
    } catch (error) {
      this.errorHandler.handle(
        new AppError(
          ErrorType.STORAGE,
          `Failed to delete component: ${id}`,
          error
        )
      );
      return false;
    }
  }
}
```

### Step 4: Create Test for Storage Service
**File:** `src/services/__tests__/StorageService.test.ts`

```typescript
import { StorageService } from '../StorageService';
import { AppError, ErrorType } from '../../errors/ErrorHandler';
import { Component } from '../../models/Component';
import { ComponentData } from '../../models/ComponentData';

describe('StorageService', () => {
  const mockStorageAdapter: any = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
  };
  
  const mockErrorHandler: any = {
    handle: jest.fn()
  };
  
  let storageService: StorageService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    storageService = new StorageService(mockStorageAdapter, mockErrorHandler);
  });
  
  describe('saveComponent', () => {
    it('should save component data and update component list', () => {
      // Existing components
      mockStorageAdapter.getItem.mockReturnValueOnce([
        { id: 'existing', name: 'Existing', locationType: 'local' }
      ]);
      
      const component: Component = {
        id: 'test',
        name: 'Test Component',
        locationType: 'local'
      };
      
      const data: ComponentData = {
        html: '<div>Test</div>',
        css: 'div { color: red; }',
        js: 'console.log("test");'
      };
      
      const result = storageService.saveComponent(component, data);
      
      expect(result).toBe(true);
      expect(mockStorageAdapter.setItem).toHaveBeenCalledWith(
        'devpreview_component_test',
        data
      );
      expect(mockStorageAdapter.setItem).toHaveBeenCalledWith(
        'devpreview_components',
        expect.arrayContaining([
          { id: 'existing', name: 'Existing', locationType: 'local' },
          expect.objectContaining({ 
            id: 'test', 
            name: 'Test Component',
            lastEdited: expect.any(Date)
          })
        ])
      );
    });
    
    // Add more tests...
  });
  
  // Add tests for other methods...
});
```

## 3. API Service Interface & Implementation

### Step 1: Create API Service Interface with Domain-Specific Names
**File:** `src/services/IApiService.ts`

```typescript
import { ComponentMetadata } from '../models/ComponentMetadata';
import { StorageComponentContent } from '../models/index';

export interface IApiService {
  /**
   * Fetches a component from the server
   * @param id Component ID
   * @returns Promise resolving to component content
   */
  fetchComponent(id: string): Promise<StorageComponentContent>;
  
  /**
   * Saves a component to the server
   * @param metadata Component metadata
   * @param content Component content data
   * @returns Promise resolving to success status
   */
  saveComponent(metadata: ComponentMetadata, content: StorageComponentContent): Promise<boolean>;
  
  /**
   * Fetches all available components from the server
   * @returns Promise resolving to array of component metadata
   */
  fetchAllComponents(): Promise<ComponentMetadata[]>;
  
  /**
   * Deletes a component from the server
   * @param id Component ID
   * @returns Promise resolving to success status
   */
  deleteComponent(id: string): Promise<boolean>;
}
```

### Step 2: Implement API Service with Domain-Specific Names
**File:** `src/services/ApiService.ts`

```typescript
import { IApiService } from './IApiService';
import { IErrorHandler } from '../errors/IErrorHandler';
import { ComponentMetadata } from '../models/ComponentMetadata';
import { StorageComponentContent } from '../models/index';
import { AppError, ErrorType } from '../errors/ErrorHandler';

export class ApiService implements IApiService {
  private readonly API_BASE_URL = '/api/components';
  
  constructor(
    private errorHandler: IErrorHandler
  ) {}
  
  async fetchComponent(id: string): Promise<StorageComponentContent> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/${id}`);
      
      if (!response.ok) {
        throw new AppError(
          ErrorType.NETWORK,
          `Failed to fetch component: ${response.status} ${response.statusText}`,
          { id, status: response.status }
        );
      }
      
      return await response.json();
    } catch (error) {
      this.errorHandler.handle(
        error instanceof AppError ? error :
        new AppError(
          ErrorType.NETWORK,
          `Failed to fetch component: ${id}`,
          error
        )
      );
      throw error;
    }
  }
  
  async saveComponent(metadata: ComponentMetadata, content: StorageComponentContent): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/${metadata.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metadata,
          content
        })
      });
      
      if (!response.ok) {
        throw new AppError(
          ErrorType.NETWORK,
          `Failed to save component: ${response.status} ${response.statusText}`,
          { id: metadata.id, status: response.status }
        );
      }
      
      return true;
    } catch (error) {
      this.errorHandler.handle(
        error instanceof AppError ? error :
        new AppError(
          ErrorType.NETWORK,
          `Failed to save component: ${metadata.id}`,
          error
        )
      );
      return false;
    }
  }
  
  async fetchAllComponents(): Promise<ComponentMetadata[]> {
    try {
      const response = await fetch(this.API_BASE_URL);
      
      if (!response.ok) {
        throw new AppError(
          ErrorType.NETWORK,
          `Failed to fetch components: ${response.status} ${response.statusText}`,
          { status: response.status }
        );
      }
      
      return await response.json();
    } catch (error) {
      this.errorHandler.handle(
        error instanceof AppError ? error :
        new AppError(
          ErrorType.NETWORK,
          'Failed to fetch components',
          error
        )
      );
      return [];
    }
  }
  
  async deleteComponent(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new AppError(
          ErrorType.NETWORK,
          `Failed to delete component: ${response.status} ${response.statusText}`,
          { id, status: response.status }
        );
      }
      
      return true;
    } catch (error) {
      this.errorHandler.handle(
        error instanceof AppError ? error :
        new AppError(
          ErrorType.NETWORK,
          `Failed to delete component: ${id}`,
          error
        )
      );
      return false;
    }
  }
}
```

### Step 3: Create Test for API Service with Domain-Specific Names
**File:** `src/services/__tests__/ApiService.test.ts`

```typescript
import { ApiService } from '../ApiService';
import { ComponentMetadata } from '../../models/ComponentMetadata';
import { StorageComponentContent } from '../../models/index';
import { AppError, ErrorType } from '../../errors/ErrorHandler';

describe('ApiService', () => {
  const mockErrorHandler: any = {
    handle: jest.fn()
  };
  
  let apiService: ApiService;
  let fetchMock: jest.SpyInstance;
  
  beforeEach(() => {
    jest.clearAllMocks();
    apiService = new ApiService(mockErrorHandler);
    
    // Mock fetch
    global.fetch = jest.fn();
    fetchMock = jest.spyOn(global, 'fetch');
  });
  
  describe('fetchComponent', () => {
    it('should fetch component data successfully', async () => {
      const mockResponse = {
        json: jest.fn().mockResolvedValue({
          html: '<div>Test</div>',
          css: 'div { color: red; }',
          js: 'console.log("test");'
        }),
        ok: true
      };
      
      fetchMock.mockResolvedValue(mockResponse);
      
      const result = await apiService.fetchComponent('test-id');
      
      expect(fetchMock).toHaveBeenCalledWith('/api/components/test-id');
      expect(result).toEqual({
        html: '<div>Test</div>',
        css: 'div { color: red; }',
        js: 'console.log("test");'
      });
    });
    
    it('should handle fetch error', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found'
      };
      
      fetchMock.mockResolvedValue(mockResponse);
      
      await expect(apiService.fetchComponent('test-id')).rejects.toThrow();
      
      expect(mockErrorHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.NETWORK,
          message: expect.stringContaining('Failed to fetch component')
        })
      );
    });
    
    // Add more tests...
  });
  
  // Add tests for other methods...
});
```

## 4. Component Factory Interface & Implementation

### Step 1: Create Component Factory Interface
**File:** `src/factories/IComponentFactory.ts`

```typescript
import { IEditor } from '../components/IEditor';
import { IPreview } from '../components/IPreview';

export interface IEditorOptions {
  theme?: string;
  lineWrapping?: boolean;
  lineNumbers?: boolean;
  tabSize?: number;
}

export interface IPreviewOptions {
  autoRefresh?: boolean;
  delayMs?: number;
}

export interface IComponentFactory {
  /**
   * Creates an editor component
   * @param element The DOM element to mount the editor on
   * @param options Editor configuration options
   * @returns Editor instance
   */
  createEditor(element: HTMLElement, options: IEditorOptions): IEditor;
  
  /**
   * Creates a preview component
   * @param iframe The iframe element to use for preview
   * @param options Preview configuration options
   * @returns Preview instance
   */
  createPreview(iframe: HTMLIFrameElement, options: IPreviewOptions): IPreview;
}
```

### Step 2: Implement Component Factory
**File:** `src/factories/ComponentFactory.ts`

```typescript
import { IComponentFactory, IEditorOptions, IPreviewOptions } from './IComponentFactory';
import { IEditor } from '../components/IEditor';
import { IPreview } from '../components/IPreview';
import { IEventBus } from '../events/IEventBus';
import { IErrorHandler } from '../errors/IErrorHandler';
import { Editor } from '../components/Editor'; // You'll need to implement this
import { Preview } from '../components/Preview'; // You'll need to implement this

export class ComponentFactory implements IComponentFactory {
  constructor(
    private eventBus: IEventBus,
    private errorHandler: IErrorHandler
  ) {}

  createEditor(element: HTMLElement, options: IEditorOptions): IEditor {
    try {
      return new Editor(element, options, this.eventBus, this.errorHandler);
    } catch (error) {
      this.errorHandler.handle(error);
      throw error;
    }
  }
  
  createPreview(iframe: HTMLIFrameElement, options: IPreviewOptions): IPreview {
    try {
      return new Preview(iframe, options, this.eventBus, this.errorHandler);
    } catch (error) {
      this.errorHandler.handle(error);
      throw error;
    }
  }
}
```

### Step 3: Create Test for Component Factory
**File:** `src/factories/__tests__/ComponentFactory.test.ts`

```typescript
import { ComponentFactory } from '../ComponentFactory';
import { Editor } from '../../components/Editor';
import { Preview } from '../../components/Preview';

// Mock dependencies
jest.mock('../../components/Editor');
jest.mock('../../components/Preview');

describe('ComponentFactory', () => {
  const mockEventBus: any = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn()
  };
  
  const mockErrorHandler: any = {
    handle: jest.fn()
  };
  
  let factory: ComponentFactory;
  
  beforeEach(() => {
    jest.clearAllMocks();
    factory = new ComponentFactory(mockEventBus, mockErrorHandler);
  });
  
  describe('createEditor', () => {
    it('should create an Editor instance with correct dependencies', () => {
      const mockElement = document.createElement('div');
      const options = { theme: 'dracula', lineNumbers: true };
      
      const editor = factory.createEditor(mockElement, options);
      
      expect(Editor).toHaveBeenCalledWith(
        mockElement,
        options,
        mockEventBus,
        mockErrorHandler
      );
      expect(editor).toBeInstanceOf(Editor);
    });
    
    it('should handle errors during editor creation', () => {
      const mockError = new Error('Editor creation failed');
      (Editor as jest.Mock).mockImplementationOnce(() => {
        throw mockError;
      });
      
      const mockElement = document.createElement('div');
      const options = { theme: 'dracula' };
      
      expect(() => factory.createEditor(mockElement, options)).toThrow();
      expect(mockErrorHandler.handle).toHaveBeenCalledWith(mockError);
    });
  });
  
  // Add tests for createPreview...
});
```

## 5. Update Root Index.ts with Domain-Specific Naming

After implementing all the components with domain-specific naming, update the `src/index.ts` file:

```typescript
// Main entry point for the DevPreview UI library

// Core framework exports
export * from './core/ServiceContainer';
export * from './events/EventBus';
export * from './errors/ErrorHandler';
// export * from './core/Bootstrap'; // Not implemented yet

// Model exports with domain-specific naming
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
export * from './components/IEditor';
export * from './components/IPreview';
export * from './services/IStorageService';
export * from './services/IApiService';
export * from './adapters/IStorageAdapter';
export * from './events/IEventBus';
export * from './errors/IErrorHandler';
export * from './core/IServiceContainer';
export * from './factories/IComponentFactory';

// Implementation exports
export * from './services/StorageService';
export * from './services/ApiService';
export * from './factories/ComponentFactory';
```

## 6. Implementation Timeline

1. **Day 1: Domain-Specific Naming & Enhanced Error Handler**
   - Create Domain-Specific Naming ADR
   - Implement domain-specific model naming (ComponentMetadata, StorageComponentContent)
   - Update IErrorHandler interface with specialized error handling methods
   - Implement ErrorHandler with iframe and math API error handling capabilities
   - Add event-based error reporting through EventBus integration
   - Implement error recovery mechanism
   - Write comprehensive tests for all error handling scenarios

2. **Day 2: Storage Service with Domain-Specific Naming**
   - Update IStorageService interface with domain-specific types
   - Implement StorageService class using domain-specific naming
   - Write unit tests for StorageService

3. **Day 3: API Service with Domain-Specific Naming**
   - Implement IApiService interface with domain-specific types
   - Implement ApiService class using domain-specific naming
   - Write unit tests for ApiService

4. **Day 4: Component Factory with Editor Content**
   - Update IEditor interface to use EditorContent
   - Implement IComponentFactory interface
   - Create skeleton implementations of Editor and Preview
   - Write unit tests for ComponentFactory

5. **Day 5: Integration & Testing**
   - Update src/index.ts exports with explicit domain-specific naming
   - Create a simple integration test
   - Verify all components work together
   - Ensure backward compatibility for deprecated type aliases

This implementation plan builds the essential connective tissue for the DevPreview UI architecture with domain-specific naming to prevent ambiguity. The implementation order ensures that dependencies are built before the components that need them, while maintaining clear, self-explanatory interfaces that reduce the need for additional documentation.