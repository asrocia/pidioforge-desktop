import { cn } from '../../../utils/cn';
import { ActionButtonGroup } from '../../ui/design-system-components';
import type { TargetEngineState } from './types';

interface ActionsCardProps {
  engine: TargetEngineState;
}

export function ActionsCard({ engine }: ActionsCardProps) {
  const { busy, message, scan, inspectTarget, createBatch, autoTuneTarget, checkDiagnosticsOnly, createStructure } =
    engine;

  return (
    <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
      <ActionButtonGroup
        actions={[
          {
            id: 'inspect',
            label: 'Scan & Cek',
            icon: '🔎',
            variant: 'primary',
            disabled: busy,
            onClick: inspectTarget,
          },
          {
            id: 'batch',
            label: 'Buat Batch',
            icon: '📦',
            variant: 'primary',
            disabled: busy || !scan.pairs.length,
            onClick: createBatch,
          },
          {
            id: 'autotune',
            label: 'Auto Tune',
            icon: '⚙️',
            variant: 'secondary',
            disabled: busy || !scan.files.length,
            onClick: autoTuneTarget,
          },
          {
            id: 'ffmpeg',
            label: 'Cek FFmpeg',
            icon: '🧪',
            variant: 'secondary',
            disabled: busy,
            onClick: checkDiagnosticsOnly,
          },
          {
            id: 'structure',
            label: 'Buat Folder',
            icon: '📁',
            variant: 'secondary',
            disabled: busy,
            onClick: createStructure,
          },
        ]}
      />
      {message && (
        <div
          className={cn(
            'px-3 py-2 rounded-[var(--radius-md)] text-[12px] font-medium border',
            scan.summary?.ready
              ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)] border-[var(--accent-success)]/20'
              : 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)] border-[var(--accent-warning)]/20',
          )}
        >
          {message}
        </div>
      )}
    </div>
  );
}
