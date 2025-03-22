Below is an **updated master plan** reflecting the transition from the original architecture approach to the current approach. The primary changes include co-locating interfaces with their implementations in feature-specific directories, while still retaining robust documentation and a strong emphasis on dependency injection.

---

# Updated DevPreview UI Architecture Boilerplate Plan

This plan combines the **original** and **current** approaches, preserving the original system’s design principles while modifying how we organize interfaces, implementations, and documentation.

## 1. Directory Structure

**Key Change:** Interfaces are now co-located with their implementations in feature-specific directories rather than under a dedicated `interfaces/` directory. Documentation remains in a dedicated `/docs` directory, preserving the searchable network of reference materials.

```
src/
├── core/                   
│   ├── ServiceContainer.ts
│   ├── Bootstrap.ts
│   ├── AppState.ts         # (optional global state mechanism)
│   ├── index.ts            # Barrel file for core exports
│   └── ...
├── components/
│   ├── Editor/
│   │   ├── Editor.ts
│   │   ├── IEditor.ts
│   │   ├── Editor.md       # (optional local doc or reference to /docs)
│   │   └── index.ts        # Barrel file exporting Editor & IEditor
│   ├── Preview/
│   │   ├── Preview.ts
│   │   ├── IPreview.ts
│   │   ├── Preview.md
│   │   └── index.ts
│   ├── DevPreview/
│   │   ├── DevPreview.ts
│   │   ├── IDevPreview.ts
│   │   ├── DevPreview.md
│   │   └── index.ts
│   └── ...
├── services/
│   ├── StorageService/
│   │   ├── StorageService.ts
│   │   ├── IStorageService.ts
│   │   ├── StorageService.md
│   │   └── index.ts
│   ├── APIService/
│   │   ├── APIService.ts
│   │   ├── IAPIService.ts
│   │   ├── APIService.md
│   │   └── index.ts
│   └── ...
├── adapters/
│   ├── LocalStorageAdapter/
│   │   ├── LocalStorageAdapter.ts
│   │   ├── IStorageAdapter.ts
│   │   └── index.ts
│   └── ...
├── factories/
│   ├── ComponentFactory/
│   │   ├── ComponentFactory.ts
│   │   ├── IComponentFactory.ts
│   │   └── index.ts
│   └── ...
├── events/
│   ├── EventBus/
│   │   ├── EventBus.ts
│   │   ├── IEventBus.ts
│   │   └── index.ts
│   ├── EventTypes.ts
│   └── ...
├── errors/
│   ├── ErrorHandler/
│   │   ├── ErrorHandler.ts
│   │   ├── IErrorHandler.ts
│   │   └── index.ts
│   ├── AppError.ts
│   └── ...
├── features/
│   ├── RealTimePreview/
│   │   ├── RealTimePreviewFeature.ts
│   │   ├── IRealTimePreviewFeature.ts
│   │   └── index.ts
│   └── ...
├── utils/
│   └── ...
├── docs/
│   ├── README.md
│   ├── architecture/
│   ├── components/
│   ├── core/
│   ├── events/
│   ├── errors/
│   ├── factories/
│   ├── services/
│   ├── features/
│   ├── adapters/
│   ├── testing/
│   └── ...
└── index.ts               # (Optional root-level barrel for the entire library)
```

### Rationale for Changes
1. **Co-locating Interfaces**:  
   - Keeps types and their implementations together for clarity.  
   - The `I-prefix` naming convention (e.g., `IEditor.ts`) clearly distinguishes interfaces from classes.  
2. **Documentation**:  
   - `/docs` remains a standalone directory for deeper, centralized documentation.  
   - Each feature/component directory can include local `*.md` files, but the main reference remains in `/docs`.
3. **Barrel Files**:  
   - Each directory can have an `index.ts` that re-exports its contents (e.g., `export * from './Editor'`).  
   - Simplifies imports and keeps code organized.

---

## 2. Strict Dependency Injection (DI)

**Key Change:** We continue to use a `ServiceContainer` for DI, but adopt the possibility of simpler injection approaches where needed during early development. Once the application grows, the container-based approach can unify all dependencies in a single place.

