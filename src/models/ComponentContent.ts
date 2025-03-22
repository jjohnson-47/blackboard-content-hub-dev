/**
 * Storage Component Content model
 * Represents the actual content of a component in the storage system
 */
export interface StorageComponentContent {
  /**
   * HTML content of the component
   */
  html: string;
  
  /**
   * CSS content of the component
   */
  css: string;
  
  /**
   * JavaScript content of the component
   */
  js: string;
  
  /**
   * Optional additional metadata for the component
   * This can store configuration, settings, or other component-specific data
   */
  metadata?: Record<string, any>;
}

/**
 * @deprecated Use StorageComponentContent instead for storage-related operations
 * Provides backward compatibility with existing code
 */
export type ComponentContentData = StorageComponentContent;

/**
 * @deprecated Use StorageComponentContent instead for storage context
 * or EditorContent for editor context to avoid naming conflicts
 * Provides backward compatibility with existing code
 */
export type ComponentData = StorageComponentContent;