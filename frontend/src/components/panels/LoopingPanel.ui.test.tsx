import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoopingPanel } from './LoopingPanel';
import type { PidioConfig } from '../../types/app.types';

const BASE_CONFIG = {
  input: { visual: 'C:/clips/demo.mp4', audio: 'C:/audio/demo.mp3' },
  target: { duration: 60 },
  lyrics: { file: 'C:/lyrics/demo.srt' },
} as unknown as PidioConfig;

describe('LoopingPanel UI', () => {
  const updateConfig = vi.fn();
  const fetchMock = vi.fn();
  const revealPath = vi.fn();

  beforeEach(() => {
    updateConfig.mockReset();
    fetchMock.mockReset();
    revealPath.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(window, 'pidioforge', {
      writable: true,
      value: { revealPath },
    });
  });

  it('renders core looping sections', () => {
    render(<LoopingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    expect(screen.getByText('Video Loop')).toBeInTheDocument();
    expect(screen.getByText('Speed Control & Time Remapping')).toBeInTheDocument();
    expect(screen.getByText('Visual Timeline Editor')).toBeInTheDocument();
    expect(screen.getByText('Audio Sync & Beat Matching')).toBeInTheDocument();
    expect(screen.getByText('Batch Looping')).toBeInTheDocument();
  });

  it('preset chips update duration', () => {
    render(<LoopingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.click(screen.getByText('10 menit'));

    expect(screen.getByDisplayValue('600')).toBeInTheDocument();
  });

  it('validate action posts payload and shows validation message', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, loopsNeeded: 6, inputDuration: 10, warnings: [] }),
    });

    render(<LoopingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    fireEvent.click(screen.getByRole('button', { name: /Validasi Output/i }));

    await waitFor(() => {
      expect(screen.getByText('Validasi siap. Perlu 6 loop.')).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/api/loop/validate'), expect.any(Object));
  });

  it('batch button stays disabled when input list empty', () => {
    render(<LoopingPanel config={BASE_CONFIG} updateConfig={updateConfig} />);

    expect(screen.getByRole('button', { name: 'Proses Batch Looping' })).toBeDisabled();
  });
});
