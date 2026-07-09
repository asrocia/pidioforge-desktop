import { describe, it, expect } from 'vitest';

// Test undo/redo logic directly without React hooks
// This mirrors the internal logic of useUndoRedo

interface UndoRedoState<T> {
  history: T[];
  pointer: number;
}

const MAX_HISTORY = 50;

function createUndoRedo<T>(initial?: T) {
  const state: UndoRedoState<T> = {
    history: initial !== undefined ? [initial] : [],
    pointer: initial !== undefined ? 0 : -1,
  };

  return {
    push(value: T) {
      state.history = state.history.slice(0, state.pointer + 1);
      state.history.push(value);
      if (state.history.length > MAX_HISTORY) {
        state.history = state.history.slice(state.history.length - MAX_HISTORY);
      }
      state.pointer = state.history.length - 1;
    },
    undo(): T | undefined {
      if (state.pointer <= 0) return undefined;
      state.pointer -= 1;
      return state.history[state.pointer];
    },
    redo(): T | undefined {
      if (state.pointer >= state.history.length - 1) return undefined;
      state.pointer += 1;
      return state.history[state.pointer];
    },
    get pointer() { return state.pointer; },
    get length() { return state.history.length; },
  };
}

describe('useUndoRedo (logic)', () => {
  it('initializes with no history', () => {
    const ur = createUndoRedo<string>();
    expect(ur.undo()).toBeUndefined();
    expect(ur.redo()).toBeUndefined();
  });

  it('initializes with initial value', () => {
    const ur = createUndoRedo<string>('hello');
    expect(ur.undo()).toBeUndefined();
    expect(ur.length).toBe(1);
  });

  it('push and undo returns previous state', () => {
    const ur = createUndoRedo<string>('a');
    ur.push('b');
    ur.push('c');
    expect(ur.undo()).toBe('b');
    expect(ur.undo()).toBe('a');
    expect(ur.undo()).toBeUndefined();
  });

  it('redo returns next state after undo', () => {
    const ur = createUndoRedo<string>('a');
    ur.push('b');
    ur.push('c');
    ur.undo(); // -> b
    expect(ur.redo()).toBe('c');
    expect(ur.redo()).toBeUndefined();
  });

  it('push after undo discards redo history', () => {
    const ur = createUndoRedo<string>('a');
    ur.push('b');
    ur.push('c');
    ur.undo(); // -> b
    ur.push('d'); // overwrites c
    expect(ur.redo()).toBeUndefined();
    expect(ur.undo()).toBe('b');
  });

  it('respects max history limit (50)', () => {
    const ur = createUndoRedo<number>(0);
    for (let i = 1; i <= 60; i++) {
      ur.push(i);
    }
    expect(ur.length).toBeLessThanOrEqual(50);
    let count = 0;
    while (ur.undo() !== undefined) {
      count++;
    }
    expect(count).toBeLessThanOrEqual(49);
  });

  it('works with object state', () => {
    const ur = createUndoRedo<{ name: string }>({ name: 'first' });
    ur.push({ name: 'second' });
    ur.push({ name: 'third' });
    expect(ur.undo()).toEqual({ name: 'second' });
  });

  it('multiple undo then redo traverses correctly', () => {
    const ur = createUndoRedo<number>(1);
    ur.push(2);
    ur.push(3);
    ur.push(4);
    expect(ur.undo()).toBe(3);
    expect(ur.undo()).toBe(2);
    expect(ur.redo()).toBe(3);
    expect(ur.redo()).toBe(4);
    expect(ur.redo()).toBeUndefined();
  });

  it('push resets redo from middle of history', () => {
    const ur = createUndoRedo<string>('a');
    ur.push('b');
    ur.push('c');
    ur.push('d');
    ur.undo(); // -> c
    ur.undo(); // -> b
    ur.push('e'); // history: [a, b, e]
    expect(ur.redo()).toBeUndefined();
    expect(ur.undo()).toBe('b');
    expect(ur.undo()).toBe('a');
  });
});
