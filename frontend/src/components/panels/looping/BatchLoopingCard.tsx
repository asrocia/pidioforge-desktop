import { Field } from '../../ui/form-controls';
import { PathInput } from '../../ui/PathInput';
import { Textarea, ProgressBar, Card } from '../../ui/design-system-components';
import type { LoopingEngineState } from './types';

interface BatchLoopingCardProps {
  engine: LoopingEngineState;
  renderBatch: () => Promise<void>;
}

export function BatchLoopingCard({ engine, renderBatch }: BatchLoopingCardProps) {
  const { batchText, setBatchText, batchOutput, setBatchOutput, busy, batchProgress, batchResult } = engine;

  return (
    <Card title="Batch Looping">
      <Textarea
        value={batchText}
        onChange={e => setBatchText(e.target.value)}
        placeholder="Satu path file atau folder per baris"
        minRows={3}
      />
      <Field label="Folder Output Batch">
        <PathInput
          value={batchOutput}
          onChange={setBatchOutput}
          kind="directory"
          placeholder="Kosongkan untuk folder otomatis"
        />
      </Field>
      <button
        onClick={renderBatch}
        disabled={busy || !batchText.trim()}
        className="w-full px-3 py-2 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
      >
        Proses Batch Looping
      </button>
      {batchProgress.total > 0 && <ProgressBar value={batchProgress.done} max={batchProgress.total} tone="primary" />}
      {batchResult && (
        <div className="px-3 py-2 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
          <b className="text-[10px] text-[var(--text-primary)] block">
            Batch: {batchResult.created?.length || 0} dibuat, {batchResult.skipped?.length || 0} dilewati
          </b>
          <span className="text-[9px] text-[var(--text-muted)] block">{batchResult.outputDir}</span>
          <span className="text-[9px] text-[var(--text-muted)] block">
            Scan {batchResult.scanned || 0} file{batchResult.limited ? ' / dibatasi' : ''}
          </span>
        </div>
      )}
    </Card>
  );
}
