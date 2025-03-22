import { describe, it, expect } from 'vitest';
import { ServiceContainer } from '../ServiceContainer';

describe('ServiceContainer', () => {
  it('should register and retrieve a service', () => {
    // Arrange
    const container = new ServiceContainer();
    const service = { name: 'test-service' };
    
    // Act
    container.register('test', service);
    const retrieved = container.get('test');
    
    // Assert
    expect(retrieved).toBe(service);
  });
  
  it('should check if a service exists', () => {
    // Arrange
    const container = new ServiceContainer();
    
    // Act
    container.register('exists', {});
    
    // Assert
    expect(container.has('exists')).toBe(true);
    expect(container.has('does-not-exist')).toBe(false);
  });
  
  it('should throw an error when getting a non-existent service', () => {
    // Arrange
    const container = new ServiceContainer();
    
    // Act & Assert
    expect(() => container.get('missing')).toThrow("Service 'missing' not registered");
  });
});