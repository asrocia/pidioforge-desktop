/**
 * Performance monitoring utilities for PidioForge Desktop
 */

/**
 * Debounce function to limit how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(later, wait);
  };
}

/**
 * Throttle function to ensure a function is called at most once per interval
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Measure component render time
 */
export function measureRender(componentName: string, callback: () => void) {
  const start = performance.now();
  callback();
  const end = performance.now();
  const duration = end - start;
  
  if (duration > 16) { // Longer than one frame (60fps)
    console.warn(`[Performance] ${componentName} took ${duration.toFixed(2)}ms to render`);
  }
  
  return duration;
}

/**
 * Performance observer for tracking long tasks
 */
export class PerformanceMonitor {
  private observer: PerformanceObserver | null = null;
  private longTasks: PerformanceEntry[] = [];
  private readonly threshold: number;

  constructor(threshold: number = 50) {
    this.threshold = threshold;
  }

  start() {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > this.threshold) {
          this.longTasks.push(entry);
          console.warn(`[Performance] Long task detected: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
        }
      }
    });

    try {
      this.observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    } catch (e) {
      console.warn('Failed to start performance observer:', e);
    }
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  getLongTasks() {
    return [...this.longTasks];
  }

  clearLongTasks() {
    this.longTasks = [];
  }

  getStats() {
    const totalDuration = this.longTasks.reduce((sum, task) => sum + task.duration, 0);
    const avgDuration = this.longTasks.length > 0 ? totalDuration / this.longTasks.length : 0;
    
    return {
      count: this.longTasks.length,
      totalDuration,
      avgDuration,
      maxDuration: Math.max(...this.longTasks.map(t => t.duration), 0)
    };
  }
}

/**
 * Memory usage tracker
 */
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usagePercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
    };
  }
  return null;
}

/**
 * FPS counter
 */
export class FPSCounter {
  private frames: number[] = [];
  private lastTime: number = performance.now();
  private rafId: number | null = null;

  start() {
    const measure = () => {
      const now = performance.now();
      const delta = now - this.lastTime;
      this.lastTime = now;
      
      this.frames.push(1000 / delta);
      if (this.frames.length > 60) {
        this.frames.shift();
      }
      
      this.rafId = requestAnimationFrame(measure);
    };
    
    this.rafId = requestAnimationFrame(measure);
  }

  stop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  getFPS() {
    if (this.frames.length === 0) return 0;
    const sum = this.frames.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.frames.length);
  }

  getMinFPS() {
    return this.frames.length > 0 ? Math.round(Math.min(...this.frames)) : 0;
  }

  getMaxFPS() {
    return this.frames.length > 0 ? Math.round(Math.max(...this.frames)) : 0;
  }
}

/**
 * Bundle size analyzer
 */
export function logBundleSize() {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const scripts = resources.filter(r => r.initiatorType === 'script');
    
    const totalSize = scripts.reduce((sum, script) => {
      return sum + (script.transferSize || 0);
    }, 0);
    
    console.log('[Performance] Bundle Analysis:');
    console.log(`Total Scripts: ${scripts.length}`);
    console.log(`Total Size: ${(totalSize / 1024).toFixed(2)} KB`);
    
    scripts
      .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
      .slice(0, 10)
      .forEach(script => {
        console.log(`  ${script.name}: ${((script.transferSize || 0) / 1024).toFixed(2)} KB`);
      });
  }
}

/**
 * React DevTools profiler helper
 */
export function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  _startTime: number,
  _commitTime: number
) {
  if (actualDuration > 16) {
    console.warn(
      `[Profiler] ${id} (${phase}): ${actualDuration.toFixed(2)}ms (baseline: ${baseDuration.toFixed(2)}ms)`
    );
  }
}

/**
 * Lazy load images with intersection observer
 */
export function lazyLoadImage(img: HTMLImageElement, src: string) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = src;
          observer.unobserve(img);
        }
      });
    });
    
    observer.observe(img);
    return () => observer.disconnect();
  } else {
    // Fallback for browsers without IntersectionObserver
    img.src = src;
    return () => {};
  }
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string) {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Optimize images for display
 */
export function getOptimizedImageUrl(url: string, _width: number, _quality: number = 80): string {
  // This would integrate with an image optimization service
  // For now, just return the original URL
  return url;
}

/**
 * Request idle callback wrapper with fallback
 */
export function requestIdleCallback(callback: () => void, options?: { timeout?: number }): number {
  if ('requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback, options);
  } else {
    // Fallback to setTimeout
    return (window as any).setTimeout(callback, 1);
  }
}

/**
 * Cancel idle callback wrapper
 */
export function cancelIdleCallback(id: number) {
  if ('cancelIdleCallback' in window) {
    (window as any).cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}
