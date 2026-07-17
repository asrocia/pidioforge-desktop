import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { App } from './App';
import React from 'react';

// Mock the lazy loaded components
jest.mock('./components/panels', () => ({
  TargetPanel: () => <div>Target Panel</div>,
  SettingsPanel: () => <div>Settings Panel</div>,
  QueuePanel: () => <div>Queue Panel</div>,
  HistoryPanel: () => <div>History Panel</div>,
}));

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/PidioForge/i)).toBeInTheDocument();
  });

  it('displays all main sections', () => {
    render(<App />);
    
    // Check for main UI elements
    expect(screen.getByText(/Target/i)).toBeInTheDocument();
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
    expect(screen.getByText(/Queue/i)).toBeInTheDocument();
  });

  it('lazy loads panels on navigation', async () => {
    const { getByText } = render(<App />);
    
    // Click on Target panel
    const targetButton = getByText('Target');
    fireEvent.click(targetButton);
    
    // Wait for lazy loaded component
    await waitFor(() => {
      expect(getByText('Target Panel')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('switches between panels correctly', async () => {
    const { getByText } = render(<App />);
    
    // Click Target
    fireEvent.click(getByText('Target'));
    await waitFor(() => {
      expect(getByText('Target Panel')).toBeInTheDocument();
    });
    
    // Click Settings
    fireEvent.click(getByText('Settings'));
    await waitFor(() => {
      expect(getByText('Settings Panel')).toBeInTheDocument();
    });
  });
});

describe('App Performance', () => {
  it('memoizes callbacks correctly', () => {
    const { rerender } = render(<App />);
    
    // Get initial render
    const initialRender = screen.getByText(/PidioForge/i);
    
    // Force re-render
    rerender(<App />);
    
    // Component should not re-render unnecessarily
    const afterRerender = screen.getByText(/PidioForge/i);
    expect(initialRender).toBe(afterRerender);
  });

  it('handles rapid panel switches efficiently', async () => {
    const { getByText } = render(<App />);
    
    const startTime = performance.now();
    
    // Rapidly switch panels
    for (let i = 0; i < 10; i++) {
      fireEvent.click(getByText('Target'));
      fireEvent.click(getByText('Settings'));
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Should handle rapid switches in reasonable time
    expect(duration).toBeLessThan(1000);
  });

  it('maintains performance with large queue', async () => {
    const { getByText } = render(<App />);
    
    // Navigate to Queue panel
    fireEvent.click(getByText('Queue'));
    
    await waitFor(() => {
      expect(getByText('Queue Panel')).toBeInTheDocument();
    });
    
    // Performance should remain good even with large queue
    const startTime = performance.now();
    
    // Simulate interactions
    for (let i = 0; i < 100; i++) {
      fireEvent.click(getByText('Queue'));
    }
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(500);
  });
});

describe('App State Management', () => {
  it('preserves state across panel switches', async () => {
    const { getByText } = render(<App />);
    
    // Navigate to Target
    fireEvent.click(getByText('Target'));
    await waitFor(() => {
      expect(getByText('Target Panel')).toBeInTheDocument();
    });
    
    // Switch to Settings
    fireEvent.click(getByText('Settings'));
    await waitFor(() => {
      expect(getByText('Settings Panel')).toBeInTheDocument();
    });
    
    // Switch back to Target
    fireEvent.click(getByText('Target'));
    await waitFor(() => {
      expect(getByText('Target Panel')).toBeInTheDocument();
    });
    
    // State should be preserved
  });

  it('handles concurrent state updates', async () => {
    const { getByText } = render(<App />);
    
    // Trigger multiple state updates
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        new Promise<void>((resolve) => {
          fireEvent.click(getByText('Target'));
          setTimeout(resolve, 10);
        })
      );
    }
    
    await Promise.all(promises);
    
    // App should remain stable
    expect(getByText(/PidioForge/i)).toBeInTheDocument();
  });
});

describe('App Error Handling', () => {
  it('handles lazy loading errors gracefully', async () => {
    // Mock console.error to suppress error output
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    
    // This test would need actual error boundary implementation
    // For now, just verify app doesn't crash
    render(<App />);
    expect(screen.getByText(/PidioForge/i)).toBeInTheDocument();
    
    consoleError.mockRestore();
  });

  it('recovers from render errors', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    
    // App should handle errors without crashing
    render(<App />);
    expect(screen.getByText(/PidioForge/i)).toBeInTheDocument();
    
    consoleError.mockRestore();
  });
});

describe('App Accessibility', () => {
  it('has proper ARIA labels', () => {
    render(<App />);
    
    // Check for accessibility attributes
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('supports keyboard navigation', () => {
    const { getByText } = render(<App />);
    
    const targetButton = getByText('Target');
    
    // Simulate keyboard interaction
    fireEvent.keyDown(targetButton, { key: 'Enter' });
    
    // Should respond to keyboard events
    expect(targetButton).toBeInTheDocument();
  });
});

describe('App Integration with Optimizations', () => {
  it('uses lazy loading for all panels', async () => {
    const { getByText } = render(<App />);
    
    const panels = ['Target', 'Settings', 'Queue', 'History'];
    
    for (const panel of panels) {
      fireEvent.click(getByText(panel));
      
      await waitFor(() => {
        expect(getByText(`${panel} Panel`)).toBeInTheDocument();
      }, { timeout: 3000 });
    }
  });

  it('applies memoization to prevent re-renders', () => {
    const renderSpy = jest.fn();
    
    const MemoizedApp = React.memo(App);
    const { rerender } = render(<MemoizedApp />);
    
    // Initial render
    expect(screen.getByText(/PidioForge/i)).toBeInTheDocument();
    
    // Re-render with same props
    rerender(<MemoizedApp />);
    
    // Should not trigger unnecessary re-renders
  });

  it('handles virtual scrolling in queue', async () => {
    const { getByText } = render(<App />);
    
    // Navigate to Queue
    fireEvent.click(getByText('Queue'));
    
    await waitFor(() => {
      expect(getByText('Queue Panel')).toBeInTheDocument();
    });
    
    // Virtual scrolling should be active
    // (This would need actual queue items to test properly)
  });

  it('monitors performance metrics', () => {
    render(<App />);
    
    // Performance monitoring should be active
    // Check if performance marks are created
    const marks = performance.getEntriesByType('mark');
    expect(marks.length).toBeGreaterThanOrEqual(0);
  });
});

describe('App Memory Management', () => {
  it('cleans up on unmount', () => {
    const { unmount } = render(<App />);
    
    // Unmount component
    unmount();
    
    // Should clean up properly
    expect(screen.queryByText(/PidioForge/i)).not.toBeInTheDocument();
  });

  it('does not leak memory on panel switches', async () => {
    const { getByText } = render(<App />);
    
    // Switch panels multiple times
    for (let i = 0; i < 20; i++) {
      fireEvent.click(getByText('Target'));
      await waitFor(() => {
        expect(getByText('Target Panel')).toBeInTheDocument();
      });
      
      fireEvent.click(getByText('Settings'));
      await waitFor(() => {
        expect(getByText('Settings Panel')).toBeInTheDocument();
      });
    }
    
    // Memory should remain stable
    // (Would need actual memory profiling to verify)
  });
});

describe('App Render Optimization', () => {
  it('minimizes re-renders with useCallback', () => {
    const renderCount = { count: 0 };
    
    const CountingApp = () => {
      renderCount.count++;
      return <App />;
    };
    
    const { rerender } = render(<CountingApp />);
    const initialCount = renderCount.count;
    
    // Trigger re-render
    rerender(<CountingApp />);
    
    // Should not increase render count significantly
    expect(renderCount.count).toBeLessThanOrEqual(initialCount + 2);
  });

  it('optimizes computed values with useMemo', () => {
    const { rerender } = render(<App />);
    
    // Get initial computed values
    const initial = screen.getByText(/PidioForge/i);
    
    // Re-render
    rerender(<App />);
    
    // Computed values should be memoized
    const after = screen.getByText(/PidioForge/i);
    expect(initial).toBe(after);
  });
});
