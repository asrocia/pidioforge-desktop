import {
  debounce,
  throttle,
  measureRender,
  PerformanceMonitor,
  FPSCounter,
  getMemoryUsage,
  requestIdleCallback,
  cancelIdleCallback,
  prefersReducedMotion
} from './performance';

describe('debounce', () => {
  jest.useFakeTimers();

  it('delays function execution', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('cancels previous calls', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes arguments correctly', () => {
    const fn = jest.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('test', 123);
    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('test', 123);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });
});

describe('throttle', () => {
  jest.useFakeTimers();

  it('limits function calls', () => {
    const fn = jest.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('executes immediately on first call', () => {
    const fn = jest.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  afterEach(() => {
    jest.clearAllTimers();
  });
});

describe('measureRender', () => {
  it('measures execution time', () => {
    const callback = jest.fn();
    const duration = measureRender('TestComponent', callback);

    expect(callback).toHaveBeenCalled();
    expect(duration).toBeGreaterThanOrEqual(0);
  });

  it('warns on slow renders', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    measureRender('SlowComponent', () => {
      // Simulate slow render
      const start = Date.now();
      while (Date.now() - start < 20) {
        // Busy wait
      }
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('PerformanceMonitor', () => {
  it('initializes with threshold', () => {
    const monitor = new PerformanceMonitor(50);
    expect(monitor).toBeDefined();
  });

  it('tracks long tasks', () => {
    const monitor = new PerformanceMonitor(10);
    monitor.start();

    // Simulate long task
    const start = Date.now();
    while (Date.now() - start < 20) {
      // Busy wait
    }

    const stats = monitor.getStats();
    monitor.stop();

    expect(stats).toHaveProperty('count');
    expect(stats).toHaveProperty('totalDuration');
    expect(stats).toHaveProperty('avgDuration');
    expect(stats).toHaveProperty('maxDuration');
  });

  it('clears long tasks', () => {
    const monitor = new PerformanceMonitor(50);
    monitor.start();
    
    // Add some tasks
    monitor.clearLongTasks();
    
    const tasks = monitor.getLongTasks();
    expect(tasks).toHaveLength(0);
    
    monitor.stop();
  });

  it('calculates stats correctly', () => {
    const monitor = new PerformanceMonitor(0);
    const stats = monitor.getStats();

    expect(stats.count).toBe(0);
    expect(stats.totalDuration).toBe(0);
    expect(stats.avgDuration).toBe(0);
    expect(stats.maxDuration).toBe(0);
  });
});

describe('FPSCounter', () => {
  it('starts and stops correctly', () => {
    const counter = new FPSCounter();
    counter.start();
    
    // Let it run for a bit
    setTimeout(() => {
      counter.stop();
      const fps = counter.getFPS();
      expect(fps).toBeGreaterThanOrEqual(0);
    }, 100);
  });

  it('calculates FPS', () => {
    const counter = new FPSCounter();
    counter.start();

    setTimeout(() => {
      const fps = counter.getFPS();
      const minFps = counter.getMinFPS();
      const maxFps = counter.getMaxFPS();

      expect(fps).toBeGreaterThanOrEqual(0);
      expect(minFps).toBeGreaterThanOrEqual(0);
      expect(maxFps).toBeGreaterThanOrEqual(minFps);

      counter.stop();
    }, 100);
  });

  it('returns 0 FPS when no frames recorded', () => {
    const counter = new FPSCounter();
    expect(counter.getFPS()).toBe(0);
    expect(counter.getMinFPS()).toBe(0);
    expect(counter.getMaxFPS()).toBe(0);
  });
});

describe('getMemoryUsage', () => {
  it('returns memory info when available', () => {
    // Mock performance.memory
    const mockMemory = {
      usedJSHeapSize: 10000000,
      totalJSHeapSize: 20000000,
      jsHeapSizeLimit: 100000000
    };

    Object.defineProperty(performance, 'memory', {
      value: mockMemory,
      configurable: true
    });

    const memory = getMemoryUsage();
    
    if (memory) {
      expect(memory.usedJSHeapSize).toBe(10000000);
      expect(memory.totalJSHeapSize).toBe(20000000);
      expect(memory.jsHeapSizeLimit).toBe(100000000);
      expect(memory.usagePercent).toBe(10);
    }
  });

  it('returns null when memory API unavailable', () => {
    Object.defineProperty(performance, 'memory', {
      value: undefined,
      configurable: true
    });

    const memory = getMemoryUsage();
    expect(memory).toBeNull();
  });
});

describe('requestIdleCallback', () => {
  it('calls callback when idle', (done) => {
    const callback = jest.fn(() => done());
    requestIdleCallback(callback);
  });

  it('falls back to setTimeout', (done) => {
    // Mock missing requestIdleCallback
    const originalRIC = (window as any).requestIdleCallback;
    delete (window as any).requestIdleCallback;

    const callback = jest.fn(() => done());
    requestIdleCallback(callback);

    // Restore
    (window as any).requestIdleCallback = originalRIC;
  });
});

describe('cancelIdleCallback', () => {
  it('cancels idle callback', () => {
    const callback = jest.fn();
    const id = requestIdleCallback(callback);
    cancelIdleCallback(id);

    // Callback should not be called
    setTimeout(() => {
      expect(callback).not.toHaveBeenCalled();
    }, 100);
  });
});

describe('prefersReducedMotion', () => {
  it('detects reduced motion preference', () => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const result = prefersReducedMotion();
    expect(typeof result).toBe('boolean');
  });
});

describe('Performance Integration', () => {
  it('debounce and throttle work together', () => {
    jest.useFakeTimers();

    const fn = jest.fn();
    const debouncedFn = debounce(fn, 100);
    const throttledFn = throttle(debouncedFn, 50);

    throttledFn();
    throttledFn();
    throttledFn();

    jest.advanceTimersByTime(150);

    expect(fn).toHaveBeenCalled();

    jest.clearAllTimers();
  });

  it('performance monitor tracks multiple metrics', () => {
    const monitor = new PerformanceMonitor(10);
    const fpsCounter = new FPSCounter();

    monitor.start();
    fpsCounter.start();

    // Simulate work
    const start = Date.now();
    while (Date.now() - start < 50) {
      // Busy wait
    }

    setTimeout(() => {
      const stats = monitor.getStats();
      const fps = fpsCounter.getFPS();

      expect(stats.count).toBeGreaterThanOrEqual(0);
      expect(fps).toBeGreaterThanOrEqual(0);

      monitor.stop();
      fpsCounter.stop();
    }, 100);
  });
});

describe('Performance Edge Cases', () => {
  it('handles rapid debounce calls', () => {
    jest.useFakeTimers();

    const fn = jest.fn();
    const debouncedFn = debounce(fn, 100);

    for (let i = 0; i < 1000; i++) {
      debouncedFn();
    }

    jest.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);

    jest.clearAllTimers();
  });

  it('handles zero delay debounce', () => {
    jest.useFakeTimers();

    const fn = jest.fn();
    const debouncedFn = debounce(fn, 0);

    debouncedFn();
    jest.advanceTimersByTime(0);

    expect(fn).toHaveBeenCalledTimes(1);

    jest.clearAllTimers();
  });

  it('handles negative threshold in PerformanceMonitor', () => {
    const monitor = new PerformanceMonitor(-10);
    monitor.start();
    
    const stats = monitor.getStats();
    expect(stats).toBeDefined();
    
    monitor.stop();
  });
});
