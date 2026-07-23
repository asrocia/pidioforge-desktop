import { ActionButtonGroup } from './design-system-components';

interface PreviewTimelineControlsProps {
  startAt: number;
  duration: number;
  onStartAtChange: (value: number) => void;
  onDurationChange: (value: number) => void;
}

export function PreviewTimelineControls({
  startAt,
  duration,
  onStartAtChange,
  onDurationChange,
}: PreviewTimelineControlsProps) {
  return (
    <div className="space-y-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-[var(--text-muted)]">Mulai</span>
          <input
            type="number"
            value={startAt}
            onChange={e => onStartAtChange(Number(e.target.value || 0))}
            className="bg-[var(--surface)] border border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[var(--text-primary)] text-[12px] h-9 px-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-[var(--text-muted)]">Durasi</span>
          <input
            type="number"
            value={duration}
            onChange={e => onDurationChange(Number(e.target.value || 1))}
            className="bg-[var(--surface)] border border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[var(--text-primary)] text-[12px] h-9 px-2"
          />
        </label>
      </div>
      <ActionButtonGroup
        actions={[
          { id: 'jump-0', label: '0s', variant: 'small', onClick: () => onStartAtChange(0) },
          { id: 'jump-15', label: '15s', variant: 'small', onClick: () => onStartAtChange(15) },
          { id: 'jump-30', label: '30s', variant: 'small', onClick: () => onStartAtChange(30) },
          { id: 'jump-60', label: '60s', variant: 'small', onClick: () => onStartAtChange(60) },
          { id: 'back-5', label: '-5s', variant: 'small', onClick: () => onStartAtChange(Math.max(0, startAt - 5)) },
          { id: 'forward-5', label: '+5s', variant: 'small', onClick: () => onStartAtChange(startAt + 5) },
        ]}
      />
    </div>
  );
}
