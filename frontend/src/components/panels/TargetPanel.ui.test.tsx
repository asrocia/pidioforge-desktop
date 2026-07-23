import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TargetPanel } from './TargetPanel';
import type { PidioConfig } from '../../types/app.types';

const BASE_CONFIG = {
  input: {
    visual: 'C:/visuals/demo.mp4',
    audio: 'C:/audio/demo.mp3',
    title: 'Demo Title',
    output: 'C:/output',
  },
  target: {
    resolution: '1280x720',
    fps: 30,
    bitrate: '5M',
    quality: 'balanced',
  },
} as unknown as PidioConfig;

describe('TargetPanel UI', () => {
  const updateConfig = vi.fn();
  const fetchMock = vi.fn();
  const toastMock = vi.fn();

  beforeEach(() => {
    updateConfig.mockReset();
    fetchMock.mockReset();
    toastMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders core target sections', () => {
    render(<TargetPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    expect(screen.getByText('Input Utama')).toBeInTheDocument();
    expect(screen.getByText('Platform Presets')).toBeInTheDocument();
    expect(screen.getByText('Pengaturan Render')).toBeInTheDocument();
  });

  it('toggles advanced settings visibility', () => {
    render(<TargetPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    expect(screen.queryByText('Smart Optimization')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Advanced Settings/i }));
    expect(screen.getByText('Smart Optimization')).toBeInTheDocument();
  });

  it('scan button inspects target and shows ready message', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        files: [],
        pairs: [],
        summary: { ready: true, counts: { total: 0 } },
        diagnostics: { ffmpeg: true, recommended: 'libx264' },
      }),
    });

    render(<TargetPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.click(screen.getByRole('button', { name: /Scan & Cek/i }));

    await waitFor(() => {
      expect(screen.getByText('Target siap render.')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/target/inspect'), expect.any(Object));
  });

  it('platform preset updates target config', () => {
    render(<TargetPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.change(screen.getByDisplayValue('Custom'), { target: { value: 'youtube' } });

    expect(updateConfig).toHaveBeenCalledWith('target.platform', 'youtube');
    expect(updateConfig).toHaveBeenCalledWith('target.resolution', '1920x1080');
    expect(updateConfig).toHaveBeenCalledWith('target.faststart', true);
  });
});
