import { cn } from '../../utils/cn';
import { formatDuration } from '../../lib/format';
import type { Job } from '../../types/app.types';

type RenderProgressCardProps = {
  job: Job;
  onCancel?: (id: string) => void;
  onReveal?: (path: string) => void;
  className?: string;
};

export function RenderProgressCard({ job, onCancel, onReveal, className }: RenderProgressCardProps) {
  const isRendering = job.status === 'rendering';
  const isDone = job.status === 'done';
  const isFailed = job.status === 'failed';
  // const _isCancelled = job.status === 'cancelled';

  const statusColor = {
    rendering: 'var(--accent-primary)',
    done: 'var(--accent-success)',
    failed: 'var(--accent-danger)',
    cancelled: 'var(--text-muted)',
    standby: 'var(--accent-warning)',
  }[job.status] || 'var(--text-muted)';

  const statusIcon = {
    rendering: (
      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    done: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    failed: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    cancelled: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    standby: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  }[job.status];

  const elapsed = job.elapsedSeconds || 0;
  const eta = job.etaSeconds || 0;
  const rendered = job.renderedSeconds || 0;
  const total = job.durationSeconds || 0;

  return (
    <div className={cn(
      'bg-[var(--secondary-bg)] border rounded-[var(--radius-lg)] overflow-hidden transition-all',
      isRendering && 'border-[var(--accent-primary)]',
      isDone && 'border-[var(--accent-success)]',
      isFailed && 'border-[var(--accent-danger)]',
      !isRendering && !isDone && !isFailed && 'border-[var(--border-medium)]',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div style={{ color: statusColor }}>{statusIcon}</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
              {job.title || 'Untitled'}
            </h4>
            <p className="text-[10px] text-[var(--text-muted)]">
              {job.status === 'rendering' && `${job.speed || '0.0x'} • ${formatDuration(elapsed)} elapsed`}
              {job.status === 'done' && `Completed in ${formatDuration(elapsed)}`}
              {job.status === 'failed' && 'Render failed'}
              {job.status === 'cancelled' && 'Cancelled by user'}
              {job.status === 'standby' && 'Waiting in queue'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDone && job.output && onReveal && (
            <button
              onClick={() => onReveal(job.output!)}
              className="px-2 py-1 text-[10px] font-semibold text-[var(--accent-success)] hover:bg-[var(--accent-success)]/10 rounded transition-colors"
              title="Open output folder"
            >
              📁 Open
            </button>
          )}
          {isRendering && onCancel && (
            <button
              onClick={() => onCancel(job.id)}
              className="px-2 py-1 text-[10px] font-semibold text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 rounded transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isRendering && (
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-muted)]">Progress</span>
            <span className="text-[var(--text-primary)] font-semibold">{job.progress}%</span>
          </div>
          <div className="relative h-2 bg-[var(--tertiary-bg)] rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-[var(--accent-primary)] transition-all duration-300"
              style={{ width: `${job.progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
            <span>
              {rendered > 0 && total > 0 ? `${formatDuration(rendered)} / ${formatDuration(total)}` : 'Processing...'}
            </span>
            <span>
              {eta > 0 ? `ETA: ${formatDuration(eta)}` : 'Calculating...'}
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {isFailed && job.error && (
        <div className="px-4 py-3 bg-[var(--accent-danger)]/5">
          <p className="text-[11px] text-[var(--accent-danger)]">{job.error}</p>
        </div>
      )}

      {/* Output Info */}
      {isDone && (
        <div className="px-4 py-3 space-y-1">
          {job.output && (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[var(--text-muted)]">Output:</span>
              <span className="text-[var(--text-primary)] font-mono truncate max-w-[200px]" title={job.output}>
                {job.output.split(/[/\\]/).pop()}
              </span>
            </div>
          )}
          {job.outputSize && (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[var(--text-muted)]">Size:</span>
              <span className="text-[var(--text-primary)]">
                {(job.outputSize / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RenderProgressList({ jobs, onCancel, onReveal, className }: { jobs: Job[]; onCancel?: (id: string) => void; onReveal?: (path: string) => void; className?: string }) {
  const activeJobs = jobs.filter(j => j.status === 'rendering');
  const recentJobs = jobs.filter(j => j.status === 'done' || j.status === 'failed').slice(0, 5);

  return (
    <div className={cn('space-y-3', className)}>
      {activeJobs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[12px] font-semibold text-[var(--text-primary)] px-1">Active Renders</h3>
          {activeJobs.map(job => (
            <RenderProgressCard
              key={job.id}
              job={job}
              onCancel={onCancel}
              onReveal={onReveal}
            />
          ))}
        </div>
      )}

      {recentJobs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[12px] font-semibold text-[var(--text-primary)] px-1">Recent</h3>
          {recentJobs.map(job => (
            <RenderProgressCard
              key={job.id}
              job={job}
              onReveal={onReveal}
            />
          ))}
        </div>
      )}

      {activeJobs.length === 0 && recentJobs.length === 0 && (
        <div className="text-center py-8 text-[var(--text-muted)]">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-[12px]">No active renders</p>
        </div>
      )}
    </div>
  );
}
