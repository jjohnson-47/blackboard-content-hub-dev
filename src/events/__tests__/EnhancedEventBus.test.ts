import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EnhancedEventBus } from '../EnhancedEventBus';
import { AppError, ErrorType, IErrorHandler } from '../../errors/IErrorHandler';

describe('EnhancedEventBus', () => {
  let eventBus: EnhancedEventBus;
  let mockErrorHandler: IErrorHandler;
  
  beforeEach(() => {
    // Create a mock error handler
    mockErrorHandler = {
      handle: vi.fn(),
      createAndHandle: vi.fn(),
      handleIframeError: vi.fn(),
      handleMathApiError: vi.fn(),
      attemptRecovery: vi.fn().mockReturnValue(true)
    };
    
    // Create a new event bus with the mock error handler
    eventBus = new EnhancedEventBus(mockErrorHandler);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should emit events to registered listeners with correct data', () => {
    // Arrange
    const mockCallback = vi.fn();
    const testData = { id: '123', value: 'test' };
    
    // Act
    eventBus.on('test-event', mockCallback);
    eventBus.emit('test-event', testData);
    
    // Assert
    expect(mockCallback).toHaveBeenCalledWith(testData);
  });
  
  it('should allow unsubscribing from events using the returned function', () => {
    // Arrange
    const mockCallback = vi.fn();
    
    // Act
    const unsubscribe = eventBus.on('test-event', mockCallback);
    unsubscribe();
    eventBus.emit('test-event', { data: 'test' });
    
    // Assert
    expect(mockCallback).not.toHaveBeenCalled();
  });
  
  it('should support one-time event subscription with once', () => {
    // Arrange
    const mockCallback = vi.fn();
    
    // Act
    eventBus.once('test-event', mockCallback);
    eventBus.emit('test-event', { data: 'first' });
    eventBus.emit('test-event', { data: 'second' });
    
    // Assert
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith({ data: 'first' });
  });
  
  it('should handle errors in event listeners and continue execution', () => {
    // Arrange
    const errorCallback = vi.fn().mockImplementation(() => {
      throw new Error('Test error');
    });
    const normalCallback = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Act
    eventBus.on('test-event', errorCallback);
    eventBus.on('test-event', normalCallback);
    eventBus.emit('test-event', { data: 'test' });
    
    // Assert
    expect(consoleSpy).toHaveBeenCalled();
    expect(normalCallback).toHaveBeenCalled();
    expect(mockErrorHandler.handle).toHaveBeenCalledWith(expect.any(AppError));
  });
  
  it('should correctly report if an event has listeners', () => {
    // Arrange
    const mockCallback = vi.fn();
    
    // Act & Assert - Initially no listeners
    expect(eventBus.hasListeners('test-event')).toBe(false);
    
    // Act & Assert - After adding a listener
    eventBus.on('test-event', mockCallback);
    expect(eventBus.hasListeners('test-event')).toBe(true);
    
    // Act & Assert - After removing all listeners
    eventBus.off('test-event', mockCallback);
    expect(eventBus.hasListeners('test-event')).toBe(false);
  });
  
  it('should correctly return all active events', () => {
    // Arrange
    const mockCallback = vi.fn();
    
    // Act - Register listeners for multiple events
    eventBus.on('event1', mockCallback);
    eventBus.on('event2', mockCallback);
    eventBus.on('event3', mockCallback);
    
    // Get active events
    const activeEvents = eventBus.getActiveEvents();
    
    // Assert
    expect(activeEvents).toHaveLength(3);
    expect(activeEvents).toContain('event1');
    expect(activeEvents).toContain('event2');
    expect(activeEvents).toContain('event3');
  });
  
  it('should enable debug mode', () => {
    // Arrange
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Act
    eventBus.setDebugMode(true);
    eventBus.on('test-event', vi.fn());
    
    // Assert
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[EventBus]'));
  });
  
  it('should clear all listeners for a specific event', () => {
    // Arrange
    const mockCallback1 = vi.fn();
    const mockCallback2 = vi.fn();
    
    // Register multiple callbacks for the same event
    eventBus.on('test-event', mockCallback1);
    eventBus.on('test-event', mockCallback2);
    
    // Act
    eventBus.clearEvent('test-event');
    eventBus.emit('test-event', { data: 'test' });
    
    // Assert
    expect(mockCallback1).not.toHaveBeenCalled();
    expect(mockCallback2).not.toHaveBeenCalled();
    expect(eventBus.hasListeners('test-event')).toBe(false);
  });
  
  it('should clear all listeners for all events', () => {
    // Arrange
    const mockCallback1 = vi.fn();
    const mockCallback2 = vi.fn();
    
    // Register callbacks for different events
    eventBus.on('event1', mockCallback1);
    eventBus.on('event2', mockCallback2);
    
    // Act
    eventBus.clearAllEvents();
    eventBus.emit('event1', { data: 'test' });
    eventBus.emit('event2', { data: 'test' });
    
    // Assert
    expect(mockCallback1).not.toHaveBeenCalled();
    expect(mockCallback2).not.toHaveBeenCalled();
    expect(eventBus.getActiveEvents()).toHaveLength(0);
  });
  
  it('should correctly return the listener count for an event', () => {
    // Arrange
    const mockCallback1 = vi.fn();
    const mockCallback2 = vi.fn();
    
    // Act & Assert - Initially no listeners
    expect(eventBus.getListenerCount('test-event')).toBe(0);
    
    // Act & Assert - After adding listeners
    eventBus.on('test-event', mockCallback1);
    expect(eventBus.getListenerCount('test-event')).toBe(1);
    
    eventBus.on('test-event', mockCallback2);
    expect(eventBus.getListenerCount('test-event')).toBe(2);
    
    // Act & Assert - After removing a listener
    eventBus.off('test-event', mockCallback1);
    expect(eventBus.getListenerCount('test-event')).toBe(1);
  });
  
  it('should not throw when emitting an event with no listeners', () => {
    // Act & Assert - Should not throw
    expect(() => {
      eventBus.emit('non-existent-event', { data: 'test' });
    }).not.toThrow();
  });
});