# Implementation Roadmap

Below is a merged plan combining content from:
- master-plan.md
- updated-master-plan.md
- current-implementation-plan.md

This single source of truth will guide the DevPreview UI’s overall architecture, domain-specific naming, core component development, testing strategy, and final integration steps.

--------------------------------------------------------------------------------
1. Architecture & Directory Structure
--------------------------------------------------------------------------------

Here we capture the final agreed-upon directory structure and architectural setup to ensure co-located interfaces, robust documentation, and domain-specific naming:

• Strings from "master-plan.md" describing co-location strategy, interface patterns, and the final architecture approach  
• The merged approach includes consistent usage of domain-specific naming, error handling standards, service container patterns, event bus usage, etc.

--------------------------------------------------------------------------------
2. Domain-Specific Naming
--------------------------------------------------------------------------------

Consolidates the instructions from updated-master-plan.md and current-implementation-plan.md:

• Use EditorContent for editor code content  
• Use StorageComponentContent for stored content  
• Use ComponentMetadata where relevant, deprecating generic “Component” type with backward-compatible aliases  
• Ensure that IPreview references EditorContent (not ComponentData)

--------------------------------------------------------------------------------
3. Core Components Implementation Plan
--------------------------------------------------------------------------------

Merges the “Core Components Implementation Plan” from updated-master-plan.md and current-implementation-plan.md:

a) Math API Integration Layer  
   - IMathApiAdapter + Concrete Adapters (Desmos, GeoGebra, etc.)  
   - Factory pattern for easy extension  

b) Iframe Communication Bridge  
   - Secure postMessage usage  
   - Bridge for passing events between parent window and iframe  

c) Preview Component  
   - Renders HTML, CSS, JS in iframes  
   - Real-time updates, device size simulation  

d) Editor Component  
   - Code editing capabilities (HTML, CSS, JS)  
   - Syntax highlighting, events for code changes  

e) DevPreview Component  
   - Coordinates Editor & Preview  
   - Manages saving/loading content  

f) Factory System  
   - Creates components with flexible configurations  

g) Bootstrap System  
   - Initializes the application  
   - Registers services & adapters  

--------------------------------------------------------------------------------
4. Error Handling & Event System
--------------------------------------------------------------------------------

• Summaries of the existing event bus approach (EventBus, IEventBus)  
• ErrorHandler guidelines, specialized math API errors, iframe errors  
• References to the improved domain-specific naming

--------------------------------------------------------------------------------
5. Documentation Strategy
--------------------------------------------------------------------------------

• Single big docs folder at /docs with cross-links  
• Each component directory can have local README or .md  

--------------------------------------------------------------------------------
6. Testing Strategy
--------------------------------------------------------------------------------

• Focus on behavior-driven tests  
• Domain-specific mocks for math adapters, iframes  
• CI integration with ESLint + coverage  

--------------------------------------------------------------------------------
7. Timeline & Next Steps
--------------------------------------------------------------------------------

From updated-master-plan.md:
• (Week 1) Math API Integration
• (Week 2) Iframe Bridge
• (Week 3) Preview Component
• (Week 4) Editor Component
• (Week 5) DevPreview + Factories
• (Week 6) Final Integration & Testing

Summaries and references to any “CoreImplementationPlan.md” or ADR documents.

--------------------------------------------------------------------------------
8. Maintenance & Future Work
--------------------------------------------------------------------------------

• Expand testing scope for new adapters
• Investigate advanced error recovery patterns
• Explore additional math providers beyond Desmos & GeoGebra

--------------------------------------------------------------------------------
Conclusion

This ImplementationRoadmap.md file now serves as the single source of truth, merging the essential content from master-plan.md, updated-master-plan.md, and current-implementation-plan.md.