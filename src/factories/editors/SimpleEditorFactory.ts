import { IEditor, EditorContent, EditorChangeListener } from '../../components/Editor';
import { IServiceContainer } from '../../core/IServiceContainer';
import { IErrorHandler } from '../../errors/IErrorHandler';
import { IEventBus } from '../../events/IEventBus';
import { EditorConfig } from '../IEditorFactory';
import { BaseEditorFactory } from './BaseEditorFactory';

/**
 * Simple editor implementation
 * Uses basic textarea elements for HTML, CSS, and JavaScript editing
 */
class SimpleEditor implements IEditor {
  private container: HTMLElement;
  // Using definite assignment assertion because these will be set in createEditorUI
  private htmlEditor!: HTMLTextAreaElement;
  private cssEditor!: HTMLTextAreaElement;
  private jsEditor!: HTMLTextAreaElement;
  private listeners: EditorChangeListener[] = [];
  private readOnly: boolean;
  
  /**
   * Creates a new simple editor
   * @param containerId Container element ID
   * @param eventBus Event bus for publishing events
   * @param readOnly Whether editor should be in read-only mode
   */
  constructor(
    containerId: string,
    private eventBus: IEventBus,
    readOnly: boolean = false
  ) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element not found: ${containerId}`);
    }
    
    this.container = container;
    this.readOnly = readOnly;
    
    // Create editor UI
    this.createEditorUI();
  }
  
  /**
   * Get current editor content
   * @returns Editor content object with html, css, and js
   */
  getContent(): EditorContent {
    return {
      html: this.htmlEditor.value,
      css: this.cssEditor.value,
      js: this.jsEditor.value
    };
  }
  
  /**
   * Set editor content
   * @param data Content to set
   */
  setContent(data: EditorContent): void {
    this.htmlEditor.value = data.html || '';
    this.cssEditor.value = data.css || '';
    this.jsEditor.value = data.js || '';
    
    // Notify listeners of content change
    this.notifyListeners();
  }
  
  /**
   * Format code in the editor
   * Simple implementation just trims whitespace
   */
  formatCode(): void {
    this.htmlEditor.value = this.htmlEditor.value.trim();
    this.cssEditor.value = this.cssEditor.value.trim();
    this.jsEditor.value = this.jsEditor.value.trim();
    
    // Notify listeners of content change
    this.notifyListeners();
  }
  
  /**
   * Add change event listener
   * @param listener Function to call when content changes
   * @returns Function to remove the listener
   */
  addEventListener(listener: EditorChangeListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Create the editor UI elements
   */
  private createEditorUI(): void {
    // Clear container
    this.container.innerHTML = '';
    
    // Create editor wrapper
    const editorWrapper = document.createElement('div');
    editorWrapper.className = 'editor-wrapper';
    editorWrapper.style.display = 'flex';
    editorWrapper.style.flexDirection = 'column';
    editorWrapper.style.height = '100%';
    editorWrapper.style.gap = '10px';
    
    // Create HTML editor section
    const htmlSection = this.createEditorSection('HTML', (textarea) => {
      this.htmlEditor = textarea;
    });
    
    // Create CSS editor section
    const cssSection = this.createEditorSection('CSS', (textarea) => {
      this.cssEditor = textarea;
    });
    
    // Create JS editor section
    const jsSection = this.createEditorSection('JavaScript', (textarea) => {
      this.jsEditor = textarea;
    });
    
    // Add sections to wrapper
    editorWrapper.appendChild(htmlSection);
    editorWrapper.appendChild(cssSection);
    editorWrapper.appendChild(jsSection);
    
    // Add wrapper to container
    this.container.appendChild(editorWrapper);
  }
  
  /**
   * Create an editor section (label + textarea)
   * @param label Section label
   * @param textareaCallback Callback to capture textarea reference
   * @returns Editor section element
   */
  private createEditorSection(
    label: string, 
    textareaCallback: (textarea: HTMLTextAreaElement) => void
  ): HTMLElement {
    const section = document.createElement('div');
    section.className = `editor-section editor-section-${label.toLowerCase()}`;
    section.style.display = 'flex';
    section.style.flexDirection = 'column';
    section.style.flexGrow = '1';
    
    // Create label
    const labelElement = document.createElement('div');
    labelElement.className = 'editor-label';
    labelElement.textContent = label;
    labelElement.style.fontWeight = 'bold';
    labelElement.style.marginBottom = '5px';
    
    // Create textarea
    const textarea = document.createElement('textarea');
    textarea.className = `editor-textarea editor-textarea-${label.toLowerCase()}`;
    textarea.style.flexGrow = '1';
    textarea.style.fontFamily = 'monospace';
    textarea.style.padding = '8px';
    textarea.style.border = '1px solid #ccc';
    textarea.style.borderRadius = '4px';
    textarea.style.resize = 'none';
    textarea.readOnly = this.readOnly;
    
    // Handle changes
    textarea.addEventListener('input', () => {
      this.notifyListeners();
    });
    
    // Add elements to section
    section.appendChild(labelElement);
    section.appendChild(textarea);
    
    // Capture textarea reference through callback
    textareaCallback(textarea);
    
    return section;
  }
  
  /**
   * Notify listeners of content change
   */
  private notifyListeners(): void {
    const content = this.getContent();
    for (const listener of this.listeners) {
      try {
        listener(content);
      } catch (error) {
        console.error('Error in editor change listener:', error);
      }
    }
  }
}

/**
 * Factory for creating simple editor components
 */
export class SimpleEditorFactory extends BaseEditorFactory {
  /**
   * Creates a new simple editor factory
   * @param errorHandler Error handler for reporting factory errors
   */
  constructor(protected errorHandler: IErrorHandler) {
    super(errorHandler);
  }
  
  /**
   * Get the factory identifier
   */
  getFactoryId(): string {
    return 'simple';
  }
  
  /**
   * Get supported editor features
   */
  getSupportedFeatures(): string[] {
    return ['basic-editing', 'html-editing', 'css-editing', 'js-editing'];
  }
  
  /**
   * Create a simple editor instance
   * @param config Editor configuration
   * @param container Service container for dependencies
   * @returns A new SimpleEditor instance
   */
  create(config: EditorConfig, container: IServiceContainer): IEditor {
    try {
      // Validate configuration
      this.validateConfig(config);
      
      // Get dependencies from container
      const eventBus = container.get<IEventBus>('eventBus');
      
      // Create editor instance
      const editor = new SimpleEditor(
        config.containerId,
        eventBus,
        config.readOnly || false
      );
      
      // Initialize with content if provided
      if (config.initialContent) {
        this.initializeContent(editor, config.initialContent);
      }
      
      // Publish creation event
      this.publishCreatedEvent(eventBus, config);
      
      return editor;
    } catch (error) {
      return this.handleCreationError(error, config, container);
    }
  }
}