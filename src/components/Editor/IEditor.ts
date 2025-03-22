/**
 * Editor content data structure
 * Represents the content being edited in the editor component
 */
export interface EditorContent {
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
}

/**
 * @deprecated Use EditorContent instead
 * Provides backward compatibility with existing code
 */
export type ComponentData = EditorContent;

/**
 * Editor change listener type
 */
export type EditorChangeListener = (data: EditorContent) => void;

/**
 * Editor interface
 * Defines the contract for editor components that handle code editing
 */
export interface IEditor {
  /**
   * Get editor content
   * @returns Current editor content
   */
  getContent(): EditorContent;
  
  /**
   * Set editor content
   * @param data Content to set
   */
  setContent(data: EditorContent): void;
  
  /**
   * Format code in the editor
   */
  formatCode(): void;
  
  /**
   * Add change event listener
   * @param listener Function to call when content changes
   * @returns Function to remove the listener
   */
  addEventListener(listener: EditorChangeListener): () => void;
}