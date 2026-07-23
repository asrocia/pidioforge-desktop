import { describe, it, expect } from 'vitest';
import { getDeep, setDeep } from '../lib/config-path';

describe('getDeep', () => {
  const obj = {
    target: { width: 1280, height: 720 },
    input: { audio: 'test.mp3', visual: '' },
    nested: { a: { b: { c: 42 } } },
  };

  it('gets top-level nested value', () => {
    expect(getDeep(obj, 'target.width')).toBe(1280);
  });

  it('gets deeply nested value', () => {
    expect(getDeep(obj, 'nested.a.b.c')).toBe(42);
  });

  it('returns fallback for missing path', () => {
    expect(getDeep(obj, 'target.missing', 'default')).toBe('default');
  });

  it('returns fallback for null/undefined obj', () => {
    expect(getDeep(null, 'any.path', 'fb')).toBe('fb');
    expect(getDeep(undefined, 'x', 99)).toBe(99);
  });

  it('returns empty string as default fallback', () => {
    expect(getDeep(obj, 'missing.path')).toBe('');
  });

  it('returns falsy values without falling back', () => {
    expect(getDeep(obj, 'input.visual', 'fallback')).toBe('');
  });
});

describe('setDeep', () => {
  const obj = {
    target: { width: 1280, height: 720 },
    input: { audio: 'test.mp3' },
  };

  it('sets a nested value immutably', () => {
    const result = setDeep(obj, 'target.width', 1920);
    expect(result.target.width).toBe(1920);
    expect(obj.target.width).toBe(1280); // original unchanged
  });

  it('creates intermediate keys', () => {
    const result = setDeep(obj, 'new.deep.key', 'value');
    expect(result.new.deep.key).toBe('value');
  });

  it('handles empty object', () => {
    const result = setDeep({}, 'a.b', 123);
    expect(result.a.b).toBe(123);
  });

  it('handles null input', () => {
    const result = setDeep(null, 'x.y', 'z');
    expect(result.x.y).toBe('z');
  });

  it('stores gallery arrays and flags immutably', () => {
    const result = setDeep(obj, 'spectrum.gallery.images', ['a.jpg', 'b.mp4']);
    expect(result.spectrum.gallery.images).toEqual(['a.jpg', 'b.mp4']);
    expect(obj).not.toHaveProperty('spectrum');

    const next = setDeep(result, 'spectrum.gallery.kenBurns', true);
    expect(next.spectrum.gallery.images).toEqual(['a.jpg', 'b.mp4']);
    expect(next.spectrum.gallery.kenBurns).toBe(true);
  });
});

describe('gallery getDeep', () => {
  it('reads gallery arrays and defaults cleanly', () => {
    const obj = { spectrum: { gallery: { images: ['one.png'], enabled: true } } };
    expect(getDeep(obj, 'spectrum.gallery.images', [])).toEqual(['one.png']);
    expect(getDeep(obj, 'spectrum.gallery.enabled', false)).toBe(true);
    expect(getDeep(obj, 'spectrum.gallery.kenBurnsMode', 'random')).toBe('random');
  });
});
