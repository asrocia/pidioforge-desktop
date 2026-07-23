import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LyricsPanel } from './LyricsPanel';
import type { PidioConfig } from '../../types/app.types';

const BASE_CONFIG = {
  input: { audio: 'C:/music/Artist-My Song.mp3' },
  lyrics: {
    exportFormat: 'srt',
    preview: {
      enabled: false,
      mode: 'audio-sync',
      speed: '1.0',
      loop: 'none',
      showMarkers: true,
      highlightCurrent: true,
      fontSize: 16,
      linesToShow: 5,
    },
  },
} as unknown as PidioConfig;

describe('LyricsPanel UI', () => {
  const updateConfig = vi.fn();
  const fetchMock = vi.fn();

  beforeEach(() => {
    updateConfig.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('renders core lyrics sections', () => {
    render(<LyricsPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    expect(screen.getByText('Auto-Fetch Lyrics')).toBeInTheDocument();
    expect(screen.getByText('AI Transcription')).toBeInTheDocument();
    expect(screen.getByText('Mesin Lirik')).toBeInTheDocument();
    expect(screen.getByText('Style Lirik')).toBeInTheDocument();
    expect(screen.getByText('Real-Time Preview')).toBeInTheDocument();
  });

  it('auto-detect fills artist and song title from filename', () => {
    render(<LyricsPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.click(screen.getByRole('button', { name: '🎵 Auto-Detect' }));

    expect(updateConfig).toHaveBeenCalledWith('lyrics.autoFetch.artist', 'Artist');
    expect(updateConfig).toHaveBeenCalledWith('lyrics.autoFetch.songTitle', 'My Song');
  });

  it('parse button posts lyrics text and shows parse result message', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        lines: [
          { time: 0, text: 'hello' },
          { time: 1, text: 'world' },
        ],
        srt: '1',
        lrc: '[00:00.00] hello',
        vtt: 'WEBVTT',
      }),
    });

    render(<LyricsPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.change(
      screen.getByPlaceholderText(
        'Tempel lirik polos atau LRC di sini. Auto align akan membagi timing mengikuti durasi audio.',
      ),
      {
        target: { value: 'hello\nworld' },
      },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Parse' }));

    await waitFor(() => {
      expect(screen.getByText('2 baris lirik diparse.')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('disables smart sync when parsed lines are empty', () => {
    render(<LyricsPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    expect(screen.getByRole('button', { name: '🎯 Smart Sync' })).toBeDisabled();
  });
});