Example (unchanged logic, updated references if needed):
```typescript
// src/core/ServiceContainer.ts
export class ServiceContainer {
  private services: Map<string, any> = new Map();

  register<T>(id: string, instance: T): void {
    this.services.set(id, instance);
  }

  get<T>(id: string): T {
    const service = this.services.get(id);
    if (!service) throw new Error(`Service '${id}' not registered`);
    return service as T;
  }
}
```

---

## 3. Event System

**Location:** `src/events/EventBus/`  
**Files:**  
- `EventBus.ts`  
- `IEventBus.ts`  
- `EventTypes.ts`  
- `index.ts`

No major changes from the original approach; the event bus remains a core module that promotes decoupled communication. However, the interface (`IEventBus.ts`) is now co-located in the same folder as the implementation (`EventBus.ts`).

---

## 4. Error Handling System

**Location:** `src/errors/ErrorHandler/`
**Files:**
- `ErrorHandler.ts`
- `IErrorHandler.ts`
- `AppError.ts`
- `index.ts`

Error handling remains centralized, allowing consistent patterns for logging and user notifications.
- `AppError` enumerates error types including `MATH_API` for math visualization errors.
- `ErrorHandler` displays user-facing messages (e.g., via toast) and provides specialized handling for:
  - Iframe errors via `handleIframeError`
  - Math API errors via `handleMathApiError`
  - Recovery attempts via `attemptRecovery`

The error system integrates with the event bus to broadcast error events, allowing components to react to errors and potentially recover from them. This is particularly important for math visualization tools that may encounter rendering or calculation errors.

---

## 5. Components and Interfaces

**Key Change:** Component interfaces live next to their implementation in each component’s directory.

**Example: Editor Component**  
```
src/
└── components/
    └── Editor/
        ├── IEditor.ts
        ├── Editor.ts
        ├── Editor.md
        └── index.ts
```

### Sample `IEditor.ts`
```typescript
export interface IEditor {
  getContent(): { html: string; css: string; js: string };
  setContent(data: { html: string; css: string; js: string }): void;
  // ...
}
```

### Sample `Editor.ts`
```typescript
import { IEditor } from './IEditor';
import { IEventBus } from '../../events/EventBus/IEventBus';
import { IErrorHandler } from '../../errors/ErrorHandler/IErrorHandler';

export class Editor implements IEditor {
  // Implementation details...
}
```

This co-location pattern is repeated for all components (`Preview`, `DevPreview`, `ComponentList`, etc.) and keeps each module self-contained.

---

## 6. Services and Adapters

Similarly, each **Service** or **Adapter** has:
- An interface file `IServiceName.ts` or `IAdapterName.ts`
- An implementation file `ServiceName.ts` or `AdapterName.ts`
- A local `index.ts` (barrel) for cleaner imports

For example:
```
src/services/StorageService/
├── IStorageService.ts
├── StorageService.ts
├── StorageService.md
└── index.ts
```

All subdirectories under `services/` and `adapters/` follow this pattern.

---

## 7. Component Factory

Factories likewise reside in `src/factories/<FactoryName>`. A factory directory typically contains:
- The factory interface (`IComponentFactory.ts`)
- The factory implementation (`ComponentFactory.ts`)
- A local doc or reference to the main docs folder

```typescript
// src/factories/ComponentFactory/ComponentFactory.ts
export class ComponentFactory implements IComponentFactory {
  // ...
}
```

---

## 8. Application Bootstrap

**Location:** `src/core/Bootstrap.ts`  

Bootstrap remains the entry point for:
1. Creating a `ServiceContainer`.
2. Registering all core services, adapters, and error handlers.
3. Initializing main UI components (Editor, Preview, DevPreview, etc.).
4. Returning the main `DevPreview` instance (or top-level root component).

---

## 9. Documentation Structure

Although each component or service directory may include a short `*.md` or README, the main documentation resides in `src/docs/` as originally designed. This ensures a unified, searchable network of markdown files. The docs remain organized by domain:

```
src/docs/
├── README.md
├── architecture/
├── components/
├── core/
├── events/
├── errors/
├── factories/
├── services/
├── adapters/
├── features/
├── testing/
└── ...
```

