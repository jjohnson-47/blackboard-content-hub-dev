import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../EventBus';

describe('EventBus', () => {
  it('should emit events to registered listeners', () => {
    // Arrange
    const eventBus = new EventBus();
    const mockCallback = vi.fn();
    
    // Act
    eventBus.on('test-event', mockCallback);
    eventBus.emit('test-event', 'arg1', 'arg2');
    
    // Assert
    expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2');
  });
  
  it('should allow unsubscribing from events', () => {
    // Arrange
    const eventBus = new EventBus();
    const mockCallback = vi.fn();
    
    // Act
    const unsubscribe = eventBus.on('test-event', mockCallback);
    unsubscribe();
    eventBus.emit('test-event');
    
    // Assert
    expect(mockCallback).not.toHaveBeenCalled();
  });
  
  it('should support once subscription', () => {
    // Arrange
    const eventBus = new EventBus();
    const mockCallback = vi.fn();
    
    // Act
    eventBus.once('test-event', mockCallback);
    eventBus.emit('test-event');
    eventBus.emit('test-event');
    
    // Assert
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
  
  it('should handle errors in event listeners', () => {
    // Arrange
    const eventBus = new EventBus();
    const mockCallback1 = vi.fn().mockImplementation(() => {
      throw new Error('Test error');
    });
    const mockCallback2 = vi.fn();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Act
    eventBus.on('test-event', mockCallback1);
    eventBus.on('test-event', mockCallback2);
    eventBus.emit('test-event');
    
    // Assert
    expect(consoleSpy).toHaveBeenCalled();
    expect(mockCallback2).toHaveBeenCalled();
  });
});