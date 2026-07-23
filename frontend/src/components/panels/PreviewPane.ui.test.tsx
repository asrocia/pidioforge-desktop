import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PreviewPane } from './PreviewPane';
import type { PidioConfig } from '../../types/app.types';

const BASE_CONFIG = {
  input: {
    visual: 'C:/visuals/demo.mp4',
    audio: 'C:/audio/demo.mp3',
    title: 'Demo Title',
  },
  target: {
    width: 1280,
    height: 720,
  },
  preview: {
    quality: 'draft',
    startAt: 0,
    duration: 4,
    safeAreaPreset: 'youtube',
    showSafeArea: true,
    showGrid: false,
  },
  spectrum: { enabled: true, nowPlaying: true },
  branding: { logoEnabled: false, ctaEnabled: false, watermarkEnabled: false },
  overlay: { timestamp: false, lowerThirdEnabled: false },
  lyrics: { enabled: true, file: 'C:/lyrics.srt' },
} as unknown as PidioConfig;

describe('PreviewPane UI', () => {
  const updateConfig = vi.fn();
  const refresh = vi.fn();
  const fetchMock = vi.fn();

  beforeEach(() => {
    updateConfig.mockReset();
    refresh.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders preview core components', () => {
    render(
      <PreviewPane
        active="preview"
        jobs={[]}
        logs={[]}
        refresh={refresh}
        config={BASE_CONFIG}
        updateConfig={updateConfig}
      />,
    );

    expect(screen.getByText('Render Preview')).toBeInTheDocument();
    expect(screen.getByText('Ke Antrian')).toBeInTheDocument();
    expect(screen.getByText('Snapshot')).toBeInTheDocument();
  });

  it('render preview action triggers api and refresh', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, resolution: '1280x720', size: 102400, elapsedMs: 500, logs: [] }),
    });

    render(
      <PreviewPane
        active="preview"
        jobs={[]}
        logs={[]}
        refresh={refresh}
        config={BASE_CONFIG}
        updateConfig={updateConfig}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Render Preview/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/preview/render'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(refresh).toHaveBeenCalled();
    });
  });

  it('layer toggles update config', () => {
    render(
      <PreviewPane
        active="preview"
        jobs={[]}
        logs={[]}
        refresh={refresh}
        config={BASE_CONFIG}
        updateConfig={updateConfig}
      />,
    );

    // Toggle grid view (label is "Grid Mati" when grid is off)
    fireEvent.click(screen.getByText('Grid Mati'));
    expect(updateConfig).toHaveBeenCalledWith('preview.showGrid', true);
  });
});
