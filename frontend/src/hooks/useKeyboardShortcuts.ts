import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip if user is typing in an input field
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          break;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

// Global keyboard shortcuts helper
export const SHORTCUTS = {
  SAVE: { key: 's', ctrl: true, description: 'Save current configuration' },
  UNDO: { key: 'z', ctrl: true, description: 'Undo last change' },
  REDO: { key: 'y', ctrl: true, description: 'Redo last change' },
  PREVIEW: { key: 'p', ctrl: true, description: 'Generate preview' },
  RENDER: { key: 'r', ctrl: true, description: 'Start render' },
  TOGGLE_PANEL: { key: 'b', ctrl: true, description: 'Toggle settings panel' },
  HELP: { key: '?', shift: true, description: 'Show keyboard shortcuts' },
  ESCAPE: { key: 'Escape', description: 'Close dialogs/cancel' },
  NEXT_TAB: { key: 'Tab', ctrl: true, description: 'Next module' },
  PREV_TAB: { key: 'Tab', ctrl: true, shift: true, description: 'Previous module' },
};
