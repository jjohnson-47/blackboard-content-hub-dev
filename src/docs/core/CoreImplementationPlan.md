# Core Implementation Plan for DevPreview UI

This document outlines the current state of the core components and the plan for implementing the remaining core functionality of the DevPreview UI.

## Current State

### 1. Error Handling System

The error handling system has been significantly enhanced with the following capabilities:

- **Centralized Error Handling**: All errors are processed through the `ErrorHandler` class
- **Specialized Error Types**: Added support for various error types including `MATH_API` errors
- **Iframe Error Handling**: Dedicated method for handling errors that occur within iframes
- **Math API Error Handling**: Specialized handling for errors from math visualization tools
- **Event-Based Error Reporting**: Integration with the event bus for broadcasting error events
- **Error Recovery Mechanism**: Support for attempting recovery from certain error types
- **Comprehensive Testing**: Tests for all error handling scenarios

### 2. Service Container

The service container provides dependency injection capabilities:

- **Service Registration**: Register services with unique identifiers
- **Service Retrieval**: Get registered services by their identifiers
- **Service Existence Check**: Check if a service is registered

### 3. Event System

The event system enables decoupled communication between components:

- **Standard Event Bus**: Basic publish/subscribe functionality
- **Enhanced Event Bus**: Additional features like one-time subscriptions and debug mode

## Implementation Plan

### 1. Math API Integration Layer

#### Step 1: Define Math API Adapter Interface
**File:** `src/adapters/math/IMathApiAdapter.ts`

```typescript
/**
 * Common interface for all math API adapters
 * Provides a consistent way to interact with different math visualization tools
 */
export interface IMathApiAdapter {
  /**
   * Initialize the math API
   * @param container The container element where the math visualization will be rendered
   * @param options Initialization options specific to the math API
   * @returns Promise that resolves when initialization is complete
   */
  initialize(container: HTMLElement, options?: any): Promise<void>;
  
  /**
   * Update the math content
   * @param content The math content to render (format depends on the specific API)
   * @returns Promise that resolves when the update is complete
   */
  updateContent(content: string): Promise<void>;
  
  /**
   * Get the current state of the math visualization
   * @returns The current state as a serializable object
   */
  getState(): any;
  
  /**
   * Set the state of the math visualization
   * @param state The state to set
   * @returns Promise that resolves when the state is set
   */
  setState(state: any): Promise<void>;
  
  /**
   * Clean up resources used by the math API
   */
  destroy(): void;
}
```

#### Step 2: Implement Desmos Adapter
**File:** `src/adapters/math/DesmosAdapter.ts`

This adapter will implement the `IMathApiAdapter` interface for the Desmos API, handling initialization, content updates, state management, and cleanup.

#### Step 3: Implement GeoGebra Adapter
**File:** `src/adapters/math/GeoGebraAdapter.ts`

This adapter will implement the `IMathApiAdapter` interface for the GeoGebra API.

### 2. Iframe Communication Bridge

#### Step 1: Define Iframe Bridge Interface
**File:** `src/events/IIframeBridge.ts`

```typescript
import { IEventBus } from './IEventBus';

/**
 * Interface for bridging events between parent and iframe
 */
export interface IIframeBridge {
  /**
   * Connect the bridge to an iframe
   * @param iframe The iframe element to connect to
   * @param targetOrigin The origin to use for postMessage communication
   * @returns Promise that resolves when the connection is established
   */
  connect(iframe: HTMLIFrameElement, targetOrigin: string): Promise<void>;
  
  /**
   * Send an event to the iframe
   * @param eventName The name of the event
   * @param data The event data
   */
  sendToIframe(eventName: string, data: any): void;
  
  /**
   * Send an event to the parent window
   * @param eventName The name of the event
   * @param data The event data
   */
  sendToParent(eventName: string, data: any): void;
  
  /**
   * Disconnect the bridge
   */
  disconnect(): void;
  
  /**
   * Get the event bus used by this bridge
   * @returns The event bus instance
   */
  getEventBus(): IEventBus;
}
```

#### Step 2: Implement Iframe Bridge
**File:** `src/events/IframeBridge.ts`

This class will implement the `IIframeBridge` interface, handling secure communication between the parent window and iframes using postMessage.

### 3. Preview Component

