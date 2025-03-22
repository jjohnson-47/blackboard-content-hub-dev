import { IStorageAdapter } from './IStorageAdapter';
import { AppError, ErrorType } from '../errors/IErrorHandler';

/**
 * LocalStorage adapter implementation
 */
export class LocalStorageAdapter implements IStorageAdapter {
  /**
   * Get an item from localStorage
   * @param key Storage key
   * @returns The stored value or null if not found
   */
  public getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Failed to get item '${key}' from localStorage:`, error);
      return null;
    }
  }
  
  /**
   * Store an item in localStorage
   * @param key Storage key
   * @param value Value to store
   * @returns True if successful
   */
  public setItem<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Failed to set item '${key}' in localStorage:`, error);
      return false;
    }
  }
  
  /**
   * Remove an item from localStorage
   * @param key Storage key
   * @returns True if successful
   */
  public removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to remove item '${key}' from localStorage:`, error);
      return false;
    }
  }
  
  /**
   * Clear all items from localStorage
   * @returns True if successful
   */
  public clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      return false;
    }
  }
  
  /**
   * Check if a key exists in localStorage
   * @param key Storage key
   * @returns True if key exists
   */
  public hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }
}