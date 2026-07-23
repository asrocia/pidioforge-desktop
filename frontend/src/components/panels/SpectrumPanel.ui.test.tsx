import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SpectrumPanel } from './SpectrumPanel';
import type { PidioConfig } from '../../types/app.types';

const BASE_CONFIG = {
  input: { audio: 'C:/audio/song.mp3', visual: 'C:/images/bg.jpg', title: 'Demo Song' },
  target: { format: 'vertical', duration: 60 },
  spectrum: {
    enabled: true,
    nowPlaying: true,
    gallery: { enabled: false, images: [], activeIndex: 0 },
  },
} as unknown as PidioConfig;

describe('SpectrumPanel UI', () => {
  const updateConfig = vi.fn();
  const fetchMock = vi.fn();

  beforeEach(() => {
    updateConfig.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders core spectrum sections', () => {
    render(<SpectrumPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    expect(screen.getByText('Media Utama')).toBeInTheDocument();
    expect(screen.getByText('Visualizer')).toBeInTheDocument();
    expect(screen.getByText('Particle Effects')).toBeInTheDocument();
    expect(screen.getByText('Warna & Reaksi Beat')).toBeInTheDocument();
    expect(screen.getByText('Info Lagu')).toBeInTheDocument();
  });

  it('preset applies expected config updates', () => {
    render(<SpectrumPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.change(screen.getByDisplayValue('Gelombang Bersih'), { target: { value: 'neon-bars' } });

    expect(updateConfig).toHaveBeenCalledWith('spectrum.stylePreset', 'neon-bars');
    expect(updateConfig).toHaveBeenCalledWith('spectrum.model', 'Bar');
    expect(updateConfig).toHaveBeenCalledWith('spectrum.glow', true);
  });

  it('preview button loads spectrum preview', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, beats: [1, 2, 3], nowPlaying: { text: 'Demo Song' } }),
    });

    render(<SpectrumPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.click(screen.getByRole('button', { name: 'Pratinjau' }));

    await waitFor(() => {
      expect(screen.getByText('Preview siap / beat 3 / Demo Song')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/spectrum/preview'), expect.any(Object));
  });

  it('gallery toggle updates config', () => {
    render(<SpectrumPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.click(screen.getByLabelText('Gallery Mode (Multi-Gambar)'));

    expect(updateConfig).toHaveBeenCalledWith('spectrum.gallery.enabled', true);
  });
});
