import { IPreview, DeviceSize } from '../../components/Preview';
import { EditorContent } from '../../components/Editor';
import { IServiceContainer } from '../../core/IServiceContainer';
import { IErrorHandler, ErrorType, AppError } from '../../errors/IErrorHandler';
import { IEventBus } from '../../events/IEventBus';
import { PreviewConfig } from '../IPreviewFactory';
import { BasePreviewFactory } from './BasePreviewFactory';

/**
 * Standard preview implementation
 * Provides a basic iframe preview without specific math API integration
 */
class StandardPreview implements IPreview {
  private iframe: HTMLIFrameElement;
  private currentDeviceSize: DeviceSize = DeviceSize.DESKTOP;
  private lastContent: EditorContent | null = null;
  
  /**
   * Creates a new standard preview
   * @param iframe The iframe element to use for preview
   * @param eventBus Event bus for publishing events
   */
  constructor(
    iframe: HTMLIFrameElement,
    private eventBus: IEventBus
  ) {
    this.iframe = iframe;
  }
  
  /**
   * Update preview content
   * @param content Content to display
   */
  update(content: EditorContent): void {
    this.lastContent = content;
    
    // Update iframe content
    const iframeDoc = this.iframe.contentWindow?.document;
    
    if (!iframeDoc) {
      throw new Error('Cannot access iframe document');
    }
    
    // Create a complete HTML document
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <style>
          ${content.css || ''}
        </style>
      </head>
      <body>
        ${content.html || ''}
        <script>
          ${content.js || ''}
        </script>
      </body>
      </html>
    `;
    
    // Write to the iframe
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();
  }
  
  /**
   * Set preview device size
   * @param size Device size
   */
  setDeviceSize(size: DeviceSize): void {
    this.currentDeviceSize = size;
    
    // Update iframe dimensions based on device size
    switch (size) {
      case DeviceSize.MOBILE:
        this.iframe.style.width = '320px';
        this.iframe.style.height = '568px';
        break;
      case DeviceSize.TABLET:
        this.iframe.style.width = '768px';
        this.iframe.style.height = '1024px';
        break;
      case DeviceSize.DESKTOP:
      default:
        this.iframe.style.width = '100%';
        this.iframe.style.height = '100%';
        break;
    }
    
    // Refresh content if we have it
    if (this.lastContent) {
      this.update(this.lastContent);
    }
  }
  
  /**
   * Get preview iframe element
   * @returns HTMLIFrameElement
   */
  getIframe(): HTMLIFrameElement {
    return this.iframe;
  }
}

/**
 * Factory for creating standard preview components
 */
export class StandardPreviewFactory extends BasePreviewFactory {
  /**
   * Creates a new standard preview factory
   * @param errorHandler Error handler for reporting factory errors
   */
  constructor(protected errorHandler: IErrorHandler) {
    super(errorHandler);
  }
  
  /**
   * Get the factory identifier
   */
  getFactoryId(): string {
    return 'standard';
  }
  
  /**
   * Get supported preview features
   */
  getSupportedFeatures(): string[] {
    return ['basic-preview', 'responsive'];
  }
  
  /**
   * Get the API version being used by this preview implementation
   */
  getApiVersion(): string {
    return '1.0';
  }
  
  /**
   * Create a standard preview instance
   * @param config Preview configuration
   * @param container Service container for dependencies
   * @returns A new StandardPreview instance
   */
  create(config: PreviewConfig, container: IServiceContainer): IPreview {
    try {
      // Validate configuration
      this.validateConfig(config);
      
      // Get dependencies from container
      const eventBus = container.get<IEventBus>('eventBus');
      
      // Create iframe
      const iframe = this.createIframe(config.containerId);
      
      // Create preview instance
      const preview = new StandardPreview(iframe, eventBus);
      
      // Initialize with content if provided
      if (config.initialContent) {
        preview.update(config.initialContent);
      }
      
      // Publish creation event
      this.publishCreatedEvent(eventBus, config);
      
      return preview;
    } catch (error) {
      return this.handleCreationError(error, config, container);
    }
  }
  
  /**
   * Determines if this is a math API factory
   * This is a standard preview factory without math API integration
   */
  protected isMathApiFactory(): boolean {
    return false;
  }
}