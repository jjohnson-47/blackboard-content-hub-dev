# Core Components Documentation

This directory contains documentation for the core components of the DevPreview UI project. These components form the foundation of the application and provide essential functionality for the editor, preview, and math API integration.

## Overview

**Status: Complete**

The DevPreview UI core consists of several key components:

1. **Service Container**: Dependency injection system for managing services
2. **Event System**: Event bus for communication between components
3. **Error Handling**: Centralized error handling with specialized handlers
4. **Math API Adapters**: Adapters for integrating with math visualization tools
5. **Iframe Communication**: Bridge for secure communication with iframes
6. **Component Factories**: Factory system for creating UI components
7. **Bootstrap System**: Initialization and configuration of the application

## Architecture Decision Records (ADRs)

**Status: Complete**

The following ADRs document the key architectural decisions for the core components:

- [Math API Adapter Pattern](./MathApiAdapterADR.md): Defines the adapter pattern for integrating with math visualization tools
- [Iframe Bridge](./IframeBridgeADR.md): Describes the approach for secure iframe communication

## Implementation Plans

**Status: Complete**

- [Core Implementation Plan](./CoreImplementationPlan.md): Detailed plan for implementing the core components

## Component Documentation

### Service Container

**Status: Complete**

The Service Container provides dependency injection capabilities, allowing components to access shared services without tight coupling. It supports:

- Registration of services with unique identifiers
- Retrieval of services by identifier
- Checking if a service is registered

### Event System

**Status: Complete**

The Event System enables decoupled communication between components through an event bus. It includes:

- Standard event subscription and publishing
- Enhanced features like one-time subscriptions and debug mode
- Event bridging between parent window and iframes

### Error Handling

**Status: Complete**

The Error Handling system provides centralized error management with:

- Specialized error types for different scenarios
- Iframe error handling
- Math API error handling
- Error recovery mechanisms
- Integration with the event system for error reporting

### Math API Adapters

**Status: In Progress**

The Math API Adapters provide a consistent interface for interacting with different math visualization tools:

- Common interface for initialization, content updates, and state management
- Specialized implementations for each supported math API (Desmos, GeoGebra, etc.)
- Error handling specific to math APIs

### Iframe Communication

**Status: In Progress**

The Iframe Communication Bridge enables secure communication between the parent window and iframes:

- Secure postMessage communication with origin validation
- Event forwarding between parent and iframe
- Integration with the event bus
- Error handling for iframe communication issues

### Component Factories

**Status: Complete**

The Component Factory system provides a flexible way to create UI components:

- Factory interfaces for different component types
- Factory registry for managing multiple factories
- Support for different component configurations

### Bootstrap System

**Status: Planned**

The Bootstrap System handles the initialization and configuration of the application:

- Service registration
- Component creation
- Configuration loading
- Error handling setup

## Development Guidelines

**Status: Complete**

When working with core components, follow these guidelines:

1. **Interface-First Development**: Define interfaces before implementing components
2. **Error Handling**: Use the centralized error handling system for all errors
3. **Event-Based Communication**: Use the event bus for communication between components
4. **Clean Separation**: Maintain clean separation between components through interfaces
5. **Testing**: Write comprehensive tests for all implementations
6. **Documentation**: Document all interfaces and non-obvious implementation details
7. **Performance**: Consider performance implications, especially for iframe communication

## Related Documentation

**Status: Complete**

- [Error Handling Architecture](../architecture/ErrorHandlingArchitecture.md)
- [Event Bus ADR](../events/EventBusADR.md)
- [Factory Architecture ADR](../factories/FactoryArchitectureADR.md)