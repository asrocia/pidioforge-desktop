import '@testing-library/jest-dom';
import { afterAll, beforeAll, vi } from 'vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  value: class {
    disconnect() {}
    observe() {}
    takeRecords() {
      return [];
    }
    unobserve() {}
  },
});

Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  value: class {
    disconnect() {}
    observe() {}
    unobserve() {}
  },
});

Object.defineProperty(globalThis, 'requestIdleCallback', {
  writable: true,
  value: (callback: IdleRequestCallback) => window.setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 50,
    } as IdleDeadline);
  }, 1),
});

Object.defineProperty(globalThis, 'cancelIdleCallback', {
  writable: true,
  value: (id: number) => window.clearTimeout(id),
});

Object.defineProperty(performance, 'memory', {
  writable: true,
  value: {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 20000000,
    jsHeapSizeLimit: 100000000,
  },
});

const originalError = console.error;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }

    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
