import { cn } from '../../../utils/cn';
import { humanSize } from '../../../utils/media';
import { Chip, ChipGroup, MetaStrip, StatRow, WarningList } from '../../ui/design-system-components';
import type { CollisionItem, MediaPair, TargetEngineState } from './types';

interface SummaryCardsProps {
  engine: TargetEngineState;
}

export function SummaryCards({ engine }: SummaryCardsProps) {
  const { scan, counts, risk, collisions, est, enc, selectedType, setSelectedType, files } = engine;

  return (
    <>
      {scan.diagnostics && (
        <StatRow
          stats={[
            { label: 'FFmpeg', value: scan.diagnostics.ffmpeg ? 'OK' : 'Tidak ada', accent: scan.diagnostics.ffmpeg },
            { label: 'Rekomendasi', value: scan.diagnostics.recommended || '-', accent: true },
            { label: 'CPU/libx264', value: enc.libx264 ? 'OK' : '-' },
            { label: 'NVIDIA', value: enc.h264_nvenc ? 'OK' : '-' },
            { label: 'Intel', value: enc.h264_qsv ? 'OK' : '-' },
            { label: 'AMD', value: enc.h264_amf ? 'OK' : '-' },
          ]}
        />
      )}

      {!!scan.summary && (
        <StatRow
          stats={[
            { label: 'Total file', value: counts.total ?? 0 },
            { label: 'Video', value: counts.videos ?? 0 },
            { label: 'Gambar', value: counts.images ?? 0 },
            { label: 'Audio', value: counts.audios ?? 0 },
            { label: 'Lirik', value: counts.lyrics ?? 0 },
            { label: 'Target', value: scan.summary.resolution || '-' },
          ]}
        />
      )}

      {risk && (
        <StatRow
          stats={[
            { label: 'Risk Score', value: risk.score ?? 0, accent: true },
            { label: 'Pair rendah', value: risk.lowConfidencePairs ?? 0 },
            { label: 'Collision', value: risk.collisionCount ?? 0 },
            { label: 'File risk', value: risk.invalidFiles ?? 0 },
            { label: 'Tanpa lirik', value: risk.noLyrics ?? 0 },
          ]}
        />
      )}

      {est && (
        <MetaStrip
          items={[
            { label: 'Estimasi', value: `${est.jobs} job` },
            { value: `±${est.estimatedSizeMB} MB` },
            { value: `±${est.estimatedTotalDuration}s` },
            { value: est.resolution },
            { value: est.bitrate },
            { value: `encoder ${est.encoder}` },
          ]}
        />
      )}

      {!!scan.summary?.warnings?.length && (
        <WarningList tone="warning" title="Catatan pemeriksaan" items={scan.summary.warnings.slice(0, 12)} />
      )}

      {!!collisions.filter((c: CollisionItem) => c.status !== 'safe').length && (
        <WarningList
          tone="danger"
          title="Output collision"
          items={collisions
            .filter((c: CollisionItem) => c.status !== 'safe')
            .slice(0, 8)
            .map((c: CollisionItem) => `${c.status}: ${c.requested} → ${c.finalPath}`)}
        />
      )}

      {!!scan.pairs.length && (
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)]">Pasangan Batch Otomatis</h3>
          <div className="space-y-2">
            {scan.pairs.slice(0, 12).map((p: MediaPair, i: number) => (
              <div
                key={`${p.audio}-${i}`}
                className={cn(
                  'rounded-[var(--radius-md)] px-3 py-2.5 border text-[11px] leading-relaxed space-y-1.5 transition-all duration-200 hover:border-[var(--accent-primary)]/50',
                  Number(p.confidence || 0) < 60
                    ? 'bg-[var(--tertiary-bg)] border-[var(--accent-warning)]/30'
                    : 'bg-[var(--tertiary-bg)] border-[var(--border-subtle)]',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text-primary)]">{p.title}</span>
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                      Number(p.confidence || 0) >= 80
                        ? 'bg-[var(--accent-success)]/20 text-[var(--accent-success)]'
                        : Number(p.confidence || 0) >= 60
                          ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                          : 'bg-[var(--accent-warning)]/20 text-[var(--accent-warning)]',
                    )}
                  >
                    {p.confidence ?? '-'}%
                  </span>
                </div>
                <div className="text-[var(--text-muted)]">
                  <span className="font-semibold">Alasan:</span> {p.pairReason || '-'}
                </div>
                <div className="text-[var(--text-muted)]">
                  <span className="font-semibold">Visual:</span> {p.visual || '-'}
                </div>
                <div className="text-[var(--text-muted)]">
                  <span className="font-semibold">Audio:</span> {p.audio}
                </div>
                <div className="text-[var(--text-muted)]">
                  <span className="font-semibold">Lirik:</span> {p.lyrics || '-'}
                  {p.lyricReason ? ` (${p.lyricReason})` : ''}
                </div>
                <div className="text-[var(--text-muted)]">
                  <span className="font-semibold">Output:</span> {p.outputName || '-'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!!scan.files.length && (
        <div className="space-y-3 p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
          <h3 className="text-[13px] font-bold text-[var(--text-primary)]">File Terdeteksi</h3>
          <ChipGroup>
            {['all', 'video', 'image', 'audio', 'lyrics'].map(t => (
              <Chip key={t} active={selectedType === t} onClick={() => setSelectedType(t)}>
                {t === 'all'
                  ? 'Semua'
                  : t === 'image'
                    ? 'Gambar'
                    : t === 'lyrics'
                      ? 'Lirik'
                      : t.charAt(0).toUpperCase() + t.slice(1)}
              </Chip>
            ))}
          </ChipGroup>
          <div className="space-y-1">
            {files.slice(0, 80).map(f => (
              <div
                key={f.path}
                className={cn(
                  'grid grid-cols-[48px_minmax(0,1fr)_64px_minmax(0,96px)] gap-3 items-center px-3 py-2 rounded-[var(--radius-md)] text-[11px] transition-all duration-200 hover:bg-[var(--tertiary-bg)]',
                  f.health?.level === 'risk'
                    ? 'bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)]/30'
                    : f.health?.level === 'warn'
                      ? 'bg-[var(--accent-warning)]/10 border border-[var(--accent-warning)]/30'
                      : 'bg-[var(--tertiary-bg)] border border-[var(--border-subtle)]',
                )}
              >
                <span className="text-[var(--text-muted)] truncate uppercase text-[10px] font-semibold">{f.type}</span>
                <span className="text-[var(--text-primary)] truncate font-medium" title={f.path}>
                  {f.name}
                </span>
                <span className="text-[var(--text-muted)] text-right">{humanSize(f.size)}</span>
                <span className="text-[var(--text-muted)] truncate text-right">
                  {f.duration ? `${Math.round(f.duration)}s` : (f.warnings || []).join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
