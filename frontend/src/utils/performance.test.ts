import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { debounce, throttle, rafThrottle, calculateVisibleRange, measureRenderTime, shallowEqual } from './performance';

describe('performance utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('debounce delays latest call only', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('a');
    debounced('b');
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
  });

  it('throttle runs immediately and queues latest trailing call', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled('a');
    throttled('b'); // queued
    throttled('c'); // overwrites queued
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');

    vi.advanceTimersByTime(100);
    // Trailing call fires with latest args
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith('c');

    // After trailing fires, new throttle period starts — wait for it
    vi.advanceTimersByTime(100);
    throttled('d');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(fn).toHaveBeenLastCalledWith('d');
  });

  it('rafThrottle collapses repeated calls into one animation frame', () => {
    const originalRaf = globalThis.requestAnimationFrame;
    const fn = vi.fn();
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      cb(16);
      return 1;
    }) as typeof requestAnimationFrame;

    const throttled = rafThrottle(fn);
    throttled('x');
    throttled('y');

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('x');

    globalThis.requestAnimationFrame = originalRaf;
  });

  it('calculateVisibleRange computes bounded range', () => {
    expect(calculateVisibleRange(0, 400, 50, 100, 3)).toEqual({ startIndex: 0, endIndex: 11 });
    expect(calculateVisibleRange(500, 400, 50, 100, 3)).toEqual({ startIndex: 7, endIndex: 21 });
  });

  it('measureRenderTime returns cleanup and warns on slow render', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const originalNow = performance.now;
    let tick = 0;
    performance.now = vi.fn(() => {
      tick += 20;
      return tick;
    }) as typeof performance.now;

    const finish = measureRenderTime('SlowComponent');
    finish();

    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
    performance.now = originalNow;
  });

  it('shallowEqual compares flat objects', () => {
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });
});
