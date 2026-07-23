import { copyText } from '../../../utils/media';
import { formatBytes } from '../../../lib/format';
import { ActionButtonGroup, Card } from '../../ui/design-system-components';
import type { LoopingEngineState } from './types';

interface ResultCardProps {
  engine: LoopingEngineState;
  actions: {
    revealLoop: () => Promise<void>;
    sendLoopToQueue: () => Promise<void>;
    useAsVisual: () => void;
  };
}

export function ResultCard({ engine, actions }: ResultCardProps) {
  const { result, resultUrl } = engine;

  if (!result) return null;

  return (
    <Card title="Hasil Loop">
      <div className="flex flex-col gap-1">
        <b className="text-[10px] text-[var(--text-primary)]">Output: {result.output}</b>
        <span className="text-[9px] text-[var(--text-muted)]">
          Input {Number(result.inputDuration || 0).toFixed(2)}s jadi {result.duration}s
        </span>
        <span className="text-[9px] text-[var(--text-muted)]">Ukuran {formatBytes(result.size)}</span>
      </div>
      {resultUrl && (
        <video
          className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)]"
          src={resultUrl}
          controls
        />
      )}
      <ActionButtonGroup
        actions={[
          { id: 'reveal', label: 'Buka Folder Output', icon: '📁', variant: 'secondary', onClick: actions.revealLoop },
          {
            id: 'copy',
            label: 'Salin Path',
            icon: '📋',
            variant: 'secondary',
            onClick: () => copyText(result.output || ''),
          },
          {
            id: 'use-visual',
            label: 'Pakai Sebagai Visual',
            icon: '🎬',
            variant: 'secondary',
            onClick: actions.useAsVisual,
          },
          { id: 'queue', label: 'Kirim ke Queue', icon: '➕', variant: 'primary', onClick: actions.sendLoopToQueue },
        ]}
      />
    </Card>
  );
}
