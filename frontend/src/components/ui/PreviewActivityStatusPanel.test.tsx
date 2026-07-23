import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PreviewActivityStatusPanel } from './PreviewActivityStatusPanel';
import type { Job, PidioConfig } from '../../types/app.types';

// RealTimePreview pulls in lucide-react icons that don't play well with this
// test's module graph; mock it so we can verify prop wiring (onError) without
// needing the full icon-heavy render.
vi.mock('./RealTimePreview', () => ({
  RealTimePreview: ({ onError }: { onError: (error: string) => void }) => (
    <button data-testid="realtime-mock" onClick={() => onError('boom')}>
      RealTimePreview mock
    </button>
  ),
}));

const baseProps = {
  panelView: 'preview' as const,
  activityView: 'queue' as const,
  setActivityView: vi.fn(),
  activityLines: ['Log line 1', 'Log line 2'],
  clearLogs: vi.fn(),
  quality: 'draft',
  safePreset: 'youtube',
  previewData: null,
  startAt: 0,
  duration: 4,
  config: {} as PidioConfig,
  snapshotUrl: '',
  currentJob: null,
  nextJob: null,
  recentJob: null,
  totalProgress: 0,
  renderStateLabel: 'Belum ada job',
  visibleJobs: [] as Job[],
  totalJobCount: 0,
  startQueue: vi.fn(),
  startNext: vi.fn(),
  start: vi.fn(),
  cancel: vi.fn(),
  reset: vi.fn(),
  revealOutput: vi.fn(),
  cleanUiText: (v: string) => v,
  message: '',
  onRealtimeError: vi.fn(),
};

describe('PreviewActivityStatusPanel', () => {
  describe('panelView = preview', () => {
    it('renders activity heading and log content', () => {
      render(<PreviewActivityStatusPanel {...baseProps} panelView="preview" />);
      expect(screen.getByText('Aktivitas')).toBeInTheDocument();
      expect(screen.getByText(/Log line 1[\s\S]*Log line 2/)).toBeInTheDocument();
    });

    it('renders Log and Pratinjau buttons', () => {
      render(<PreviewActivityStatusPanel {...baseProps} panelView="preview" />);
      expect(screen.getByText('Log')).toBeInTheDocument();
      expect(screen.getByText('Pratinjau')).toBeInTheDocument();
    });

    it('calls clearLogs when Bersihkan clicked', () => {
      const clearLogs = vi.fn();
      render(<PreviewActivityStatusPanel {...baseProps} panelView="preview" clearLogs={clearLogs} />);
      fireEvent.click(screen.getByText('Bersihkan'));
      expect(clearLogs).toHaveBeenCalledTimes(1);
    });
  });

  describe('panelView = activity', () => {
    it('renders Riwayat terbaru label', () => {
      render(<PreviewActivityStatusPanel {...baseProps} panelView="activity" />);
      expect(screen.getByText('Riwayat terbaru')).toBeInTheDocument();
    });
  });

  describe('panelView = status', () => {
    const jobs: Job[] = [
      { id: 'j1', title: 'Render 1', status: 'rendering', progress: 45 },
      { id: 'j2', title: 'Render 2', status: 'standby', progress: 0 },
    ];

    it('renders Status Render heading', () => {
      render(
        <PreviewActivityStatusPanel
          {...baseProps}
          panelView="status"
          visibleJobs={jobs}
          renderStateLabel="Rendering"
        />,
      );
      expect(screen.getByText('Status Render')).toBeInTheDocument();
    });

    it('renders job titles', () => {
      render(<PreviewActivityStatusPanel {...baseProps} panelView="status" visibleJobs={jobs} />);
      expect(screen.getByText('Render 1')).toBeInTheDocument();
      expect(screen.getByText('Render 2')).toBeInTheDocument();
    });

    it('renders Mulai Antrian button', () => {
      render(
        <PreviewActivityStatusPanel {...baseProps} panelView="status" visibleJobs={jobs} totalJobCount={jobs.length} />,
      );
      expect(screen.getByText('Mulai Antrian')).toBeInTheDocument();
    });

    it('calls startQueue when Mulai Antrian clicked', () => {
      const startQueue = vi.fn();
      render(
        <PreviewActivityStatusPanel
          {...baseProps}
          panelView="status"
          visibleJobs={jobs}
          totalJobCount={jobs.length}
          startQueue={startQueue}
        />,
      );
      fireEvent.click(screen.getByText('Mulai Antrian'));
      expect(startQueue).toHaveBeenCalledTimes(1);
    });
  });

  it('renders Salin action in preview mode', () => {
    render(<PreviewActivityStatusPanel {...baseProps} panelView="preview" />);
    expect(screen.getByText('Salin')).toBeInTheDocument();
  });

  it('renders Salin action in activity mode', () => {
    render(<PreviewActivityStatusPanel {...baseProps} panelView="activity" />);
    expect(screen.getByText('Salin')).toBeInTheDocument();
  });

  describe('realtime panel', () => {
    it('renders realtime view without crashing', () => {
      render(<PreviewActivityStatusPanel {...baseProps} panelView="realtime" />);
      expect(screen.getByTestId('realtime-mock')).toBeInTheDocument();
    });

    it('propagates realtime errors via onRealtimeError', () => {
      const onRealtimeError = vi.fn();
      render(<PreviewActivityStatusPanel {...baseProps} panelView="realtime" onRealtimeError={onRealtimeError} />);
      fireEvent.click(screen.getByTestId('realtime-mock'));
      expect(onRealtimeError).toHaveBeenCalledWith('boom');
    });
  });

  describe('message display', () => {
    it('renders message when provided', () => {
      render(<PreviewActivityStatusPanel {...baseProps} message="Preview siap" />);
      expect(screen.getByText('Preview siap')).toBeInTheDocument();
    });

    it('does not render message when empty', () => {
      render(<PreviewActivityStatusPanel {...baseProps} message="" />);
      expect(screen.queryByText('Preview siap')).not.toBeInTheDocument();
    });
  });

  describe('snapshot', () => {
    it('renders snapshot frame when snapshotUrl provided', () => {
      render(<PreviewActivityStatusPanel {...baseProps} snapshotUrl="http://test/snap.png" />);
      expect(screen.getByText('Snapshot frame')).toBeInTheDocument();
      expect(screen.getByAltText('Snapshot')).toBeInTheDocument();
    });

    it('does not render snapshot when snapshotUrl empty', () => {
      render(<PreviewActivityStatusPanel {...baseProps} snapshotUrl="" />);
      expect(screen.queryByText('Snapshot frame')).not.toBeInTheDocument();
    });
  });
});
