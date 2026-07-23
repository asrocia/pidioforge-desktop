import { describe, it, expect } from 'vitest';
import { setDeep, getDeep } from '../../lib/config-path';

describe('LayerOrder config integration', () => {
  const baseConfig = {
    branding: {
      layerOrder: 'bumper,particle,logo,cta,spectrum,lyrics,watermark,nowPlaying,timestamp,lowerThird',
    },
  };

  it('reads default layer order from config', () => {
    expect(getDeep(baseConfig, 'branding.layerOrder', '')).toBe(
      'bumper,particle,logo,cta,spectrum,lyrics,watermark,nowPlaying,timestamp,lowerThird',
    );
  });

  it('updates layer order immutably', () => {
    const reordered = 'logo,bumper,particle,cta,spectrum,lyrics,watermark,nowPlaying,timestamp,lowerThird';
    const result = setDeep(baseConfig, 'branding.layerOrder', reordered);
    expect(result.branding.layerOrder).toBe(reordered);
    // Original unchanged
    expect(baseConfig.branding.layerOrder).toBe(
      'bumper,particle,logo,cta,spectrum,lyrics,watermark,nowPlaying,timestamp,lowerThird',
    );
  });

  it('handles removing a layer from order', () => {
    const withoutParticle = 'bumper,logo,cta,spectrum,lyrics,watermark,nowPlaying,timestamp,lowerThird';
    const result = setDeep(baseConfig, 'branding.layerOrder', withoutParticle);
    const layers = result.branding.layerOrder.split(',');
    expect(layers).not.toContain('particle');
    expect(layers).toHaveLength(9);
  });

  it('handles adding a layer back', () => {
    const withExtra = 'bumper,particle,logo,cta,spectrum,lyrics,watermark,overlay';
    const result = setDeep(baseConfig, 'branding.layerOrder', withExtra);
    const layers = result.branding.layerOrder.split(',');
    expect(layers).toContain('overlay');
    expect(layers).toHaveLength(8);
  });

  it('returns fallback when branding.layerOrder is missing', () => {
    const empty = {};
    const fallback = 'bumper,particle,logo,cta,spectrum,lyrics,watermark,nowPlaying,timestamp,lowerThird';
    expect(getDeep(empty, 'branding.layerOrder', fallback)).toBe(fallback);
  });
});
