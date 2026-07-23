import { cn } from '../../utils/cn';
import { copyText } from '../../utils/media';
import { ActionButtonGroup, LogPre, StatRow } from './design-system-components';
import { WarningList } from './design-system-components';
import { RealTimePreview } from './RealTimePreview';
import { MetaStrip } from './design-system-components';
import { formatBytes, formatDuration } from '../../lib/format';
import { queueStatusLabel } from '../../constants/modules';
import type { Job, PidioConfig } from '../../types/app.types';

type PreviewData = {
  resolution?: string;
  startAt?: number;
  duration?: number;
  warnings?: string[];
  diagnostics?: { warnings?: string[] };
  snapshot?: { output?: string };
};

interface PreviewActivityStatusPanelProps {
  panelView: 'preview' | 'activity' | 'status' | 'realtime';
  activityView: 'queue' | 'preview';
  setActivityView: (value: 'queue' | 'preview') => void;
  activityLines: string[];
  clearLogs: () => void;
  quality: string;
  safePreset: string;
  previewData: PreviewData | null;
  startAt: number;
  duration: number;
  config: PidioConfig;
  snapshotUrl: string;
  currentJob: Job | null;
  nextJob: Job | null;
  recentJob: Job | null;
  totalProgress: number;
  renderStateLabel: string;
  visibleJobs: Job[];
  totalJobCount: number;
  startQueue: () => void;
  startNext: () => void;
  start: (id: string) => void;
  cancel: (id: string) => void;
  reset: () => void;
  revealOutput: (target?: string) => void;
  cleanUiText: (value: string) => string;
  message: string;
  onRealtimeError: (error: string) => void;
}

