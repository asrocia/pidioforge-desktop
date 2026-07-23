import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueuePanel } from './QueuePanel';
import type { PidioConfig } from '../../types/app.types';

const BASE_CONFIG = {
  input: {
    title: 'Render Test',
    visual: 'C:/visual.mp4',
    audio: 'C:/audio.mp3',
    output: 'C:/output',
  },
  lyrics: { file: 'C:/lyrics.srt' },
} as unknown as PidioConfig;

describe('QueuePanel UI', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('confirm', () => true);
    // Default mock for all API calls (queue polling etc)
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ jobs: [], logs: [], queue: { concurrency: 2 } }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders core queue sections', () => {
    render(<QueuePanel config={BASE_CONFIG} />);

    expect(screen.getByText('Tambah Job Manual')).toBeInTheDocument();
    expect(screen.getByText('Tambah Batch Cepat')).toBeInTheDocument();
  });

  it('submits a new job via Tambah Job Render button', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: '2',
        title: 'Render Test',
        status: 'standby',
        jobs: [],
        logs: [],
        queue: { concurrency: 2 },
      }),
    });

    render(<QueuePanel config={BASE_CONFIG} />);

    fireEvent.click(screen.getByText('Tambah Job Render'));

    await waitFor(() => {
      expect(screen.getByText(/Job dibuat/)).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/jobs'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"title":"Render Test"'),
      }),
    );
  });

  it('validates render configuration via Cek Sebelum Render', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/render/validate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ok: true,
            estimate: { durationPerJob: 15, estimatedSizeMB: 120, resolution: '1080p' },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ jobs: [], logs: [], queue: { concurrency: 2 } }),
      });
    });

    render(<QueuePanel config={BASE_CONFIG} />);

    fireEvent.click(screen.getByText('Cek Sebelum Render'));

    await waitFor(() => {
      expect(screen.getByText(/Estimasi 15s \/ 120 MB/)).toBeInTheDocument();
    });
  });

  it('shows job count after queue refresh', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/api/jobs')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            jobs: [{ id: '1', title: 'Job Alpha', status: 'standby', input: { visual: 'v.mp4', audio: 'a.mp3' } }],
            logs: [],
          }),
        });
      }
      if (url.includes('/api/queue/summary')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ total: 1, counts: { standby: 1 }, queue: { concurrency: 2 } }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    render(<QueuePanel config={BASE_CONFIG} />);

    // Verify stat row updates with job count
    await waitFor(() => {
      expect(screen.getByText('Total Job')).toBeInTheDocument();
    });
  });
});
