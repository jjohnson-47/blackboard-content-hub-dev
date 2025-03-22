import { IEditor, EditorContent } from '../components/Editor';
import { IComponentFactory } from './IComponentFactory';

/**
 * Configuration options for editor creation
 */
export interface EditorConfig {
  /**
   * DOM element ID where the editor will be mounted
   */
  containerId: string;
  
  /**
   * Initial content for the editor
   */
  initialContent?: EditorContent;
  
  /**
   * Whether the editor should be in read-only mode
   */
  readOnly?: boolean;
  
  /**
   * Additional editor-specific options
   */
  options?: Record<string, unknown>;
}

/**
 * Factory interface for creating editor components
 */
export interface IEditorFactory extends IComponentFactory<IEditor, EditorConfig> {
  /**
   * Get supported editor features
   * @returns Array of feature identifiers
   */
  getSupportedFeatures?(): string[];
}