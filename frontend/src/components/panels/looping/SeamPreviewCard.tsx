import { fileUrl } from '../../../utils/media';
import { Card } from '../../ui/design-system-components';
import type { LoopingEngineState } from './types';

interface SeamPreviewCardProps {
  engine: LoopingEngineState;
}

export function SeamPreviewCard({ engine }: SeamPreviewCardProps) {
  const { seamPreview, input, seamUrl } = engine;

  if (!seamPreview) return null;

  return (
    <Card title="Preview Sambungan">
      <div className="grid grid-cols-2 gap-3">
        {fileUrl(input) && (
          <video
            className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)]"
            src={fileUrl(input)}
            controls
            muted
          />
        )}
        {seamUrl && (
          <video
            className="w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)]"
            src={seamUrl}
            controls
            autoPlay
            loop
          />
        )}
      </div>
      {seamPreview.quality && (
        <div className="flex items-center gap-2">
          <b className="text-[10px] text-[var(--accent-primary)]">Score {seamPreview.quality.score}/100</b>
          <span className="text-[10px] text-[var(--text-muted)]">{seamPreview.quality.label}</span>
        </div>
      )}
    </Card>
  );
}
