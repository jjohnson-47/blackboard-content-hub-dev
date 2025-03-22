import '@testing-library/jest-dom';
import { beforeAll, afterEach, vi } from 'vitest';

// Add TypeScript declarations for global objects
declare global {
  interface Window {
    CodeMirror: any;
  }
}

// Mock global objects
beforeAll(() => {
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn()
  };
  
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  
  // Mock CodeMirror (required for Editor component)
  window.CodeMirror = {
    fromTextArea: vi.fn().mockReturnValue({
      on: vi.fn(),
      getValue: vi.fn().mockReturnValue(''),
      setValue: vi.fn(),
      setOption: vi.fn(),
      refresh: vi.fn(),
      focus: vi.fn(),
    }),
  };
  
  // Mock fetch API (for API service)
  window.fetch = vi.fn().mockImplementation(() => Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
    text: () => Promise.resolve(''),
  }));
});

// Reset mocks after each test
afterEach(() => {
  vi.resetAllMocks();
});