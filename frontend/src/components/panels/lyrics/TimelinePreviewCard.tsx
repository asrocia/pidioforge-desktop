import { Card } from '../../ui/design-system-components';
import type { LyricLine } from './types';

interface TimelinePreviewCardProps {
  previewRows: LyricLine[];
}

export function TimelinePreviewCard({ previewRows }: TimelinePreviewCardProps) {
  if (!previewRows.length) return null;

  return (
    <Card title="Pratinjau Timeline">
      <div className="flex flex-col gap-1">
        {previewRows.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 text-[10px] px-2 py-1.5 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)]"
          >
            <b className="text-[var(--accent-primary)] font-mono">{Number(r.time || 0).toFixed(2)}s</b>
            <span className="text-[var(--text-primary)]">{r.text}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