Cross-links should reference the co-located docs in each folder or the `/docs` directory.  
Example references:
- `[IEditor.ts](../../components/Editor/IEditor.ts)`
- `[Editor Documentation](../../docs/components/Editor.md)`

---

## 10. Barrel Files (index.ts)

Each folder may include an `index.ts` that re-exports relevant pieces. For example, in `src/components/Editor/index.ts`:

```typescript
export * from './IEditor';
export * from './Editor';
```

This allows consumers to import the editor cleanly:

```typescript
import { Editor, IEditor } from '@/components/Editor';
```

At the root level (`src/index.ts` or `index.ts`), you can optionally collect the entire library’s exports for a single import point.

---

## 11. Implementation Steps

1. **Setup Project Structure**  
   - Create the folder hierarchy under `src/` as shown.  
   - Initialize your build tools (e.g., `package.json`, `tsconfig.json`, bundler configs).  
   - Configure linting (ESLint) and testing (Jest).

2. **Implement Core**  
   - `ServiceContainer`, `EventBus`, `ErrorHandler`, etc.  
   - Ensure each has a corresponding interface (e.g., `IEventBus.ts`, `IErrorHandler.ts`), co-located in the same folder.

3. **Define & Implement Components**  
   - For each UI component (Editor, Preview, DevPreview, etc.), create a folder with `I<Component>.ts`, `<Component>.ts`, and optionally `<Component>.md`.  
   - Ensure event and error handling dependencies are injected.

4. **Define & Implement Services/Adapters**  
   - Co-locate each service or adapter interface with its implementation (`IStorageService.ts` + `StorageService.ts` in `StorageService/` folder).  
   - Keep business logic and external integrations in these folders.

5. **Create Documentation Network**  
   - Maintain the main docs in `src/docs/`.  
   - Reference them from within each component/service folder’s local `README.md` or link them in code comments.

6. **Add Testing Infrastructure**  
   - Add dedicated test directories or co-locate tests with modules.  
   - Provide mocks/stubs for interfaces in test code or test-specific factories (e.g., `TestComponentFactory`).

7. **Bootstrap Everything**  
   - Implement `Bootstrap.ts` to initialize the application.  
   - Register all services, create the main UI, and return your root `DevPreview` instance.

---
## 12. Domain-Specific Naming Conventions

To ensure clarity and avoid naming conflicts, the DevPreview UI follows these naming guidelines:

1. **Domain Context Prefixing**: Names should reflect their domain purpose rather than generic descriptions
   - `StorageComponentContent` instead of generic "ComponentData" for content stored via storage services
   - `EditorContent` instead of generic "ComponentData" for content handled in the editor
   - `PreviewSettings` instead of generic "Settings" for configuration specific to the preview component

2. **Interface vs. Implementation Naming**:
   - Interfaces follow the I-prefix convention consistently: `IStorageService`, `IEditor`
   - Implementation types should have a clear, domain-indicating name: `StorageService`, `Editor`
   
3. **Type Suffixing by Purpose**:
   - `*Content` for code content (HTML, CSS, JS)
   - `*Metadata` for descriptive information about entities
   - `*Settings` or `*Options` for configuration
   - `*Event` for event payload types

4. **Selective Exports in Index Files**:
   - Barrel files should use explicit exports with aliases when needed to avoid naming collisions
   - Deprecated type aliases should only appear in the barrel files, not in consuming code
   - Example: `export { ComponentContentData as StorageComponentContent } from './ComponentContent'`

This approach reduces ambiguity, improves self-documentation, and helps prevent naming collisions as the codebase grows.

## Conclusion

Under this **current approach**, the **DevPreview UI Architecture**:

1. Maintains **co-located** interfaces with corresponding classes (improves discoverability).
2. Preserves **strict dependency injection** via `ServiceContainer`, while allowing simpler injection where necessary.
3. Continues the **robust documentation** model via a dedicated `docs` directory and cross-linked markdown files.
4. Leverages **barrel files** for cleaner import paths.
5. Follows **domain-specific naming conventions** to avoid ambiguity and reduce naming collisions.

This structure allows for growth and maintainability, ensuring all parts of the system remain logically grouped and discoverable.
This structure allows for growth and maintainability, ensuring all parts of the system remain logically grouped and discoverable.