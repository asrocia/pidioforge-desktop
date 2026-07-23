import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OverlayPanel } from './OverlayPanel';
import type { PidioConfig } from '../../types/app.types';

const BASE_CONFIG = {
  target: { width: 1080, height: 1920 },
  overlay: {
    enabled: true,
    stylePreset: 'clean',
  },
} as unknown as PidioConfig;

describe('OverlayPanel UI', () => {
  const updateConfig = vi.fn();
  const fetchMock = vi.fn();

  beforeEach(() => {
    updateConfig.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders overlay sections', () => {
    render(<OverlayPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    expect(screen.getByText('Style Preset')).toBeInTheDocument();
    expect(screen.getByText('Particle & Asset')).toBeInTheDocument();
    expect(screen.getByText('Teks Overlay')).toBeInTheDocument();
    expect(screen.getByText('Efek Sinematik')).toBeInTheDocument();
    expect(screen.getByText('Advanced Color Grading')).toBeInTheDocument();
    expect(screen.getByText('Glitch & Distortion')).toBeInTheDocument();
  });

  it('applies cinematic preset', () => {
    render(<OverlayPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.change(screen.getByDisplayValue('Clean'), { target: { value: 'cinematic' } });

    expect(updateConfig).toHaveBeenCalledWith('overlay.stylePreset', 'cinematic');
    expect(updateConfig).toHaveBeenCalledWith('overlay.vignette', true);
    expect(updateConfig).toHaveBeenCalledWith('overlay.filmGrain', true);
    expect(updateConfig).toHaveBeenCalledWith('overlay.letterbox', true);
    expect(updateConfig).toHaveBeenCalledWith('overlay.darken', true);
  });

  it('applies retro preset', () => {
    render(<OverlayPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.change(screen.getByDisplayValue('Clean'), { target: { value: 'retro' } });

    expect(updateConfig).toHaveBeenCalledWith('overlay.stylePreset', 'retro');
    expect(updateConfig).toHaveBeenCalledWith('overlay.scanlines', true);
    expect(updateConfig).toHaveBeenCalledWith('overlay.filmGrain', true);
    expect(updateConfig).toHaveBeenCalledWith('overlay.vignette', true);
  });

  it('validates overlay via backend', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, warnings: [] }),
    });

    render(<OverlayPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.click(screen.getByText('Cek Overlay'));

    await waitFor(() => {
      expect(screen.getByText('Overlay siap digunakan.')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/overlay/validate'), expect.any(Object));
  });

  it('detects and applies format preset', () => {
    render(<OverlayPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.click(screen.getByText(/Format 9:16/));

    expect(updateConfig).toHaveBeenCalledWith('overlay.enabled', true);
    expect(updateConfig).toHaveBeenCalledWith('overlay.stylePreset', 'format-vertical');
  });
});
