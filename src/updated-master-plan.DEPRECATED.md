# Updated DevPreview UI Master Plan

This document updates the master plan to reflect the current state of the project and outlines the next steps for implementing the core components of the DevPreview UI.

## Current State

The project has made significant progress in several key areas:

1. **Architecture**: Established a co-located architecture pattern with interfaces and implementations in feature-specific directories.

2. **Error Handling System**: Enhanced with specialized handlers for iframe and math API errors, integrated with the event system for error reporting and recovery.

3. **Service Container**: Implemented a dependency injection system for managing services and dependencies.

4. **Event System**: Created a robust event bus for communication between components.

5. **Domain-Specific Naming**: Established clear naming conventions to prevent ambiguity and reduce naming collisions.

## Core Components Implementation Plan

The following core components need to be implemented according to the detailed plan in `src/docs/core/CoreImplementationPlan.md`:

### 1. Math API Integration Layer

A flexible adapter system for integrating with various math visualization tools:

- **IMathApiAdapter Interface**: Common interface for all math API adapters
- **Concrete Adapters**: Implementations for Desmos, GeoGebra, and other math visualization tools
- **Math API Factory**: Factory for creating the appropriate adapter based on content type

See the [Math API Adapter ADR](./docs/core/MathApiAdapterADR.md) for detailed design decisions.

### 2. Iframe Communication Bridge

A secure communication system between the parent window and iframes:

- **IIframeBridge Interface**: Methods for establishing connections and sending/receiving messages
- **IframeBridge Implementation**: Uses postMessage with proper origin validation
- **Event Bus Integration**: Forwards events between parent and iframe

See the [Iframe Bridge ADR](./docs/core/IframeBridgeADR.md) for detailed design decisions.

### 3. Preview Component

A component for rendering content in iframes:

- **IPreview Interface**: Methods for updating content and managing the preview lifecycle
- **Preview Implementation**: Handles iframe creation, content rendering, and refresh
- **Integration with Iframe Bridge**: Uses the bridge for communication with iframe content

### 4. Editor Component

A component for editing HTML, CSS, and JavaScript:

- **IEditor Interface**: Methods for getting/setting content and managing the editor lifecycle
- **Editor Implementation**: Provides code editing capabilities with syntax highlighting
- **Event Integration**: Emits events when content changes

### 5. DevPreview Component

A component that integrates the editor and preview:

- **IDevPreview Interface**: Methods for managing the overall development environment
- **DevPreview Implementation**: Coordinates the editor and preview components
- **Content Management**: Handles saving and loading content

### 6. Factory System

A flexible factory system for creating components:

- **IComponentFactory Interface**: Methods for creating components
- **Factory Registry**: Manages multiple factories
- **Specialized Factories**: For editors, previews, and other components

### 7. Bootstrap System

A system for initializing the application:

- **IBootstrap Interface**: Methods for initializing the application
- **Bootstrap Implementation**: Sets up the service container and creates components
- **Configuration**: Handles application configuration

## Directory Structure Updates

The current directory structure follows the co-located architecture pattern, but some adjustments are needed to accommodate the new core components:

```
src/
├── core/                   
│   ├── ServiceContainer.ts
│   ├── IServiceContainer.ts
│   ├── Bootstrap.ts
│   ├── IBootstrap.ts
│   └── ...
├── components/
│   ├── Editor/
│   │   ├── Editor.ts
│   │   ├── IEditor.ts
│   │   └── index.ts
│   ├── Preview/
│   │   ├── Preview.ts
│   │   ├── IPreview.ts
│   │   └── index.ts
│   ├── DevPreview/
│   │   ├── DevPreview.ts
│   │   ├── IDevPreview.ts
│   │   └── index.ts
│   └── ...
├── adapters/
│   ├── storage/
│   │   ├── IStorageAdapter.ts
│   │   ├── LocalStorageAdapter.ts
│   │   └── index.ts
│   ├── math/
│   │   ├── IMathApiAdapter.ts
│   │   ├── DesmosAdapter.ts
│   │   ├── GeoGebraAdapter.ts
│   │   └── index.ts
│   └── ...
├── events/
│   ├── EventBus.ts
│   ├── IEventBus.ts
│   ├── IIframeBridge.ts
│   ├── IframeBridge.ts
│   └── ...
├── errors/
│   ├── ErrorHandler.ts
│   ├── IErrorHandler.ts
│   ├── AppError.ts
│   └── ...
├── factories/
│   ├── IComponentFactory.ts
│   ├── ComponentFactory.ts
│   ├── FactoryRegistry.ts
│   └── ...
├── services/
│   ├── IStorageService.ts
│   ├── StorageService.ts
│   ├── IApiService.ts
│   ├── ApiService.ts
│   └── ...
├── docs/
│   ├── README.md
│   ├── architecture/
│   ├── core/
│   │   ├── CoreImplementationPlan.md
│   │   ├── MathApiAdapterADR.md
│   │   ├── IframeBridgeADR.md
│   │   └── README.md
│   ├── components/
│   ├── events/
│   ├── errors/
│   ├── factories/
│   ├── services/
│   └── ...
└── index.ts
```

## Implementation Timeline

The implementation timeline is detailed in the Core Implementation Plan, but here's a high-level overview:

1. **Week 1**: Math API Integration Layer
2. **Week 2**: Iframe Communication Bridge
3. **Week 3**: Preview Component
4. **Week 4**: Editor Component
5. **Week 5**: DevPreview Component
6. **Week 6**: Factory System and Bootstrap

## Next Steps

1. **Review Core Implementation Plan**: Ensure the plan aligns with the project goals and architecture.
2. **Implement Math API Adapter**: Start with the adapter interface and Desmos implementation.
3. **Implement Iframe Bridge**: Create the bridge for secure communication between parent and iframe.
4. **Develop Preview Component**: Build the preview component that renders content in iframes.
5. **Develop Editor Component**: Create the editor component with code editing capabilities.
6. **Integrate Components**: Combine the editor and preview into the DevPreview component.
7. **Implement Factory System**: Create the factory system for component creation.
8. **Create Bootstrap System**: Build the bootstrap system for application initialization.

## Conclusion

This updated master plan provides a roadmap for implementing the core components of the DevPreview UI. By following this plan, we will create a robust, maintainable, and extensible system for developing and previewing interactive educational content with math visualization tools.

The plan builds on the existing architecture and components, while adding new capabilities for math API integration, iframe communication, and component creation. The result will be a powerful yet intuitive iframe editor for math visualization tools.