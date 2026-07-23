/* eslint-disable react-refresh/only-export-components */
import React, { useState, useRef, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

/**
 * Virtual scrolling list component for rendering large lists efficiently
 * Only renders visible items + overscan buffer
 */
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Calculate visible range
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length - 1, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => (
            <div key={startIndex + i} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Virtual grid component for rendering large grids efficiently
 */
interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  gap?: number;
  className?: string;
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem,
  gap = 0,
  className = '',
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Calculate grid dimensions
  const columns = Math.floor(containerWidth / (itemWidth + gap));
  const rows = Math.ceil(items.length / columns);
  const totalHeight = rows * (itemHeight + gap);

  // Calculate visible range
  const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - 1);
  const endRow = Math.min(rows - 1, Math.ceil((scrollTop + containerHeight) / (itemHeight + gap)) + 1);

  const visibleItems: Array<{ item: T; index: number; row: number; col: number }> = [];
  for (let row = startRow; row <= endRow; row++) {
    for (let col = 0; col < columns; col++) {
      const index = row * columns + col;
      if (index < items.length) {
        visibleItems.push({
          item: items[index],
          index,
          row,
          col,
        });
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, row, col }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: row * (itemHeight + gap),
              left: col * (itemWidth + gap),
              width: itemWidth,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Hook for virtual scrolling with dynamic item heights
 */
interface UseVirtualScrollOptions {
  itemCount: number;
  estimatedItemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll({
  itemCount,
  estimatedItemHeight,
  containerHeight,
  overscan = 3,
}: UseVirtualScrollOptions) {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<Map<number, number>>(new Map());
  const measurementCache = useRef<Map<number, number>>(new Map());

  const setItemHeight = useCallback((index: number, height: number) => {
    if (measurementCache.current.get(index) !== height) {
      measurementCache.current.set(index, height);
      setItemHeights(new Map(measurementCache.current));
    }
  }, []);

  const getItemHeight = useCallback(
    (index: number) => {
      return itemHeights.get(index) ?? estimatedItemHeight;
    },
    [itemHeights, estimatedItemHeight],
  );

  const getItemOffset = useCallback(
    (index: number) => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += getItemHeight(i);
      }
      return offset;
    },
    [getItemHeight],
  );

  const getTotalHeight = useCallback(() => {
    let height = 0;
    for (let i = 0; i < itemCount; i++) {
      height += getItemHeight(i);
    }
    return height;
  }, [itemCount, getItemHeight]);

  // Binary search to find start index
  const findStartIndex = useCallback(() => {
    let low = 0;
    let high = itemCount - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const offset = getItemOffset(mid);

      if (offset < scrollTop) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return Math.max(0, low - overscan);
  }, [scrollTop, itemCount, getItemOffset, overscan]);

  const startIndex = findStartIndex();
  let endIndex = startIndex;
  let currentOffset = getItemOffset(startIndex);

  while (currentOffset < scrollTop + containerHeight && endIndex < itemCount - 1) {
    endIndex++;
    currentOffset += getItemHeight(endIndex);
  }

  endIndex = Math.min(itemCount - 1, endIndex + overscan);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    startIndex,
    endIndex,
    totalHeight: getTotalHeight(),
    offsetY: getItemOffset(startIndex),
    setItemHeight,
    handleScroll,
  };
}

/**
 * Virtualized list with dynamic item heights
 */
interface DynamicVirtualListProps<T> {
  items: T[];
  estimatedItemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, measureRef: (el: HTMLElement | null) => void) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function DynamicVirtualList<T>({
  items,
  estimatedItemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
}: DynamicVirtualListProps<T>) {
  const { startIndex, endIndex, totalHeight, offsetY, setItemHeight, handleScroll } = useVirtualScroll({
    itemCount: items.length,
    estimatedItemHeight,
    containerHeight,
    overscan,
  });

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div className={`overflow-auto ${className}`} style={{ height: containerHeight }} onScroll={handleScroll}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => {
            const index = startIndex + i;
            const measureRef = (el: HTMLElement | null) => {
              if (el) {
                const height = el.getBoundingClientRect().height;
                setItemHeight(index, height);
              }
            };

            return <div key={index}>{renderItem(item, index, measureRef)}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
