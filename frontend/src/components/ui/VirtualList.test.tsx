import { describe, expect, it } from 'vitest';
import { DynamicVirtualList, VirtualGrid, VirtualList, useVirtualScroll } from './VirtualList';

describe('VirtualList module exports', () => {
  it('exports VirtualList component', () => {
    expect(VirtualList).toBeTypeOf('function');
  });

  it('exports VirtualGrid component', () => {
    expect(VirtualGrid).toBeTypeOf('function');
  });

  it('exports DynamicVirtualList component', () => {
    expect(DynamicVirtualList).toBeTypeOf('function');
  });

  it('exports useVirtualScroll hook', () => {
    expect(useVirtualScroll).toBeTypeOf('function');
  });
});
