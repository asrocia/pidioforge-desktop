import { cn } from '../../../utils/cn';
import { Card, WarningList } from '../../ui/design-system-components';
import type { LoopingEngineState } from './types';

interface QualityScoringCardProps {
  engine: LoopingEngineState;
}

export function QualityScoringCard({ engine }: QualityScoringCardProps) {
  const { analysis } = engine;

  if (!analysis) return null;

  return (
    <Card title="Loop Quality Scoring">
      <div className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-[var(--text-primary)]">Overall Quality</span>
          <span
            className={cn(
              'text-[16px] font-bold',
              (analysis.best?.score || 0) >= 80
                ? 'text-[var(--accent-success)]'
                : (analysis.best?.score || 0) >= 60
                  ? 'text-[var(--accent-warning)]'
                  : 'text-[var(--accent-danger)]',
            )}
          >
            {analysis.best?.score || 0}/100
          </span>
        </div>
        <div className="relative h-2 bg-[var(--secondary-bg)] rounded-full overflow-hidden">
          <div
            className={cn(
              'absolute top-0 left-0 h-full transition-all duration-300',
              (analysis.best?.score || 0) >= 80
                ? 'bg-green-500'
                : (analysis.best?.score || 0) >= 60
                  ? 'bg-yellow-500'
                  : 'bg-red-500',
            )}
            style={{ width: `${analysis.best?.score || 0}%` }}
          />
        </div>
        <div className="mt-2 text-[10px] text-[var(--text-muted)]">{analysis.best?.label || 'Analyzing...'}</div>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)]">
          <div className="text-[10px] text-[var(--text-muted)] mb-1">Motion Continuity</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[var(--secondary-bg)] rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${analysis.metrics?.motionContinuity || 0}%` }} />
            </div>
            <span className="text-[10px] font-semibold text-[var(--text-primary)]">
              {analysis.metrics?.motionContinuity || 0}%
            </span>
          </div>
        </div>
        <div className="p-3 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)]">
          <div className="text-[10px] text-[var(--text-muted)] mb-1">Color Consistency</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[var(--secondary-bg)] rounded-full overflow-hidden">
              <div className="h-full bg-purple-500" style={{ width: `${analysis.metrics?.colorConsistency || 0}%` }} />
            </div>
            <span className="text-[10px] font-semibold text-[var(--text-primary)]">
              {analysis.metrics?.colorConsistency || 0}%
            </span>
          </div>
        </div>
        <div className="p-3 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)]">
          <div className="text-[10px] text-[var(--text-muted)] mb-1">Scene Stability</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[var(--secondary-bg)] rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${analysis.metrics?.sceneStability || 0}%` }} />
            </div>
            <span className="text-[10px] font-semibold text-[var(--text-primary)]">
              {analysis.metrics?.sceneStability || 0}%
            </span>
          </div>
        </div>
        <div className="p-3 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)]">
          <div className="text-[10px] text-[var(--text-muted)] mb-1">Temporal Smoothness</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[var(--secondary-bg)] rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500" style={{ width: `${analysis.metrics?.temporalSmoothness || 0}%` }} />
            </div>
            <span className="text-[10px] font-semibold text-[var(--text-primary)]">
              {analysis.metrics?.temporalSmoothness || 0}%
            </span>
          </div>
        </div>
      </div>

      {(analysis.suggestions?.length || 0) > 0 && (
        <WarningList tone="info" title="Suggestions" items={analysis.suggestions || []} />
      )}
    </Card>
  );
}