#### Step 1: Define Preview Interface
**File:** `src/components/IPreview.ts`

```typescript
import { EditorContent } from './IEditor';

/**
 * Preview options interface
 */
export interface PreviewOptions {
  /**
   * Whether to automatically refresh the preview when content changes
   */
  autoRefresh?: boolean;
  
  /**
   * Delay in milliseconds before refreshing the preview after content changes
   */
  delayMs?: number;
  
  /**
   * Whether to sandbox the iframe
   */
  sandbox?: boolean;
  
  /**
   * Additional HTML to include in the preview (e.g., CSS, JS libraries)
   */
  additionalHtml?: string;
}

/**
 * Preview interface
 */
export interface IPreview {
  /**
   * Update the preview with new content
   * @param content The content to preview
   */
  update(content: EditorContent): void;
  
  /**
   * Refresh the preview with the current content
   */
  refresh(): void;
  
  /**
   * Get the iframe element used for the preview
   * @returns The iframe element
   */
  getIframe(): HTMLIFrameElement;
  
  /**
   * Set preview options
   * @param options The options to set
   */
  setOptions(options: Partial<PreviewOptions>): void;
  
  /**
   * Clean up resources used by the preview
   */
  destroy(): void;
}
```

#### Step 2: Implement Preview Component
**File:** `src/components/Preview.ts`

This class will implement the `IPreview` interface, handling the rendering of content in an iframe and managing the preview lifecycle.

### 4. Editor Component

#### Step 1: Define Editor Interface
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
 * Editor change listener type
 */
export type EditorChangeListener = (data: EditorContent) => void;

/**
 * Editor options interface
 */
export interface EditorOptions {
  /**
   * Editor theme
   */
  theme?: string;
  
  /**
   * Whether to wrap lines
   */
  lineWrapping?: boolean;
  
  /**
   * Whether to show line numbers
   */
  lineNumbers?: boolean;
  
  /**
   * Tab size in spaces
   */
  tabSize?: number;
}

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
  
  /**
   * Set editor options
   * @param options The options to set
   */
  setOptions(options: Partial<EditorOptions>): void;
  
  /**
   * Clean up resources used by the editor
   */
  destroy(): void;
}
```

#### Step 2: Implement Editor Component
**File:** `src/components/Editor.ts`

This class will implement the `IEditor` interface, providing code editing capabilities for HTML, CSS, and JavaScript.

### 5. DevPreview Component

#### Step 1: Define DevPreview Interface
**File:** `src/components/IDevPreview.ts`

```typescript
import { IEditor, EditorContent, EditorOptions } from './IEditor';
import { IPreview, PreviewOptions } from './IPreview';

/**
 * DevPreview options interface
 */
export interface DevPreviewOptions {
  /**
   * Editor options
   */
  editorOptions?: EditorOptions;
  
  /**
   * Preview options
   */
  previewOptions?: PreviewOptions;
  
  /**
   * Layout orientation ('horizontal' or 'vertical')
   */
  orientation?: 'horizontal' | 'vertical';
  
  /**
   * Initial content
   */
  initialContent?: EditorContent;
}

/**
 * DevPreview interface
 */
export interface IDevPreview {
  /**
   * Get the editor component
   * @returns The editor component
   */
  getEditor(): IEditor;
  
  /**
   * Get the preview component
   * @returns The preview component
   */
  getPreview(): IPreview;
  
  /**
   * Set DevPreview options
   * @param options The options to set
   */
  setOptions(options: Partial<DevPreviewOptions>): void;
  
  /**
   * Save the current content
   * @param id Optional ID to save as
   * @returns Promise that resolves when the save is complete
   */
  saveContent(id?: string): Promise<void>;
  
  /**
   * Load content
   * @param id The ID of the content to load
   * @returns Promise that resolves when the load is complete
   */
  loadContent(id: string): Promise<void>;
  
  /**
   * Clean up resources used by the DevPreview
   */
  destroy(): void;
}
```

#### Step 2: Implement DevPreview Component
**File:** `src/components/DevPreview.ts`

This class will implement the `IDevPreview` interface, integrating the editor and preview components into a cohesive development environment.

### 6. Factory System

#### Step 1: Define Factory Interfaces
**File:** `src/factories/IComponentFactory.ts`

```typescript
import { IEditor, EditorOptions } from '../components/IEditor';
import { IPreview, PreviewOptions } from '../components/IPreview';
import { IDevPreview, DevPreviewOptions } from '../components/IDevPreview';
import { IServiceContainer } from '../core/IServiceContainer';

