/**
 * Component Content Data model interface
 * Represents the actual content of a component in the system
 */
export interface ComponentContentData {
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
 * @deprecated Use ComponentContentData instead to avoid naming conflicts with IEditor.ComponentData
 */
export type ComponentData = ComponentContentData;