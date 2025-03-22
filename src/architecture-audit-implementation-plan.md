# Architecture Audit Implementation Plan

Based on the recent architecture audit, the following plan outlines how to systematically address the recommendations:

--------------------------------------------------------------------------------
1. Directory Structure Inconsistencies [COMPLETED]
--------------------------------------------------------------------------------
1.1. Consolidate Interfaces: [COMPLETED] [COMPLETED]
• ✅ Identify interfaces in "src/interfaces" that are related to specific components (e.g., IErrorHandler under src/errors, IStorageService under src/services, etc.).
• ✅ Move them to their corresponding implementation directory (e.g., move IStorageService.ts to src/services/StorageService/).
• ✅ Update references in imports throughout the codebase to point to the new locations.
• ✅ Remove "src/interfaces/" after all interfaces are migrated.

1.2. Standardize Component Folder Structure: [COMPLETED] [COMPLETED]
• ✅ For each component (Editor, Preview, DevPreview, etc.), ensure the directory structure matches:
  src/components/ComponentName/
    ├─ ComponentName.ts
    ├─ IComponentName.ts
    ├─ index.ts (barrel)
    └─ [tests, docs, or other local files]
• ✅ Create or update index.ts in each folder to export the main classes/interfaces.

--------------------------------------------------------------------------------
2. Domain-Specific Naming Implementation [COMPLETED] [COMPLETED]
--------------------------------------------------------------------------------
2.1. Replace Generic Names: [COMPLETED]
• ✅ Search for "ComponentData" references in the codebase.
• ✅ Replace with domain-specific names (EditorContent, StorageComponentContent, etc.) where appropriate.
• ✅ Confirm that IPreview references EditorContent (not ComponentData).

2.2. Deprecation Tags: [COMPLETED]
• ✅ Ensure all temporary aliases (e.g., "ComponentData") have a @deprecated JSDoc with a clear message.
• ✅ Add references to the new types in the JSDoc tags for easy navigation.

2.3. Linting Enforcement: [COMPLETED]
• ✅ Introduce ESLint rules (or custom rules) to flag usage of known deprecated or generic type names.
• ✅ Integrate these rules into the CI pipeline to catch violations early.

--------------------------------------------------------------------------------
3. Documentation Redundancy & Gaps
--------------------------------------------------------------------------------
3.1. Single Source of Truth for Plans: [COMPLETED]
• ✅ Merge master-plan.md, updated-master-plan.md, and current-implementation-plan.md into a single plan file (e.g., ImplementationRoadmap.md).
• ✅ Archive the older files with "DEPRECATED" in the file name or heading.

3.2. Cross-Referencing: [COMPLETED]
• ✅ Add a top-level "Documentation Index" in src/docs/README.md to guide developers to relevant docs (architecture, factories, errors, etc.).
• ✅ Ensure cross-links are used in all docs referencing related sections (e.g., link from ErrorHandler docs to the relevant ADR).

3.3. Status Indicators: [PENDING]
• In each doc section, add a small "Status:" heading (e.g., "Planned", "In Progress", "Complete").
• Keep these statuses updated as features are built out.

--------------------------------------------------------------------------------
4. Testing Configuration Issues
--------------------------------------------------------------------------------
4.1. ESM Configuration Fix:
• In package.json, ensure "type": "module" (or correct type as needed).
• Re-enable vite-tsconfig-paths in vitest.config.ts to restore path alias functionality.
• If conflicts arise, consider dynamic imports or alternative path resolution strategies (document reasoning in a short ADR).

4.2. Path Aliases Consistency:
• Verify tsconfig.json "paths" aligns with the aliases in vitest.config.ts.
• Test both the build (vite.config.ts) and test environment (vitest.config.ts) to confirm successful path resolution.

4.3. Expand Test Coverage:
• Identify components lacking tests (e.g., certain factories or adapters).
• Add comprehensive tests for each uncovered area: unit, integration, and error-handling scenarios.

--------------------------------------------------------------------------------
5. Math API Integration Architecture
--------------------------------------------------------------------------------
5.1. Adapter Interfaces:
• Finalize IMathApiAdapter with minimal but complete method signatures (e.g., initialize, updateContent, getState, setState, destroy).
• Document expected error behavior and references to IErrorHandler for math API errors.

5.2. Adapter Factory Pattern:
• Create an adapter factory that selects the appropriate math Adapter based on user preference (e.g., "desmos", "geogebra").
• Provide a fallback or error condition if an unsupported API is requested.

5.3. Testing Strategy:
• Implement mock adapters for each math API to run unit tests without external API calls.
• Write scenario-based tests (e.g., initialization failures, content update errors, etc.).

--------------------------------------------------------------------------------
6. Event System Enhancements
--------------------------------------------------------------------------------
6.1. Define Migration Path:
• Decide if EnhancedEventBus fully replaces EventBus or if they will coexist.
• Document usage guidelines in an ADR (EventBusADR.md or update existing one).
• Potentially deprecate the basic EventBus if EnhancedEventBus covers all use cases.

6.2. Standardize Event Naming:
• Maintain a single, robust event enum (e.g., StandardEventsCatalog).
• Update existing events to reference this catalog for consistency.

6.3. Event Logging & Debugging:
• If feasible, introduce a debug mode that logs emitted events (source, payload).
• Consider building a small UI overlay (if relevant) or console-grouped logs for dev convenience.

--------------------------------------------------------------------------------
7. Implementation Plan Updates
--------------------------------------------------------------------------------
7.1. Mark Completed Components:
• In the consolidated ImplementationRoadmap.md mention which components are done (e.g., Editor, Preview partial).
• Move any planned tasks that are "in progress" or "done" to the correct status.

7.2. Adjust Timeline:
• Revise the weekly breakdown to reflect current progress and new priorities (like the domain-specific naming or absolutely crucial refactoring).
• Convert into a Gantt chart or a simple table listing tasks, owners, and deadlines if that helps clarity.

7.3. Define Dependencies:
• Explicitly note which components rely on each other (e.g., DevPreview depends on Editor + Preview).
• Clarify if certain tasks must happen before others (like finishing the math API adapters before Editor integration tests).

--------------------------------------------------------------------------------
## Execution Strategy

1. **Create a small team or rotating schedule** to address each category of improvements. 
2. **Start with quick wins** (like adding @deprecated tags, updating docs) for immediate clarity. 
3. **Move onto structural changes** (co-located interfaces, unifying docs). 
4. **Revise test configurations** once the structural changes are stable to avoid repeated breakages. 
5. **Implement new patterns** (math adapter factory, enhanced event bus) in parallel with any leftover domain-specific renames. 
6. **Regularly track progress** in the consolidated ImplementationRoadmap.md and keep docs up to date.

Implementing these steps will align the codebase with the architectural recommendations, reduce redundancies and confusion, and maintain a coherent developer experience as DevPreview UI expands to support more math visualization features.
