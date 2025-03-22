import { IEditor, EditorContent } from '../../components/Editor';
import { IServiceContainer } from '../../core/IServiceContainer';
import { IErrorHandler, ErrorType, AppError } from '../../errors/IErrorHandler';
import { IEditorFactory, EditorConfig } from '../IEditorFactory';
import { BaseComponentFactory } from '../BaseComponentFactory';

/**
 * Abstract base class for editor factories
 * Provides common functionality for all editor factory implementations
 */
export abstract class BaseEditorFactory extends BaseComponentFactory<IEditor, EditorConfig> implements IEditorFactory {
  /**
   * Creates a new base editor factory
   * @param errorHandler Error handler for reporting factory errors
   */
  constructor(protected errorHandler: IErrorHandler) {
    super(errorHandler);
  }
  
  /**
   * Get component type for registration
   */
  getComponentType(): string {
    return 'editor';
  }
  
  /**
   * Abstract method to get factory ID
   * Must be implemented by derived classes
   */
  abstract getFactoryId(): string;
  
  /**
   * Abstract method for component creation
   * Must be implemented by derived classes
   */
  abstract create(config: EditorConfig, container: IServiceContainer): IEditor;
  
  /**
   * Get supported editor features
   * Can be overridden by derived classes
   */
  getSupportedFeatures(): string[] {
    return ['basic-editing'];
  }
  
  /**
   * Validates editor configuration
   * @param config Editor configuration to validate
   * @throws Error if configuration is invalid
   */
  protected validateConfig(config: EditorConfig): void {
    if (!config) {
      throw new AppError(
        ErrorType.VALIDATION, 
        'Editor configuration is required', 
        { factoryId: this.getFactoryId() }
      );
    }
    
    if (!config.containerId) {
      throw new AppError(
        ErrorType.VALIDATION, 
        'Editor container ID is required', 
        { factoryId: this.getFactoryId(), config }
      );
    }
    
    // Perform additional validation for other config properties
    // This can be extended by derived classes
  }
  
  /**
   * Initializes editor with content
   * @param editor Editor instance to initialize
   * @param content Initial content
   */
  protected initializeContent(editor: IEditor, content?: EditorContent): void {
    if (content) {
      try {
        editor.setContent(content);
      } catch (error: any) {
        // Log error but don't fail initialization
        this.errorHandler.handle(
          new AppError(
            ErrorType.INITIALIZATION,
            `Failed to set initial editor content: ${error.message}`,
            { factoryId: this.getFactoryId(), content }
          )
        );
      }
    }
  }
}