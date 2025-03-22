# Documentation Index

- [Architecture Overview](architecture/DomainSpecificNamingADR.md)
- [Error Handling Architecture](architecture/ErrorHandlingArchitecture.md)
- [Linting Enforcement](architecture/LintingEnforcementADR.md)
- [Core Implementation Plan](core/CoreImplementationPlan.md)
- [Event Bus Documentation](events/EventBusADR.md)
- [Factories Documentation](factories/FactoryImplementationPlan.md)
- [Services Documentation](services/README.md)

---


# DevPreview UI Documentation

This directory contains architectural documentation, design decisions, and implementation guidelines for the DevPreview UI project.

## Documentation Structure

### Core Documentation

- [Master Plan](../master-plan.md) - Overall project structure and implementation approach
- [Current Implementation Plan](../current-implementation-plan.md) - Detailed implementation steps and timeline

### Architecture

The [architecture](./architecture/) directory contains documentation related to the overall system architecture:

- [Domain-Specific Naming ADR](./architecture/DomainSpecificNamingADR.md) - Design decisions for naming conventions
- [Domain-Specific Naming Guide](./architecture/DomainSpecificNamingGuide.md) - Practical guide for implementing naming conventions
- [Error Handling Architecture](./architecture/ErrorHandlingArchitecture.md) - Architecture of the error handling system
- [Linting Enforcement ADR](./architecture/LintingEnforcementADR.md) - Design decisions for linting rules
- [Linting Enforcement Implementation](./architecture/LintingEnforcementImplementation.md) - Implementation guide for linting rules

### Components

- Core components and their interactions
- Component architecture and responsibilities
- Component lifecycle

### Services

The [services](./services/) directory contains documentation for application services:

- [Storage Service](./services/StorageServiceArchitecture.md) - Architecture for persistent storage
  - [Storage Service ADR](./services/StorageServiceADR.md) - Design decisions for storage
  - [Storage Service Integration Patterns](./services/StorageServiceIntegrationPatterns.md) - How to use the service
  - [Storage Service Testing Strategy](./services/StorageServiceTestingStrategy.md) - Testing approach

### Errors

The [errors](./errors/) directory documents the error handling system:

- [Error Handler Overview](./errors/README.md) - Error handling system documentation
- [Error Handler ADR](./errors/ErrorHandlerADR.md) - Design decisions for error handling
- [Error Handler Testing Strategy](./errors/ErrorHandlerTestingStrategy.md) - Testing approach
- [Error Handler Integration Patterns](./errors/ErrorHandlerIntegrationPatterns.md) - How to use the error handler

## Documentation Guidelines

When adding documentation to this project, please follow these guidelines:

1. **File Location**: Place documentation in the appropriate subdirectory based on what it documents
2. **Markdown Format**: Use GitHub-flavored Markdown for all documentation
3. **Cross-References**: Use relative paths when linking to other documents
4. **Code Examples**: Include relevant code examples to illustrate patterns
5. **ADRs**: Follow the Architecture Decision Record format for all design decisions
6. **Testing Strategies**: Include testing approaches for each component/service

## Architecture Principles

The DevPreview UI architecture follows these core principles:

1. **Co-located Interfaces**: Interfaces are located with their implementations
2. **Dependency Injection**: Services are injected through the ServiceContainer
3. **Event-based Communication**: Components communicate via the EventBus
4. **Centralized Error Handling**: All errors are processed by the ErrorHandler
5. **Modular Design**: Components are modular and follow single responsibility principle

For questions about documentation or architecture, please reach out to the project architect.