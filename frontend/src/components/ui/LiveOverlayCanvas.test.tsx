import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LiveOverlayCanvas } from './LiveOverlayCanvas';
import type { PidioConfig } from '../../types/app.types';

const baseConfig: PidioConfig = {
  input: { title: 'Song Title' },
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
  },
  spectrum: {
    enabled: true,
    nowPlaying: true,
    nowPlayingColor: '#fff',
    nowPlayingFontSize: 26,
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

const commonProps = {
  visual: 'C:/visual.png',
  liveMediaUrl: 'file:///visual.png',
  livePreview: true,
  showRenderedPreview: false,
  previewUrl: '',
  selectedLive: '' as const,
  liveNowPlayingStyle: { zIndex: 18 },
  liveSpectrumStyle: { zIndex: 15 },
  logoStyle: { zIndex: 16 },
  ctaStyle: { zIndex: 17 },
  watermarkStyle: { zIndex: 19 },
  liveLyricsStyle: { zIndex: 20 },
  layerStackIndex: vi.fn(
    (id: string) =>
      ({ spectrum: 5, logo: 6, cta: 7, watermark: 8, lyrics: 9, nowPlaying: 10, timestamp: 11, lowerThird: 12 })[id] ??
      0,
  ),
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
  lyricPreviewLines: [],
  safeArea: undefined,
  showSafeArea: false,
  showGrid: false,
};

describe('LiveOverlayCanvas stacking', () => {
  it('renders lyric preview text when lines are provided', () => {
    render(<LiveOverlayCanvas config={baseConfig} {...commonProps} lyricPreviewLines={['Baris satu', 'Baris dua']} />);
    expect(screen.getByText('Baris satu / Baris dua')).toBeInTheDocument();
  });

  it('renders all configured reorderable layers', () => {
    render(<LiveOverlayCanvas config={baseConfig} {...commonProps} />);
    expect(screen.getByTestId('layer-spectrum')).toBeInTheDocument();
    expect(screen.getByTestId('layer-logo')).toBeInTheDocument();
    expect(screen.getByTestId('layer-cta')).toBeInTheDocument();
    expect(screen.getByTestId('layer-watermark')).toBeInTheDocument();
    expect(screen.getByTestId('layer-lyrics')).toBeInTheDocument();
    expect(screen.getByTestId('layer-nowPlaying')).toBeInTheDocument();
    expect(screen.getByTestId('layer-timestamp')).toBeInTheDocument();
    expect(screen.getByTestId('layer-lowerThird')).toBeInTheDocument();
  });

  it('applies zIndex styles from layer order helpers', () => {
    render(<LiveOverlayCanvas config={baseConfig} {...commonProps} />);
    expect(screen.getByTestId('layer-spectrum')).toHaveStyle({ zIndex: '15' });
    expect(screen.getByTestId('layer-logo')).toHaveStyle({ zIndex: '16' });
    expect(screen.getByTestId('layer-watermark')).toHaveStyle({ zIndex: '19' });
    expect(screen.getByTestId('layer-lyrics')).toHaveStyle({ zIndex: '20' });
  });
});
