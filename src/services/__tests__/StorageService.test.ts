import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { StorageService } from '../StorageService';
import { IStorageAdapter } from '../../adapters/IStorageAdapter';
import { IErrorHandler } from '../../errors/IErrorHandler';
import { ComponentMetadata } from '../../models/ComponentMetadata';
import { StorageComponentContent } from '../../models/index';
import { AppError, ErrorType } from '../../errors/IErrorHandler';

describe('StorageService', () => {
  // Define proper mock types for Vitest
  type MockStorageAdapter = {
    [K in keyof IStorageAdapter]: Mock;
  };
  
  type MockErrorHandler = {
    [K in keyof IErrorHandler]: Mock;
  };
  
  // Mock storage adapter with proper typing
  const mockStorageAdapter = {
    getItem: vi.fn(),
    setItem: vi.fn().mockReturnValue(true),
    removeItem: vi.fn().mockReturnValue(true),
    clear: vi.fn().mockReturnValue(true),
    hasItem: vi.fn()
  } as unknown as MockStorageAdapter;
  
  // Mock error handler with proper typing
  const mockErrorHandler = {
    handle: vi.fn(),
    createAndHandle: vi.fn()
  } as unknown as MockErrorHandler;
  
  // Test fixtures
  const testMetadata: ComponentMetadata = {
    id: 'test-component-1',
    name: 'Test Component',
    locationType: 'local',
    lastEdited: new Date('2025-01-01')
  };
  
  const testContent: StorageComponentContent = {
    html: '<div>Test HTML</div>',
    css: 'body { color: red; }',
    js: 'console.log("Test JS");',
    metadata: { version: '1.0.0' }
  };
  
  let storageService: StorageService;
  
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Create a fresh storage service instance
    storageService = new StorageService(
      mockStorageAdapter as unknown as IStorageAdapter,
      mockErrorHandler as unknown as IErrorHandler
    );
  });
  
  // #region saveComponent tests
  describe('saveComponent', () => {
    it('should save component content and metadata correctly', () => {
      // Arrange
      mockStorageAdapter.getItem.mockReturnValueOnce([]); // No existing components
      
      // Act
      const result = storageService.saveComponent(testMetadata, testContent);
      
      // Assert
      expect(result).toBe(true);
      
      // Should save component content
      expect(mockStorageAdapter.setItem).toHaveBeenCalledWith(
        'devpreview_component_test-component-1',
        testContent
      );
      
      // Should save to component list
      expect(mockStorageAdapter.setItem).toHaveBeenCalledWith(
        'devpreview_components',
        [expect.objectContaining({ id: 'test-component-1' })]
      );
      
      // Should update last edited
      expect(mockStorageAdapter.setItem).toHaveBeenCalledWith(
        'devpreview_last_edited',
        'test-component-1'
      );
    });
    
    it('should update existing component if ID already exists', () => {
      // Arrange
      const existingComponents = [
        { ...testMetadata, name: 'Old Name' }
      ];
      mockStorageAdapter.getItem.mockReturnValueOnce(existingComponents);
      
      // Act
      const result = storageService.saveComponent(
        { ...testMetadata, name: 'Updated Name' },
        testContent
      );
      
      // Assert
      expect(result).toBe(true);
      
      // Should update component in list
      expect(mockStorageAdapter.setItem).toHaveBeenCalledWith(
        'devpreview_components',
        [expect.objectContaining({ 
          id: 'test-component-1',
          name: 'Updated Name'
        })]
      );
    });
    
    it('should handle errors during save operation', () => {
      // Arrange
      mockStorageAdapter.getItem.mockReturnValueOnce([]);
      mockStorageAdapter.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      // Act
      const result = storageService.saveComponent(testMetadata, testContent);
      
      // Assert
      expect(result).toBe(false);
      expect(mockErrorHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.STORAGE,
          message: expect.stringContaining('Failed to save component')
        })
      );
    });
  });
  // #endregion
  
  // #region loadComponent tests
  describe('loadComponent', () => {
    it('should load component content by ID', () => {
      // Arrange
      mockStorageAdapter.getItem.mockReturnValueOnce(testContent);
      
      // Act
      const result = storageService.loadComponent('test-component-1');
      
      // Assert
      expect(result).toEqual(testContent);
      expect(mockStorageAdapter.getItem).toHaveBeenCalledWith('devpreview_component_test-component-1');
      
      // Should update last edited
      expect(mockStorageAdapter.setItem).toHaveBeenCalledWith(
        'devpreview_last_edited',
        'test-component-1'
      );
    });
    
    it('should throw AppError when component not found', () => {
      // Arrange
      mockStorageAdapter.getItem.mockReturnValueOnce(null);
      
      // Act & Assert
      expect(() => storageService.loadComponent('non-existent')).toThrow();
      expect(mockErrorHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.STORAGE,
          message: expect.stringContaining('Component not found')
        })
      );
    });
    
    it('should handle errors during load operation', () => {
      // Arrange
      mockStorageAdapter.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      // Act & Assert
      expect(() => storageService.loadComponent('test-component-1')).toThrow();
      expect(mockErrorHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.STORAGE,
          message: expect.stringContaining('Failed to load component')
        })
      );
    });
  });
  // #endregion
  
  // #region getLastEditedComponent tests
  describe('getLastEditedComponent', () => {
    it('should return the last edited component', () => {
      // Arrange
      mockStorageAdapter.getItem.mockReturnValueOnce('test-component-1'); // Last edited ID
      mockStorageAdapter.getItem.mockReturnValueOnce([testMetadata]); // Component list
      
      // Act
      const result = storageService.getLastEditedComponent();
      
      // Assert
      expect(result).toEqual(testMetadata);
    });
    
    it('should return null if no last edited component is set', () => {
      // Arrange
      mockStorageAdapter.getItem.mockReturnValueOnce(null); // No last edited ID
      
      // Act
      const result = storageService.getLastEditedComponent();
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should return null if last edited component is not found in list', () => {
      // Arrange
      mockStorageAdapter.getItem.mockReturnValueOnce('non-existent'); // Last edited ID
      mockStorageAdapter.getItem.mockReturnValueOnce([]); // Empty component list
      
      // Act
      const result = storageService.getLastEditedComponent();
      
      // Assert
      expect(result).toBeNull();
    });
    
    it('should handle errors properly', () => {
      // Arrange
      mockStorageAdapter.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      // Act
      const result = storageService.getLastEditedComponent();
      
      // Assert
      expect(result).toBeNull();
      expect(mockErrorHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.STORAGE,
          message: expect.stringContaining('Failed to get last edited component')
        })
      );
    });
  });
  // #endregion
  
  // #region getAllLocalComponents tests
  describe('getAllLocalComponents', () => {
    it('should return all local components', () => {
      // Arrange
      const components = [testMetadata, { ...testMetadata, id: 'test-component-2' }];
      mockStorageAdapter.getItem.mockReturnValueOnce(components);
      
      // Act
      const result = storageService.getAllLocalComponents();
      
      // Assert
      expect(result).toEqual(components);
      expect(mockStorageAdapter.getItem).toHaveBeenCalledWith('devpreview_components');
    });
    
    it('should return empty array if no components exist', () => {
      // Arrange
      mockStorageAdapter.getItem.mockReturnValueOnce(null);
      
      // Act
      const result = storageService.getAllLocalComponents();
      
      // Assert
      expect(result).toEqual([]);
    });
    
    it('should handle errors properly', () => {
      // Arrange
      mockStorageAdapter.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      // Act
      const result = storageService.getAllLocalComponents();
      
      // Assert
      expect(result).toEqual([]);
      expect(mockErrorHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.STORAGE,
          message: expect.stringContaining('Failed to get all components')
        })
      );
    });
  });
  // #endregion
  
  // #region deleteComponent tests
  describe('deleteComponent', () => {
    it('should delete component data and update component list', () => {
      // Arrange
      const components = [testMetadata, { ...testMetadata, id: 'test-component-2' }];
      mockStorageAdapter.getItem.mockReturnValueOnce(components);
      mockStorageAdapter.getItem.mockReturnValueOnce('test-component-1'); // Last edited ID
      
      // Act
      const result = storageService.deleteComponent('test-component-1');
      
      // Assert
      expect(result).toBe(true);
      
      // Should remove component data
      expect(mockStorageAdapter.removeItem).toHaveBeenCalledWith('devpreview_component_test-component-1');
      
      // Should update component list
      expect(mockStorageAdapter.setItem).toHaveBeenCalledWith(
        'devpreview_components',
        [expect.objectContaining({ id: 'test-component-2' })]
      );
      
      // Should update last edited to next component
      expect(mockStorageAdapter.setItem).toHaveBeenCalledWith(
        'devpreview_last_edited',
        'test-component-2'
      );
    });
    
    it('should remove last edited key if deleting the only component', () => {
      // Arrange
      mockStorageAdapter.getItem.mockReturnValueOnce([testMetadata]); // Component list with one item
      mockStorageAdapter.getItem.mockReturnValueOnce('test-component-1'); // Last edited ID
      
      // Act
      const result = storageService.deleteComponent('test-component-1');
      
      // Assert
      expect(result).toBe(true);
      
      // Should update component list to empty
      expect(mockStorageAdapter.setItem).toHaveBeenCalledWith(
        'devpreview_components',
        []
      );
      
      // Should remove last edited key
      expect(mockStorageAdapter.removeItem).toHaveBeenCalledWith('devpreview_last_edited');
    });
    
    it('should handle errors properly', () => {
      // Arrange
      mockStorageAdapter.removeItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      // Act
      const result = storageService.deleteComponent('test-component-1');
      
      // Assert
      expect(result).toBe(false);
      expect(mockErrorHandler.handle).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ErrorType.STORAGE,
          message: expect.stringContaining('Failed to delete component')
        })
      );
    });
  });
  // #endregion
});