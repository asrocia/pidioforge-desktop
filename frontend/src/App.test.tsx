import { describe, expect, it } from 'vitest';
import { App, Meter } from './App';

describe('App module exports', () => {
  it('exports App component', () => {
    expect(App).toBeTypeOf('function');
  });

  it('exports Meter component', () => {
    expect(Meter).toBeTypeOf('function');
  });
});
