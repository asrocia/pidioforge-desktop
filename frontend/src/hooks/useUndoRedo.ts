import { useCallback, useRef } from 'react';

interface UndoRedoState<T> {
  history: T[];
  pointer: number;
}

interface UndoRedoReturn<T> {
  push: (state: T) => void;
  undo: () => T | undefined;
  redo: () => T | undefined;
}

const MAX_HISTORY = 50;

export function useUndoRedo<T>(_initial?: T): UndoRedoReturn<T> {
  const stateRef = useRef<UndoRedoState<T>>({
    history: _initial !== undefined ? [_initial] : [],
    pointer: _initial !== undefined ? 0 : -1,
  });

  const push = useCallback((state: T) => {
    const s = stateRef.current;
    s.history = s.history.slice(0, s.pointer + 1);
    s.history.push(state);
    if (s.history.length > MAX_HISTORY) {
      s.history = s.history.slice(s.history.length - MAX_HISTORY);
    }
    s.pointer = s.history.length - 1;
  }, []);

  const undo = useCallback((): T | undefined => {
    const s = stateRef.current;
    if (s.pointer <= 0) return undefined;
    s.pointer -= 1;
    return s.history[s.pointer];
  }, []);

  const redo = useCallback((): T | undefined => {
    const s = stateRef.current;
    if (s.pointer >= s.history.length - 1) return undefined;
    s.pointer += 1;
    return s.history[s.pointer];
  }, []);

  return { push, undo, redo };
}
