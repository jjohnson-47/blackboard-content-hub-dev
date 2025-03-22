/**
 * Storage adapter interface for abstracting storage mechanisms
 */
export interface IStorageAdapter {
    /**
     * Get an item from storage
     * @param key Storage key
     * @returns The stored value or null if not found
     */
    getItem<T>(key: string): T | null;
    
    /**
     * Store an item
     * @param key Storage key
     * @param value Value to store
     * @returns True if successful
     */
    setItem<T>(key: string, value: T): boolean;
    
    /**
     * Remove an item from storage
     * @param key Storage key
     * @returns True if successful
     */
    removeItem(key: string): boolean;
    
    /**
     * Clear all items from storage
     * @returns True if successful
     */
    clear(): boolean;
    
    /**
     * Check if a key exists in storage
     * @param key Storage key
     * @returns True if key exists
     */
    hasItem(key: string): boolean;
  }