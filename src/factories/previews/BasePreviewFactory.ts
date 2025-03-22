import { IPreview } from '../../components/Preview';
import { IServiceContainer } from '../../core/IServiceContainer';
import { IErrorHandler, ErrorType, AppError } from '../../errors/IErrorHandler';
import { IPreviewFactory, PreviewConfig } from '../IPreviewFactory';
import { BaseComponentFactory } from '../BaseComponentFactory';

/**
 * Abstract base class for preview factories
 * Provides common functionality for all preview factory implementations
 */
export abstract class BasePreviewFactory extends BaseComponentFactory<IPreview, PreviewConfig> implements IPreviewFactory {
  /**
   * Creates a new base preview factory
   * @param errorHandler Error handler for reporting factory errors
   */
  constructor(protected errorHandler: IErrorHandler) {
    super(errorHandler);
  }
  
  /**
   * Get component type for registration
   */
  getComponentType(): string {
    return 'preview';
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
  abstract create(config: PreviewConfig, container: IServiceContainer): IPreview;
  
  /**
   * Get supported preview features
   * Should be overridden by derived classes
   */
  getSupportedFeatures(): string[] {
    return ['basic-preview'];
  }
  
  /**
   * Get the API version being used by this preview implementation
   * Should be overridden by derived classes that use external APIs
   */
  getApiVersion(): string {
    return 'unknown';
  }
  
  /**
   * Validates preview configuration
   * @param config Preview configuration to validate
   * @throws Error if configuration is invalid
   */
  protected validateConfig(config: PreviewConfig): void {
    if (!config) {
      throw new AppError(
        ErrorType.VALIDATION, 
        'Preview configuration is required', 
        { factoryId: this.getFactoryId() }
      );
    }
    
    if (!config.containerId) {
      throw new AppError(
        ErrorType.VALIDATION, 
        'Preview container ID is required', 
        { factoryId: this.getFactoryId(), config }
      );
    }
    
    // Specific validation for math API preview factories
    if (this.isMathApiFactory() && !config.mathApiType) {
      throw new AppError(
        ErrorType.VALIDATION,
        'Math API type is required for this preview factory',
        { factoryId: this.getFactoryId(), config }
      );
    }
  }
  
  /**
   * Determines if this is a math API factory
   * Math API factories have additional requirements and validation
   */
  protected isMathApiFactory(): boolean {
    // Default implementation - override in derived classes
    return this.getFactoryId().includes('math') || 
           ['desmos', 'geogebra', 'mathjs'].includes(this.getFactoryId());
  }
  
  /**
   * Creates an iframe element for the preview
   * @param containerId Container element ID
   * @returns The created iframe element or throws if container not found
   */
  protected createIframe(containerId: string): HTMLIFrameElement {
    const container = document.getElementById(containerId);
    
    if (!container) {
      throw new AppError(
        ErrorType.INITIALIZATION,
        `Container element not found: ${containerId}`,
        { factoryId: this.getFactoryId() }
      );
    }
    
    const iframe = document.createElement('iframe');
    iframe.id = `${containerId}-frame`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.backgroundColor = 'transparent';
    
    // Set important attributes for security and performance
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
    iframe.setAttribute('loading', 'lazy');
    
    // Append iframe to container
    container.appendChild(iframe);
    
    return iframe;
  }
  
  /**
   * Checks if an external API is available
   * @param apiName Name of the API to check
   * @param globalProperty Global property that should exist when API is loaded
   * @returns True if API is available
   */
  protected isApiAvailable(apiName: string, globalProperty: string): boolean {
    return typeof window !== 'undefined' && 
           typeof (window as any)[globalProperty] !== 'undefined';
  }
}