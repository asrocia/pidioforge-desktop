import { render, fireEvent } from '@testing-library/react';
import { VirtualList, VirtualGrid, useVirtualScroll } from './VirtualList';
import { renderHook, act } from '@testing-library/react';

describe('VirtualList', () => {
  const mockItems = Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }));

  it('renders only visible items plus overscan', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={(item) => <div data-testid={`item-${item.id}`}>{item.name}</div>}
        overscan={3}
      />
    );

    // With 400px container and 50px items, should render ~8 visible + 6 overscan = ~14 items
    const renderedItems = container.querySelectorAll('[data-testid^="item-"]');
    expect(renderedItems.length).toBeLessThan(20);
    expect(renderedItems.length).toBeGreaterThan(10);
  });

  it('updates visible items on scroll', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={(item) => <div data-testid={`item-${item.id}`}>{item.name}</div>}
      />
    );

    const scrollContainer = container.firstChild as HTMLElement;
    
    // Scroll down
    act(() => {
      fireEvent.scroll(scrollContainer, { target: { scrollTop: 500 } });
    });

    // Should render different items after scroll
    const firstItem = container.querySelector('[data-testid^="item-"]');
    expect(firstItem?.textContent).not.toBe('Item 0');
  });

  it('handles empty items array', () => {
    const { container } = render(
      <VirtualList
        items={[]}
        itemHeight={50}
        containerHeight={400}
        renderItem={(item) => <div>{item.name}</div>}
      />
    );

    expect(container.querySelector('[data-testid^="item-"]')).toBeNull();
  });

  it('calculates correct total height', () => {
    const { container } = render(
      <VirtualList
        items={mockItems}
        itemHeight={50}
        containerHeight={400}
        renderItem={(item) => <div>{item.name}</div>}
      />
    );

    const innerContainer = container.querySelector('div > div') as HTMLElement;
    const expectedHeight = mockItems.length * 50;
    expect(innerContainer.style.height).toBe(`${expectedHeight}px`);
  });
});

describe('VirtualGrid', () => {
  const mockItems = Array.from({ length: 100 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }));

  it('renders items in grid layout', () => {
    const { container } = render(
      <VirtualGrid
        items={mockItems}
        itemWidth={100}
        itemHeight={100}
        containerWidth={400}
        containerHeight={400}
        renderItem={(item) => <div data-testid={`item-${item.id}`}>{item.name}</div>}
      />
    );

    const renderedItems = container.querySelectorAll('[data-testid^="item-"]');
    expect(renderedItems.length).toBeGreaterThan(0);
    expect(renderedItems.length).toBeLessThan(mockItems.length);
  });

  it('positions items correctly', () => {
    const { container } = render(
      <VirtualGrid
        items={mockItems}
        itemWidth={100}
        itemHeight={100}
        containerWidth={400}
        containerHeight={400}
        renderItem={(item) => <div data-testid={`item-${item.id}`}>{item.name}</div>}
        gap={10}
      />
    );

    const firstItem = container.querySelector('[data-testid="item-0"]')?.parentElement as HTMLElement;
    expect(firstItem.style.position).toBe('absolute');
    expect(firstItem.style.width).toBe('100px');
    expect(firstItem.style.height).toBe('100px');
  });
});

describe('useVirtualScroll', () => {
  it('calculates visible range correctly', () => {
    const { result } = renderHook(() =>
      useVirtualScroll({
        itemCount: 1000,
        estimatedItemHeight: 50,
        containerHeight: 400,
        overscan: 3
      })
    );

    expect(result.current.startIndex).toBe(0);
    expect(result.current.endIndex).toBeGreaterThan(0);
    expect(result.current.totalHeight).toBe(50000); // 1000 * 50
  });

  it('updates range on scroll', () => {
    const { result } = renderHook(() =>
      useVirtualScroll({
        itemCount: 1000,
        estimatedItemHeight: 50,
        containerHeight: 400,
        overscan: 3
      })
    );

    const initialStart = result.current.startIndex;

    // Simulate scroll
    act(() => {
      const mockEvent = {
        currentTarget: { scrollTop: 500 }
      } as React.UIEvent<HTMLDivElement>;
      result.current.handleScroll(mockEvent);
    });

    expect(result.current.startIndex).toBeGreaterThan(initialStart);
  });

  it('handles dynamic item heights', () => {
    const { result } = renderHook(() =>
      useVirtualScroll({
        itemCount: 100,
        estimatedItemHeight: 50,
        containerHeight: 400,
        overscan: 3
      })
    );

    // Set custom height for item
    act(() => {
      result.current.setItemHeight(0, 100);
    });

    // Total height should reflect custom height
    expect(result.current.totalHeight).toBeGreaterThan(5000);
  });
});

describe('VirtualList Performance', () => {
  it('handles large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`
    }));

    const startTime = performance.now();
    
    const { container } = render(
      <VirtualList
        items={largeDataset}
        itemHeight={50}
        containerHeight={400}
        renderItem={(item) => <div>{item.name}</div>}
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render in less than 50ms even with 10k items
    expect(renderTime).toBeLessThan(50);

    // Should only render visible items
    const renderedItems = container.querySelectorAll('div > div > div');
    expect(renderedItems.length).toBeLessThan(30);
  });

  it('maintains performance during rapid scrolling', () => {
    const { container } = render(
      <VirtualList
        items={Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }))}
        itemHeight={50}
        containerHeight={400}
        renderItem={(item) => <div>{item.name}</div>}
      />
    );

    const scrollContainer = container.firstChild as HTMLElement;
    const scrollTimes: number[] = [];

    // Simulate rapid scrolling
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      
      act(() => {
        fireEvent.scroll(scrollContainer, { target: { scrollTop: i * 100 } });
      });
      
      const end = performance.now();
      scrollTimes.push(end - start);
    }

    // Average scroll handling should be fast
    const avgTime = scrollTimes.reduce((a, b) => a + b, 0) / scrollTimes.length;
    expect(avgTime).toBeLessThan(10);
  });
});
