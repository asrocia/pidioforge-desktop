import { getDeep } from '../../../lib/config-path';
import { cn } from '../../../utils/cn';
import type { AudioMixingCardProps } from './types';
import type { AudioAnalysis } from './types';

interface AudioStatsCardProps extends AudioMixingCardProps {
  analysis: AudioAnalysis | null;
  validation: AudioAnalysis | null;
}

export function AudioStatsCard({ config, analysis, validation }: AudioStatsCardProps) {
  const loud = analysis?.loudness || validation?.loudness;
  const beats = analysis?.beats || validation?.beats || [];

  return (
    <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
      <div className="space-y-3">
        <div className="flex flex-col items-center text-center">
          <span className="text-[11px] text-[var(--text-muted)] mb-1">MASTER</span>
          <span className="text-[16px] font-bold text-[var(--accent-primary)]">
            {getDeep(config, 'audio.masterGain', 100)}%
          </span>
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-[11px] text-[var(--text-muted)] mb-1">LUFS</span>
          <span className="text-[16px] font-bold text-[var(--text-primary)]">{loud?.integratedLufs ?? '-'}</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-[11px] text-[var(--text-muted)] mb-1">PEAK</span>
          <span className="text-[16px] font-bold text-[var(--text-primary)]">{loud?.truePeak ?? '-'}</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <span className="text-[11px] text-[var(--text-muted)] mb-1">Beat</span>
          <span className="text-[16px] font-bold text-[var(--text-primary)]">{beats?.length || 0}</span>
        </div>
      </div>

      {/* Loudness Meter Visual */}
      {loud?.integratedLufs && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--text-muted)]">Loudness Meter</span>
            <span
              className={cn(
                'font-semibold',
                loud.integratedLufs < -23
                  ? 'text-[var(--accent-danger)]'
                  : loud.integratedLufs < -16
                    ? 'text-[var(--accent-warning)]'
                    : loud.integratedLufs < -10
                      ? 'text-[var(--accent-success)]'
                      : 'text-[var(--accent-danger)]',
              )}
            >
              {loud.integratedLufs < -23
                ? '⚠ Too Quiet'
                : loud.integratedLufs < -16
                  ? '✓ Good'
                  : loud.integratedLufs < -10
                    ? '✓ Optimal'
                    : '⚠ Too Loud'}
            </span>
          </div>
          <div className="relative h-3 bg-[var(--tertiary-bg)] rounded-full overflow-hidden">
            <div className="absolute inset-0 flex">
              <div className="flex-1 bg-red-500/20" style={{ maxWidth: '20%' }} />
              <div className="flex-1 bg-yellow-500/20" style={{ maxWidth: '30%' }} />
              <div className="flex-1 bg-green-500/20" style={{ maxWidth: '30%' }} />
              <div className="flex-1 bg-red-500/20" style={{ maxWidth: '20%' }} />
            </div>
            <div
              className={cn(
                'absolute top-0 left-0 h-full transition-all duration-300',
                loud.integratedLufs < -23
                  ? 'bg-red-500'
                  : loud.integratedLufs < -16
                    ? 'bg-yellow-500'
                    : loud.integratedLufs < -10
                      ? 'bg-green-500'
                      : 'bg-red-500',
              )}
              style={{
                width: `${Math.min(100, Math.max(0, ((loud.integratedLufs + 40) / 40) * 100))}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-[var(--text-muted)]">
            <span>-40 LUFS</span>
            <span>-23</span>
            <span>-16</span>
            <span>-10</span>
            <span>0 LUFS</span>
          </div>
        </div>
      )}

      {/* Peak Meter Visual */}
      {loud?.truePeak && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[var(--text-muted)]">Peak Level</span>
            <span
              className={cn(
                'font-semibold',
                loud.truePeak > -1
                  ? 'text-[var(--accent-danger)]'
                  : loud.truePeak > -3
                    ? 'text-[var(--accent-warning)]'
                    : 'text-[var(--accent-success)]',
              )}
            >
              {loud.truePeak > -1 ? '⚠ Clipping Risk' : loud.truePeak > -3 ? '⚠ High' : '✓ Safe'}
            </span>
          </div>
          <div className="relative h-2 bg-[var(--tertiary-bg)] rounded-full overflow-hidden">
            <div
              className={cn(
                'absolute top-0 left-0 h-full transition-all duration-300',
                loud.truePeak > -1 ? 'bg-red-500' : loud.truePeak > -3 ? 'bg-yellow-500' : 'bg-green-500',
              )}
              style={{
                width: `${Math.min(100, Math.max(0, ((loud.truePeak + 40) / 40) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
