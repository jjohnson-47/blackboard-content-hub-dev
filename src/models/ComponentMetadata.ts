/**
 * Component metadata model
 * Represents the descriptive information about a component
 */
export type ComponentLocationType = 'local' | 'remote';

/**
 * Component metadata model
 * Represents the descriptive information about a component
 */
export interface ComponentMetadata {
  /**
   * Unique identifier for the component
   */
  id: string;
  
  /**
   * Display name of the component
   */
  name: string;
  
  /**
   * Where the component is stored (local browser storage or remote server)
   */
  locationType: ComponentLocationType;
  
  /**
   * When the component was last edited
   */
  lastEdited?: Date;
  
  /**
   * Optional array of searchable tags
   */
  tags?: string[];
}

/**
 * @deprecated Use ComponentMetadata instead
 * Provides backward compatibility with existing code
 */
export type Component = ComponentMetadata;