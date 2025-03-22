/**
 * Component location type enum
 * Determines where a component is stored (local storage or remote server)
 */
export type ComponentLocationType = 'local' | 'remote';

/**
 * Component model interface
 * Represents metadata about a component in the system
 */
export interface Component {
  /**
   * Unique identifier for the component
   */
  id: string;
  
  /**
   * Display name of the component
   */
  name: string;
  
  /**
   * Storage location type (local or remote)
   */
  locationType: ComponentLocationType;
  
  /**
   * Date when the component was last edited
   */
  lastEdited?: Date;
  
  /**
   * Optional array of tags for categorization
   */
  tags?: string[];
}