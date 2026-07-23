import { ActionButtonGroup, Callout, Card } from '../../ui/design-system-components';
import type { LoopingEngineState } from './types';

interface TimelineEditorCardProps {
  engine: LoopingEngineState;
}

export function TimelineEditorCard({ engine }: TimelineEditorCardProps) {
  const { trimStart, setTrimStart, trimEnd, setTrimEnd, duration } = engine;

  return (
    <Card title="Visual Timeline Editor">
      <div className="relative h-24 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] overflow-hidden">
        <div className="absolute inset-0 flex items-center px-2">
          <div
            className="flex-1 h-12 rounded relative"
            style={{
              background: 'linear-gradient(90deg, rgba(59,130,246,0.2), rgba(16,185,129,0.2), rgba(59,130,246,0.2))',
            }}
          >
            <div
              className="absolute top-0 bottom-0 w-1 bg-[var(--accent-warning)] cursor-ew-resize"
              style={{ left: `${(trimStart / 10) * 100}%` }}
              title="Trim Start"
            />
            <div
              className="absolute top-0 bottom-0 w-1 bg-[var(--accent-danger)] cursor-ew-resize"
              style={{ left: `${100 - (trimEnd / 10) * 100}%` }}
              title="Trim End"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white drop-shadow-md">
                Loop: {trimStart}s → {10 - trimEnd}s
              </span>
            </div>
          </div>
        </div>
      </div>
      <ActionButtonGroup
        actions={[
          {
            id: 'start-back',
            label: '← Start',
            variant: 'small',
            onClick: () => setTrimStart(Math.max(0, trimStart - 0.1)),
          },
          {
            id: 'start-forward',
            label: 'Start →',
            variant: 'small',
            onClick: () => setTrimStart(Math.min(10, trimStart + 0.1)),
          },
          { id: 'end-back', label: '← End', variant: 'small', onClick: () => setTrimEnd(Math.max(0, trimEnd - 0.1)) },
          {
            id: 'end-forward',
            label: 'End →',
            variant: 'small',
            onClick: () => setTrimEnd(Math.min(10, trimEnd + 0.1)),
          },
        ]}
      />
      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
        <span>Duration: {(10 - trimStart - trimEnd).toFixed(2)}s</span>
        <span>•</span>
        <span>Loops needed: {Math.ceil(duration / (10 - trimStart - trimEnd))}</span>
      </div>
      <Callout type="tip">
        Drag markers di timeline atau gunakan tombol untuk fine-tune loop points. Warning = Start, Error = End.
      </Callout>
    </Card>
  );
}
