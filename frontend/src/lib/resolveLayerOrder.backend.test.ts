import { describe, expect, it } from 'vitest';
import { resolveLayerOrder } from '../../../backend/render-engine.mjs';

describe('resolveLayerOrder backend helper', () => {
  const FULL_DEFAULT = [
    'bumper',
    'particle',
    'logo',
    'cta',
    'spectrum',
    'lyrics',
    'watermark',
    'nowPlaying',
    'timestamp',
    'lowerThird',
  ];

  it('returns default order when input empty', () => {
    expect(resolveLayerOrder('')).toEqual(FULL_DEFAULT);
  });

  it('respects custom order and appends missing known layers', () => {
    expect(resolveLayerOrder('cta,logo')).toEqual([
      'cta',
      'logo',
      'bumper',
      'particle',
      'spectrum',
      'lyrics',
      'watermark',
      'nowPlaying',
      'timestamp',
      'lowerThird',
    ]);
  });

  it('ignores duplicates and unknown keys', () => {
    expect(resolveLayerOrder('logo,foo,logo,cta')).toEqual([
      'logo',
      'cta',
      'bumper',
      'particle',
      'spectrum',
      'lyrics',
      'watermark',
      'nowPlaying',
      'timestamp',
      'lowerThird',
    ]);
  });

  it('backward compat: old 5-layer config gets text layers appended', () => {
    expect(resolveLayerOrder('bumper,particle,logo,cta,spectrum')).toEqual(FULL_DEFAULT);
  });
});
