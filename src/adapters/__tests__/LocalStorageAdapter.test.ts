import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalStorageAdapter } from '../LocalStorageAdapter';

describe('LocalStorageAdapter', () => {
  // Mock localStorage
  let mockStorage: { [key: string]: string } = {};
  
  // Setup localStorage mock
  beforeEach(() => {
    mockStorage = {};
    
    // Mock localStorage methods
    global.localStorage = {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, value) => { mockStorage[key] = value.toString(); }),
      removeItem: vi.fn((key) => { delete mockStorage[key]; }),
      clear: vi.fn(() => { mockStorage = {}; }),
      length: 0,
      key: vi.fn((i) => ''),
    };
  });
  
  it('should set and get an item', () => {
    // Arrange
    const adapter = new LocalStorageAdapter();
    const testObj = { name: 'test', value: 123 };
    
    // Act
    adapter.setItem('test-key', testObj);
    const result = adapter.getItem('test-key');
    
    // Assert
    expect(localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(testObj));
    expect(result).toEqual(testObj);
  });
  
  it('should return null for non-existent items', () => {
    // Arrange
    const adapter = new LocalStorageAdapter();
    
    // Act
    const result = adapter.getItem('non-existent');
    
    // Assert
    expect(result).toBeNull();
  });
  
  it('should remove an item', () => {
    // Arrange
    const adapter = new LocalStorageAdapter();
    adapter.setItem('test-key', 'test-value');
    
    // Act
    const result = adapter.removeItem('test-key');
    
    // Assert
    expect(result).toBe(true);
    expect(localStorage.removeItem).toHaveBeenCalledWith('test-key');
  });
  
  it('should clear all items', () => {
    // Arrange
    const adapter = new LocalStorageAdapter();
    adapter.setItem('key1', 'value1');
    adapter.setItem('key2', 'value2');
    
    // Act
    const result = adapter.clear();
    
    // Assert
    expect(result).toBe(true);
    expect(localStorage.clear).toHaveBeenCalled();
  });
  
  it('should check if an item exists', () => {
    // Arrange
    const adapter = new LocalStorageAdapter();
    adapter.setItem('existing-key', 'test');
    
    // Act & Assert
    expect(adapter.hasItem('existing-key')).toBe(true);
    expect(adapter.hasItem('non-existent-key')).toBe(false);
  });
  
  it('should handle errors when setting an item', () => {
    // Arrange
    const adapter = new LocalStorageAdapter();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem = vi.fn().mockImplementation(() => {
      throw new Error('Storage full');
    });
    
    // Act
    const result = adapter.setItem('test-key', 'test-value');
    
    // Assert
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
  });
});