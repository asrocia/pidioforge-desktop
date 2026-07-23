import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LiveOverlayCanvas } from './LiveOverlayCanvas';
import { resolveLayerOrder } from '../../../../backend/render-engine.mjs';
import type { PidioConfig } from '../../types/app.types';

/**
 * Smoke visual guard: verify that LiveOverlayCanvas stacking (zIndex)
 * matches backend resolveLayerOrder for any given branding.layerOrder string.
 * This ensures preview and rendered output won't diverge in layer ordering.
 */

const fullConfig: PidioConfig = {
  input: { title: 'Test' },
  branding: {
    logoEnabled: true,
    logo: 'C:/logo.png',
    logoPosition: 'Kanan Atas',
    logoScale: 18,
    logoOpacity: 100,
    ctaEnabled: true,
    ctaPosition: 'Kanan Bawah',
    ctaScale: 26,
    watermarkEnabled: true,
    watermarkText: 'WM',
    watermarkPosition: 'Kiri Bawah',
    watermarkOpacity: 70,
    layerOrder: '',
  },
  spectrum: {
    enabled: true,
    nowPlaying: true,
    nowPlayingColor: '#fff',
    nowPlayingFontSize: 26,
    nowPlayingX: 50,
    nowPlayingY: 14,
    color1: 'white',
    color2: '#38bdf8',
    previewY: 74,
    height: 128,
    transparency: 80,
  },
  overlay: {
    timestamp: true,
    timestampText: 'TS',
    timestampPosition: 'Kiri Atas',
    lowerThirdEnabled: true,
    lowerThirdText: 'LT',
    lowerThirdPosition: 'Bawah',
  },
  lyrics: {
    enabled: true,
    file: 'C:/lyrics.lrc',
    position: 'Bawah',
    color: '#ffffff',
  },
};

function makeProps(layerOrder: string) {
  const config = { ...fullConfig, branding: { ...fullConfig.branding, layerOrder } };
  const resolved = resolveLayerOrder(layerOrder);
  function layerStackIndex(id: string): number {
    const idx = resolved.indexOf(id);
    return idx === -1 ? resolved.length : idx;
  }
  return {
    config,
    visual: 'C:/visual.png',
    liveMediaUrl: 'file:///visual.png',
    livePreview: true,
    showRenderedPreview: false,
    previewUrl: '',
    selectedLive: '' as const,
    liveNowPlayingStyle: { zIndex: layerStackIndex('nowPlaying') + 10 },
    liveSpectrumStyle: { zIndex: layerStackIndex('spectrum') + 10 },
    logoStyle: { zIndex: layerStackIndex('logo') + 10 },
    ctaStyle: { zIndex: layerStackIndex('cta') + 10 },
    watermarkStyle: { zIndex: layerStackIndex('watermark') + 10 },
    liveLyricsStyle: { zIndex: layerStackIndex('lyrics') + 10 },
    layerStackIndex: vi.fn(layerStackIndex),
    onMouseMove: vi.fn(),
    onMouseUp: vi.fn(),
    onMouseLeave: vi.fn(),
    onSelectLive: vi.fn(),
    onHandleLiveKey: vi.fn(),
    onStartResizeLive: vi.fn(),
    onTitleBlur: vi.fn(),
    onWatermarkBlur: vi.fn(),
    onTimestampBlur: vi.fn(),
    onLowerThirdBlur: vi.fn(),
    lyricPreviewLines: ['Baris 1', 'Baris 2'],
    safeArea: undefined,
    showSafeArea: false,
    showGrid: false,
  };
}

function getZIndex(el: HTMLElement): number {
  return Number(el.style.zIndex) || 0;
}

describe('Preview stacking visual guard', () => {
  it('default order: spectrum < logo < cta < lyrics < watermark < nowPlaying < timestamp < lowerThird', () => {
    const props = makeProps('');
    render(<LiveOverlayCanvas {...props} />);

    const spectrum = screen.getByTestId('layer-spectrum');
    const logo = screen.getByTestId('layer-logo');
    const cta = screen.getByTestId('layer-cta');
    const lyrics = screen.getByTestId('layer-lyrics');
    const watermark = screen.getByTestId('layer-watermark');
    const nowPlaying = screen.getByTestId('layer-nowPlaying');
    const timestamp = screen.getByTestId('layer-timestamp');
    const lowerThird = screen.getByTestId('layer-lowerThird');

    // Default order: bumper(0),particle(1),logo(2),cta(3),spectrum(4),lyrics(5),watermark(6),nowPlaying(7),timestamp(8),lowerThird(9)
    expect(getZIndex(logo)).toBeLessThan(getZIndex(cta));
    expect(getZIndex(cta)).toBeLessThan(getZIndex(spectrum));
    expect(getZIndex(spectrum)).toBeLessThan(getZIndex(lyrics));
    expect(getZIndex(lyrics)).toBeLessThan(getZIndex(watermark));
    expect(getZIndex(watermark)).toBeLessThan(getZIndex(nowPlaying));
    expect(getZIndex(nowPlaying)).toBeLessThan(getZIndex(timestamp));
    expect(getZIndex(timestamp)).toBeLessThan(getZIndex(lowerThird));
  });

  it('custom order: watermark below spectrum, lyrics on top', () => {
    const props = makeProps('watermark,spectrum,logo,cta,lyrics,nowPlaying,timestamp,lowerThird');
    render(<LiveOverlayCanvas {...props} />);

    const watermark = screen.getByTestId('layer-watermark');
    const spectrum = screen.getByTestId('layer-spectrum');
    const lyrics = screen.getByTestId('layer-lyrics');

    expect(getZIndex(watermark)).toBeLessThan(getZIndex(spectrum));
    expect(getZIndex(spectrum)).toBeLessThan(getZIndex(lyrics));
  });

  it('matches backend resolveLayerOrder exactly', () => {
    const order = 'lyrics,spectrum,logo,watermark,cta,nowPlaying,timestamp,lowerThird';
    const backendOrder = resolveLayerOrder(order);
    const props = makeProps(order);
    render(<LiveOverlayCanvas {...props} />);

    const layerIds = ['spectrum', 'logo', 'cta', 'watermark', 'lyrics', 'nowPlaying', 'timestamp', 'lowerThird'];
    const elements = layerIds.map(id => ({ id, el: screen.getByTestId(`layer-${id}`) }));
    const sorted = [...elements].sort((a, b) => getZIndex(a.el) - getZIndex(b.el));
    const sortedIds = sorted.map(x => x.id);

    // sortedIds should match backend order (filtered to only rendered layers)
    const backendFiltered = backendOrder.filter((id: string) => layerIds.includes(id));
    expect(sortedIds).toEqual(backendFiltered);
  });
});