export function PreviewActivityStatusPanel({
  panelView,
  activityView,
  setActivityView,
  activityLines,
  clearLogs,
  quality,
  safePreset,
  previewData,
  startAt,
  duration,
  config,
  snapshotUrl,
  currentJob,
  nextJob,
  recentJob,
  totalProgress,
  renderStateLabel,
  visibleJobs,
  totalJobCount,
  startQueue,
  startNext,
  start,
  cancel,
  reset,
  revealOutput,
  cleanUiText,
  message,
  onRealtimeError,
}: PreviewActivityStatusPanelProps) {
  const diagWarnings = previewData?.diagnostics?.warnings || [];
  const previewWarnings = previewData?.warnings || [];

  return (
    <>
      {message && (
        <div
          className={cn(
            'px-4 py-3 rounded-[var(--radius-lg)] border text-[13px]',
            cleanUiText(message).startsWith('Perlu perhatian') || cleanUiText(message).startsWith('Perhatian')
              ? 'bg-[var(--accent-warning)]/10 border-[var(--accent-warning)]/30 text-[var(--accent-warning)]'
              : 'bg-[var(--accent-success)]/10 border-[var(--accent-success)]/30 text-[var(--accent-success)]',
          )}
        >
          {cleanUiText(message)}
        </div>
      )}

      {(diagWarnings.length || previewWarnings.length) && (
        <WarningList
          tone="warning"
          title="Catatan preview"
          items={[...diagWarnings, ...previewWarnings].map((w: string) => cleanUiText(w))}
        />
      )}

      {snapshotUrl && (
        <div className="bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4">
          <h4 className="text-[13px] font-semibold text-[var(--text-primary)] mb-3">Snapshot frame</h4>
          <img
            src={snapshotUrl}
            className="w-full rounded-[var(--radius-sm)] border border-[var(--border-medium)] mb-2"
            alt="Snapshot"
          />
          <p className="text-[11px] text-[var(--text-muted)]">{previewData?.snapshot?.output || ''}</p>
        </div>
      )}

      <MetaStrip
        items={[
          {
            label: 'Preview',
            value: previewData?.resolution || `${config.preview?.width || 640}x${config.preview?.height || 360}`,
          },
          {
            value: `${previewData?.startAt ?? startAt}s–${(previewData?.startAt ?? startAt) + (previewData?.duration || duration)}s`,
          },
          { value: quality, muted: false },
          { value: `Safe area ${safePreset}` },
        ]}
      />

      {panelView === 'realtime' ? (
        <div className="space-y-4">
          <RealTimePreview config={config} onError={onRealtimeError} className="w-full" />
        </div>
      ) : panelView === 'preview' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Aktivitas</h3>
            <span className="text-[11px] text-[var(--text-muted)]">
              {activityView === 'preview' ? 'Pratinjau' : 'Log Sistem'}
            </span>
          </div>
          <ActionButtonGroup
            actions={[
              {
                id: 'activity-queue',
                label: 'Log',
                icon: 'LOG',
                variant: activityView === 'queue' ? 'primary' : 'secondary',
                onClick: () => setActivityView('queue'),
              },
              {
                id: 'activity-preview',
                label: 'Pratinjau',
                icon: 'PRE',
                variant: activityView === 'preview' ? 'primary' : 'secondary',
                onClick: () => setActivityView('preview'),
              },
              {
                id: 'activity-copy',
                label: 'Salin',
                icon: 'COPY',
                variant: 'secondary',
                onClick: () => copyText(activityLines.join('\n')),
              },
              { id: 'activity-clear', label: 'Bersihkan', icon: 'CLEAR', variant: 'secondary', onClick: clearLogs },
            ]}
          />
          <LogPre maxHeight={300}>
            {cleanUiText(
              activityLines.join('\n') || (activityView === 'preview' ? 'Belum ada log preview.' : 'Aplikasi siap.'),
            )}
          </LogPre>
        </div>
      ) : panelView === 'activity' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">Aktivitas</h3>
            <span className="text-[11px] text-[var(--text-muted)]">Riwayat terbaru</span>
          </div>
          <ActionButtonGroup
            actions={[
              {
                id: 'activity-full-queue',
                label: 'Log',
                icon: 'LOG',
                variant: activityView === 'queue' ? 'primary' : 'secondary',
                onClick: () => setActivityView('queue'),
              },
              {
                id: 'activity-full-preview',
                label: 'Pratinjau',
                icon: 'PRE',
                variant: activityView === 'preview' ? 'primary' : 'secondary',
                onClick: () => setActivityView('preview'),
              },
              {
                id: 'activity-full-copy',
                label: 'Salin',
                icon: 'COPY',
                variant: 'secondary',
                onClick: () => copyText(activityLines.join('\n')),
              },
              {
                id: 'activity-full-clear',
                label: 'Bersihkan',
                icon: 'CLEAR',
                variant: 'secondary',
                onClick: clearLogs,
              },
            ]}
          />
          <LogPre maxHeight={400}>
            {cleanUiText(
              activityLines.join('\n') || (activityView === 'preview' ? 'Belum ada log preview.' : 'Aplikasi siap.'),
            )}
          </LogPre>
        </div>
      ) : (
        <>
          <h3 className="text-[16px] font-bold text-[var(--text-primary)] mb-4">Status Render</h3>
          <div
            className={cn(
              'bg-[var(--tertiary-bg)] border rounded-[var(--radius-lg)] p-4 mb-4',
              currentJob
                ? 'border-[var(--accent-success)]'
                : nextJob
                  ? 'border-[var(--accent-warning)]'
                  : 'border-[var(--border-subtle)]',
            )}
          >
            <StatRow
              stats={[
                { label: 'Status', value: renderStateLabel, accent: true },
                { label: 'Batch', value: totalJobCount },
                { label: 'Progress', value: `${totalProgress}%` },
                { label: 'Elapsed', value: formatDuration(recentJob?.elapsedSeconds) },
                { label: 'ETA', value: recentJob?.etaSeconds ? formatDuration(recentJob.etaSeconds) : '-' },
                { label: 'Speed', value: recentJob?.speed || '-' },
                { label: 'Ukuran', value: formatBytes(recentJob?.outputSize) },
              ]}
            />
            <div className="relative w-full h-2 bg-[var(--surface)] rounded-full overflow-hidden mb-3">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-success)] transition-all duration-300"
                style={{ width: `${currentJob?.progress ?? totalProgress}%` }}
              />
            </div>
          </div>
          <div className="space-y-3">
            {visibleJobs.map(j => (
              <div
                key={j.id}
                className={cn(
                  'bg-[var(--tertiary-bg)] border rounded-[var(--radius-lg)] p-4',
                  j.status === 'rendering' && 'border-[var(--accent-success)]',
                  j.status === 'standby' && 'border-[var(--accent-warning)]',
                  (j.status === 'failed' || j.status === 'cancelled') && 'border-[var(--accent-danger)]',
                  j.status === 'done' && 'border-[var(--border-subtle)]',
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-[13px] font-bold text-[var(--text-primary)] mb-1">{j.title}</div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {queueStatusLabel(j.status)} / {j.progress || 0}% / ETA{' '}
                      {j.etaSeconds ? formatDuration(j.etaSeconds) : '-'}
                    </div>
                  </div>
                </div>
                <div className="relative w-full h-1.5 bg-[var(--surface)] rounded-full overflow-hidden mb-3">
                  <div
                    className={cn(
                      'absolute inset-y-0 left-0 transition-all duration-300',
                      j.status === 'rendering' && 'bg-[var(--accent-success)]',
                      j.status === 'done' && 'bg-[var(--accent-primary)]',
                      (j.status === 'failed' || j.status === 'cancelled') && 'bg-[var(--accent-danger)]',
                      j.status === 'standby' && 'bg-[var(--accent-warning)]',
                    )}
                    style={{ width: `${j.progress || 0}%` }}
                  />
                </div>
                <ActionButtonGroup
                  actions={[
                    {
                      id: `start-${j.id}`,
                      label: 'Mulai',
                      icon: '▶️',
                      variant: 'primary',
                      disabled: j.status === 'rendering' || j.status === 'done',
                      onClick: () => start(j.id),
                    },
                    ...(j.status === 'rendering'
                      ? [
                          {
                            id: `cancel-${j.id}`,
                            label: 'Batal',
                            icon: '⏹️',
                            variant: 'danger' as const,
                            onClick: () => cancel(j.id),
                          },
                        ]
                      : []),
                    ...(j.output || j.outputDir
                      ? [
                          {
                            id: `folder-${j.id}`,
                            label: 'Folder',
                            icon: '📁',
                            variant: 'secondary' as const,
                            onClick: () => revealOutput(j.output || j.outputDir),
                          },
                        ]
                      : []),
                  ]}
                />
                {j.error && (
                  <div className="mt-3 p-2 bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/30 rounded-[var(--radius-sm)] text-[11px] text-[var(--accent-danger)]">
                    {j.error}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <ActionButtonGroup
              actions={[
                {
                  id: 'status-start-queue',
                  label: 'Mulai Antrian',
                  icon: '▶️',
                  variant: 'primary',
                  onClick: startQueue,
                },
                {
                  id: 'status-start-next',
                  label: 'Mulai Berikutnya',
                  icon: '⏭️',
                  variant: 'primary',
                  onClick: startNext,
                },
                ...(recentJob?.output || recentJob?.outputDir
                  ? [
                      {
                        id: 'status-open-output',
                        label: 'Buka Output',
                        icon: '📁',
                        variant: 'secondary' as const,
                        onClick: () => revealOutput(recentJob.output || recentJob.outputDir),
                      },
                    ]
                  : []),
                { id: 'status-reset', label: 'Reset', icon: '♻️', variant: 'danger', onClick: reset },
              ]}
            />
          </div>
        </>
      )}
    </>
  );
}
