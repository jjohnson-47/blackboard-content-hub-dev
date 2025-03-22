/**
 * Models module exports with domain-specific naming
 * 
 * This index file handles proper exports of all model types,
 * including both current domain-specific names and deprecated aliases
 * for backward compatibility.
 */

// Component metadata exports
export { 
  ComponentMetadata, 
  // Legacy alias for backward compatibility
  Component 
} from './ComponentMetadata';

// Component content exports
export { 
  StorageComponentContent,
  // Legacy aliases for backward compatibility
  ComponentContentData,
  ComponentData 
} from './ComponentContent';