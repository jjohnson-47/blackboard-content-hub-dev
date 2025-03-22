import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandler, ErrorEventType } from '../ErrorHandler';
import { AppError, ErrorType } from '../IErrorHandler';
import { IEventBus } from '../../events/IEventBus';

describe('ErrorHandler', () => {
  const originalConsoleError = console.error;
  let mockConsoleError: any;
  
  beforeEach(() => {
    mockConsoleError = vi.fn();
    console.error = mockConsoleError;
    
    // Mock window.Toast if needed for tests
    if (typeof window !== 'undefined') {
      (window as any).Toast = {
        error: vi.fn()
      };
    }
  });
  
  afterEach(() => {
    console.error = originalConsoleError;
    
    // Clean up Toast mock
    if (typeof window !== 'undefined') {
      delete (window as any).Toast;
    }
  });
  
  it('should handle AppError correctly', () => {
    // Arrange
    const errorHandler = new ErrorHandler();
    const appError = new AppError(ErrorType.VALIDATION, 'Invalid input', { field: 'username' });
    
    // Act
    errorHandler.handle(appError);
    
    // Assert
    expect(mockConsoleError).toHaveBeenCalledWith(
      '[validation] Invalid input', 
      { field: 'username' }
    );
  });
  
  it('should convert regular Error to AppError', () => {
    // Arrange
    const errorHandler = new ErrorHandler();
    const standardError = new Error('Something went wrong');
    
    // Act
    errorHandler.handle(standardError);
    
    // Assert
    expect(mockConsoleError).toHaveBeenCalledWith(
      '[runtime] Something went wrong', 
      undefined
    );
  });
  
  it('should create and handle an error', () => {
    // Arrange
    const errorHandler = new ErrorHandler();
    const spy = vi.spyOn(errorHandler, 'handle');
    
    // Act
    errorHandler.createAndHandle(ErrorType.NETWORK, 'Failed to fetch data', { status: 404 });
    
    // Assert
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ErrorType.NETWORK,
        message: 'Failed to fetch data',
        details: { status: 404 }
      })
    );
  });
  
  it('should use toast service when provided', () => {
    // Arrange
    const mockToast = { error: vi.fn() };
    const errorHandler = new ErrorHandler(mockToast);
    const error = new Error('Test error');
    
    // Act
    errorHandler.handle(error);
    
    // Assert
    expect(mockToast.error).toHaveBeenCalledWith('Error', 'Test error');
    expect(mockConsoleError).toHaveBeenCalledWith(
      '[runtime] Test error',
      undefined
    );
  });
  
  describe('EventBus integration', () => {
    it('should emit general error event through EventBus', () => {
      // Arrange
      const mockEventBus: IEventBus = {
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn(),
        emit: vi.fn()
      };
      const errorHandler = new ErrorHandler(undefined, mockEventBus);
      const error = new AppError(ErrorType.RUNTIME, 'Test error', { source: 'test' });
      
      // Act
      errorHandler.handle(error);
      
      // Assert
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        ErrorEventType.ERROR_OCCURRED,
        expect.objectContaining({
          type: ErrorType.RUNTIME,
          message: 'Test error',
          details: { source: 'test' },
          timestamp: expect.any(Date)
        })
      );
    });
    
    it('should emit type-specific error events for network errors', () => {
      // Arrange
      const mockEventBus: IEventBus = {
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn(),
        emit: vi.fn()
      };
      const errorHandler = new ErrorHandler(undefined, mockEventBus);
      const error = new AppError(ErrorType.NETWORK, 'API connection failed', { url: '/api/data' });
      
      // Act
      errorHandler.handle(error);
      
      // Assert
      // Should emit both the general error event
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        ErrorEventType.ERROR_OCCURRED,
        expect.any(Object)
      );
      
      // And the network-specific error event
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        ErrorEventType.NETWORK_ERROR,
        expect.objectContaining({
          type: ErrorType.NETWORK,
          message: 'API connection failed',
          details: { url: '/api/data' },
          timestamp: expect.any(Date)
        })
      );
    });
    
    it('should emit factory-specific error events for factory errors', () => {
      // Arrange
      const mockEventBus: IEventBus = {
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn(),
        emit: vi.fn()
      };
      const errorHandler = new ErrorHandler(undefined, mockEventBus);
      const error = new AppError(ErrorType.FACTORY_REGISTRATION, 'Factory registration failed', { id: 'testFactory' });
      
      // Act
      errorHandler.handle(error);
      
      // Assert
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        ErrorEventType.FACTORY_ERROR,
        expect.objectContaining({
          type: ErrorType.FACTORY_REGISTRATION
        })
      );
    });
    
    it('should handle iframe errors with source identification', () => {
      // Arrange
      const mockEventBus: IEventBus = {
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn(),
        emit: vi.fn()
      };
      const errorHandler = new ErrorHandler(undefined, mockEventBus);
      const mockIframe = document.createElement('iframe');
      mockIframe.src = 'https://example.com/embed';
      
      // Act
      errorHandler.handleIframeError(mockIframe, 'Iframe content failed to load', { code: 404 });
      
      // Assert
      // Should emit iframe-specific error event
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        ErrorEventType.IFRAME_ERROR,
        expect.objectContaining({
          source: 'https://example.com/embed',
          message: 'Iframe content failed to load',
          details: { code: 404 },
          timestamp: expect.any(Date)
        })
      );
      
      // Should also emit the general error event via the handle method
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        ErrorEventType.ERROR_OCCURRED,
        expect.objectContaining({
          message: expect.stringContaining('Error in iframe')
        })
      );
    });
    
    it('should handle iframe errors with string identifier', () => {
      // Arrange
      const mockEventBus: IEventBus = {
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn(),
        emit: vi.fn()
      };
      const errorHandler = new ErrorHandler(undefined, mockEventBus);
      
      // Act
      errorHandler.handleIframeError('desmos-calculator', 'Failed to initialize calculator', { errorCode: 'INIT_ERROR' });
      
      // Assert
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        ErrorEventType.IFRAME_ERROR,
        expect.objectContaining({
          source: 'desmos-calculator',
          message: 'Failed to initialize calculator',
          details: { errorCode: 'INIT_ERROR' }
        })
      );
    });
    
    it('should handle math API errors', () => {
      // Arrange
      const mockEventBus: IEventBus = {
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn(),
        emit: vi.fn()
      };
      const errorHandler = new ErrorHandler(undefined, mockEventBus);
      
      // Act
      errorHandler.handleMathApiError('desmos', 'Failed to render graph', { errorCode: 'RENDER_ERROR' });
      
      // Assert
      // Should emit math API-specific error event
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        ErrorEventType.MATH_API_ERROR,
        expect.objectContaining({
          apiType: 'desmos',
          message: 'Failed to render graph',
          details: { errorCode: 'RENDER_ERROR' },
          timestamp: expect.any(Date)
        })
      );
      
      // Should also emit the general error event via the handle method
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        ErrorEventType.ERROR_OCCURRED,
        expect.objectContaining({
          message: expect.stringContaining('Error in desmos API')
        })
      );
    });
    
    it('should attempt recovery and emit recovery event', () => {
      // Arrange
      const mockEventBus: IEventBus = {
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn(),
        emit: vi.fn()
      };
      const errorHandler = new ErrorHandler(undefined, mockEventBus);
      const recoveryContext = { component: 'calculator', retryCount: 1 };
      
      // Act
      const result = errorHandler.attemptRecovery(ErrorType.MATH_API, recoveryContext);
      
      // Assert
      expect(result).toBe(true);
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        ErrorEventType.RECOVERY_ATTEMPT,
        expect.objectContaining({
          errorType: ErrorType.MATH_API,
          context: recoveryContext,
          timestamp: expect.any(Date)
        })
      );
    });
    
    it('should return false from attemptRecovery when no event bus is available', () => {
      // Arrange
      const errorHandler = new ErrorHandler(); // No event bus
      
      // Act
      const result = errorHandler.attemptRecovery(ErrorType.MATH_API, { component: 'calculator' });
      
      // Assert
      expect(result).toBe(false);
    });
  });
});