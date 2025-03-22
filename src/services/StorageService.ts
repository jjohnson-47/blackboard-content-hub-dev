import { IStorageService } from './IStorageService';
import { IStorageAdapter } from '../adapters/IStorageAdapter';
import { IErrorHandler } from '../errors/IErrorHandler';
import { ComponentMetadata } from '../models/ComponentMetadata';
import { StorageComponentContent } from '../models/index';
import { AppError, ErrorType } from '../errors/IErrorHandler';

/**
 * Storage Service implementation
 * Provides persistent storage for components using the adapter pattern
 */
export class StorageService implements IStorageService {
  /**
   * Storage key for the component list
   * @private
   */
  private readonly COMPONENT_LIST_KEY = 'devpreview_components';
  
  /**
   * Prefix for component data keys
   * @private
   */
  private readonly COMPONENT_DATA_PREFIX = 'devpreview_component_';
  
  /**
   * Storage key for tracking the last edited component
   * @private
   */
  private readonly LAST_EDITED_KEY = 'devpreview_last_edited';
  
  /**
   * Creates a new StorageService
   * @param storageAdapter The storage adapter to use
   * @param errorHandler The error handler for error management
   */
  constructor(
    private storageAdapter: IStorageAdapter,
    private errorHandler: IErrorHandler
  ) {}
  
  /**
   * Saves component data to storage
   * @param metadata Component metadata
   * @param content Component content data
   * @returns True if save was successful
   */
  public saveComponent(metadata: ComponentMetadata, content: StorageComponentContent): boolean {
    try {
      // Update last edited time
      metadata.lastEdited = new Date();
      
      // Save component content
      const contentKey = this.COMPONENT_DATA_PREFIX + metadata.id;
      this.storageAdapter.setItem(contentKey, content);
      
      // Update component in list or add if new
      const componentList = this.getAllLocalComponents();
      const index = componentList.findIndex(c => c.id === metadata.id);
      
      if (index >= 0) {
        componentList[index] = metadata;
      } else {
        componentList.push(metadata);
      }
      
      this.storageAdapter.setItem(this.COMPONENT_LIST_KEY, componentList);
      
      // Update last edited component
      this.storageAdapter.setItem(this.LAST_EDITED_KEY, metadata.id);
      
      return true;
    } catch (error) {
      this.errorHandler.handle(
        new AppError(
          ErrorType.STORAGE,
          `Failed to save component: ${metadata.id}`,
          error
        )
      );
      return false;
    }
  }
  
  /**
   * Loads component data from storage
   * @param id Component ID
   * @returns Component content
   * @throws AppError with STORAGE type if component not found
   */
  public loadComponent(id: string): StorageComponentContent {
    try {
      const contentKey = this.COMPONENT_DATA_PREFIX + id;
      const content = this.storageAdapter.getItem<StorageComponentContent>(contentKey);
      
      if (!content) {
        throw new AppError(
          ErrorType.STORAGE,
          `Component not found: ${id}`
        );
      }
      
      // Update last edited component
      this.storageAdapter.setItem(this.LAST_EDITED_KEY, id);
      
      return content;
    } catch (error) {
      this.errorHandler.handle(error instanceof AppError ? error : 
        new AppError(
          ErrorType.STORAGE,
          `Failed to load component: ${id}`,
          error
        )
      );
      throw error;
    }
  }
  
  /**
   * Gets the last edited component
   * @returns Component metadata or null if no components exist
   */
  public getLastEditedComponent(): ComponentMetadata | null {
    try {
      const lastEditedId = this.storageAdapter.getItem<string>(this.LAST_EDITED_KEY);
      if (!lastEditedId) return null;
      
      const componentList = this.getAllLocalComponents();
      return componentList.find(c => c.id === lastEditedId) || null;
    } catch (error) {
      this.errorHandler.handle(
        new AppError(
          ErrorType.STORAGE,
          'Failed to get last edited component',
          error
        )
      );
      return null;
    }
  }
  
  /**
   * Gets all locally stored components
   * @returns Array of component metadata
   */
  public getAllLocalComponents(): ComponentMetadata[] {
    try {
      const componentList = this.storageAdapter.getItem<ComponentMetadata[]>(this.COMPONENT_LIST_KEY);
      return componentList || [];
    } catch (error) {
      this.errorHandler.handle(
        new AppError(
          ErrorType.STORAGE,
          'Failed to get all components',
          error
        )
      );
      return [];
    }
  }
  
  /**
   * Deletes a component from storage
   * @param id Component ID
   * @returns True if deletion was successful
   */
  public deleteComponent(id: string): boolean {
    try {
      // Remove component data
      const contentKey = this.COMPONENT_DATA_PREFIX + id;
      this.storageAdapter.removeItem(contentKey);
      
      // Remove from component list
      const componentList = this.getAllLocalComponents();
      const filteredComponents = componentList.filter(c => c.id !== id);
      this.storageAdapter.setItem(this.COMPONENT_LIST_KEY, filteredComponents);
      
      // Update last edited if needed
      const lastEditedId = this.storageAdapter.getItem<string>(this.LAST_EDITED_KEY);
      if (lastEditedId === id && filteredComponents.length > 0) {
        this.storageAdapter.setItem(this.LAST_EDITED_KEY, filteredComponents[0].id);
      } else if (filteredComponents.length === 0) {
        this.storageAdapter.removeItem(this.LAST_EDITED_KEY);
      }
      
      return true;
    } catch (error) {
      this.errorHandler.handle(
        new AppError(
          ErrorType.STORAGE,
          `Failed to delete component: ${id}`,
          error
        )
      );
      return false;
    }
  }
}