import { IPreview } from '../components/Preview';
import { IComponentFactory } from './IComponentFactory';
import { EditorContent } from '../components/Editor';

/**
 * Configuration options for preview creation
 */
export interface PreviewConfig {
  /**
   * DOM element ID where the preview will be mounted
   */
  containerId: string;
  
  /**
   * Type of math API to use (e.g., 'desmos', 'geogebra')
   */
  mathApiType?: string;
  
  /**
   * Initial content to display in the preview
   */
  initialContent?: EditorContent;
  
  /**
   * Additional API-specific options
   */
  apiOptions?: Record<string, unknown>;
}

/**
 * Factory interface for creating preview components
 */
export interface IPreviewFactory extends IComponentFactory<IPreview, PreviewConfig> {
  /**
   * Get supported preview features
   * @returns Array of feature identifiers
   */
  getSupportedFeatures?(): string[];
  
  /**
   * Get the API version being used by this preview implementation
   * @returns Version string or 'unknown' if not determinable
   */
  getApiVersion?(): string;
}