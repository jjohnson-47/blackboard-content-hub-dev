import { ComponentMetadata } from '../models/ComponentMetadata';
import { StorageComponentContent } from '../models/index';

/**
 * Storage Service Interface
 * Provides methods for persistent storage of components and their content
 */
export interface IStorageService {
  /**
   * Saves component data to storage
   * @param metadata Component metadata
   * @param content Component content data
   * @returns True if save was successful
   */
  saveComponent(metadata: ComponentMetadata, content: StorageComponentContent): boolean;
  
  /**
   * Loads component data from storage
   * @param id Component ID
   * @returns Component content or throws if not found
   * @throws AppError with type ErrorType.STORAGE if component not found
   */
  loadComponent(id: string): StorageComponentContent;
  
  /**
   * Gets the last edited component
   * @returns Component metadata or null if no components exist
   */
  getLastEditedComponent(): ComponentMetadata | null;
  
  /**
   * Gets all locally stored components
   * @returns Array of component metadata
   */
  getAllLocalComponents(): ComponentMetadata[];
  
  /**
   * Deletes a component from storage
   * @param id Component ID
   * @returns True if deletion was successful
   */
  deleteComponent(id: string): boolean;
}