/**
 * Component factory interface
 */
export interface IComponentFactory<T = any, TConfig = any> {
  /**
   * Create a component instance
   * @param config Component configuration
   * @param container Service container for dependency injection
   * @returns Component instance
   */
  create(config: TConfig, container: IServiceContainer): T;
  
  /**
   * Get the component type this factory creates
   * @returns Component type string
   */
  getComponentType(): string;
  
  /**
   * Get the factory ID
   * @returns Factory ID string
   */
  getFactoryId(): string;
}

/**
 * Editor factory interface
 */
export interface IEditorFactory extends IComponentFactory<IEditor, EditorOptions> {
  getComponentType(): 'editor';
}

/**
 * Preview factory interface
 */
export interface IPreviewFactory extends IComponentFactory<IPreview, PreviewOptions> {
  getComponentType(): 'preview';
}

/**
 * DevPreview factory interface
 */
export interface IDevPreviewFactory extends IComponentFactory<IDevPreview, DevPreviewOptions> {
  getComponentType(): 'devpreview';
}
```

#### Step 2: Implement Factory Registry
**File:** `src/factories/FactoryRegistry.ts`

This class will manage the registration and retrieval of component factories.

### 7. Bootstrap System

#### Step 1: Define Bootstrap Interface
**File:** `src/core/IBootstrap.ts`

```typescript
import { IServiceContainer } from './IServiceContainer';
import { IDevPreview } from '../components/IDevPreview';

/**
 * Bootstrap options interface
 */
export interface BootstrapOptions {
  /**
   * Container element for the DevPreview
   */
  container: HTMLElement;
  
  /**
   * Initial content
   */
  initialContent?: {
    html: string;
    css: string;
    js: string;
  };
  
  /**
   * Editor options
   */
  editorOptions?: {
    theme?: string;
    lineWrapping?: boolean;
    lineNumbers?: boolean;
    tabSize?: number;
  };
  
  /**
   * Preview options
   */
  previewOptions?: {
    autoRefresh?: boolean;
    delayMs?: number;
    sandbox?: boolean;
  };
}

/**
 * Bootstrap interface
 */
export interface IBootstrap {
  /**
   * Initialize the DevPreview UI
   * @param options Bootstrap options
   * @returns Promise that resolves to the DevPreview instance
   */
  initialize(options: BootstrapOptions): Promise<IDevPreview>;
  
  /**
   * Get the service container
   * @returns The service container instance
   */
  getServiceContainer(): IServiceContainer;
}
```

#### Step 2: Implement Bootstrap
**File:** `src/core/Bootstrap.ts`

This class will implement the `IBootstrap` interface, handling the initialization of the DevPreview UI and setting up the service container with all required dependencies.

## Implementation Timeline

1. **Week 1: Math API Integration Layer**
   - Define and implement the Math API adapter interface
   - Implement the Desmos adapter
   - Implement the GeoGebra adapter
   - Write tests for the adapters

2. **Week 2: Iframe Communication Bridge**
   - Define and implement the Iframe Bridge interface
   - Implement secure postMessage communication
   - Add event forwarding between parent and iframe
   - Write tests for the bridge

3. **Week 3: Preview Component**
   - Define and implement the Preview interface
   - Implement iframe content rendering
   - Add support for refreshing content
   - Write tests for the Preview component

4. **Week 4: Editor Component**
   - Define and implement the Editor interface
   - Implement code editing capabilities
   - Add syntax highlighting and formatting
   - Write tests for the Editor component

5. **Week 5: DevPreview Component**
   - Define and implement the DevPreview interface
   - Integrate Editor and Preview components
   - Add content saving and loading
   - Write tests for the DevPreview component

6. **Week 6: Factory System and Bootstrap**
   - Implement the Factory Registry
   - Implement the Bootstrap system
   - Create a simple demo application
   - Write integration tests

## Conclusion

This implementation plan provides a roadmap for building the core components of the DevPreview UI. By following this plan, we will create a robust, maintainable, and extensible system for developing and previewing interactive educational content with math visualization tools.