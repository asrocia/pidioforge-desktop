import { Field, SelectInput } from '../../ui/form-controls';
import { WaveformDisplay, WaveformSkeleton } from '../../ui/WaveformDisplay';
import { cn } from '../../../utils/cn';
import { cleanUiText } from '../../../lib/format';
import { getDeep } from '../../../lib/config-path';
import { Card } from '../../ui/design-system-components';
import type { AudioMixingCardProps, AudioAnalysis } from './types';

interface PresetCardProps extends AudioMixingCardProps {
  analysis: AudioAnalysis | null;
  validation: AudioAnalysis | null;
  message: string;
  busy: boolean;
  previewUrl: string;
  previewing: boolean;
  validateAudio: () => Promise<void>;
  analyzeAudio: () => Promise<void>;
  previewAudio: () => Promise<void>;
  applyPreset: (v: string) => void;
}

export function PresetCard({
  config,
  updateConfig,
  analysis,
  validation,
  message,
  busy,
  previewUrl,
  previewing,
  validateAudio,
  analyzeAudio,
  previewAudio,
  applyPreset,
}: PresetCardProps) {
  const peaks = analysis?.waveform?.peaks || validation?.waveform?.peaks || [];

  return (
    <Card title="Preset & Cek Aman">
      <div className="space-y-3">
        <Field label="Preset Platform">
          <SelectInput value={getDeep(config, 'audio.platformPreset', 'custom')} onChange={applyPreset}>
            <option value="custom">Kustom</option>
            <option value="youtube-music">YouTube Music</option>
            <option value="youtube-shorts">YouTube Shorts</option>
            <option value="tiktok-loud">TikTok Kencang</option>
            <option value="podcast-clean">Podcast Bersih</option>
            <option value="background-soft">Latar Lembut</option>
            <option value="cinematic-bass">Bass Sinematik</option>
          </SelectInput>
        </Field>
        <Field label="Mode Mix">
          <SelectInput
            value={getDeep(config, 'audio.mixMode', 'single')}
            onChange={v => updateConfig('audio.mixMode', v)}
          >
            <option value="single">Audio tunggal</option>
            <option value="playlist">Crossfade playlist</option>
            <option value="ambient">Audio + ambience</option>
          </SelectInput>
        </Field>
        <Field label="Urutan">
          <SelectInput value={getDeep(config, 'audio.order', 'acak')} onChange={v => updateConfig('audio.order', v)}>
            <option>acak</option>
            <option>urut</option>
            <option>acak unik</option>
          </SelectInput>
        </Field>
      </div>
      <div className="space-y-3">
        <button
          onClick={validateAudio}
          disabled={busy}
          className="px-4 py-2 text-[12px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          Cek Audio
        </button>
        <button
          onClick={analyzeAudio}
          disabled={busy}
          className="px-4 py-2 text-[12px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          Analisis Waveform
        </button>
        <button
          onClick={previewAudio}
          disabled={busy || previewing}
          className="px-4 py-2 text-[12px] font-semibold text-white bg-[var(--accent-success)] hover:bg-[var(--accent-success)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          🎧 Preview 10s
        </button>
        <Field label="Auto Gain">
          <SelectInput
            value={getDeep(config, 'audio.autoGain', true) ? 'Aktif' : 'Mati'}
            onChange={v => updateConfig('audio.autoGain', v === 'Aktif')}
          >
            <option value="Aktif">Aktif</option>
            <option value="Mati">Mati</option>
          </SelectInput>
        </Field>
      </div>
      {previewUrl && (
        <div className="mt-2">
          <audio controls src={previewUrl} className="w-full h-8 rounded-[var(--radius-md)]" />
        </div>
      )}
      {message && (
        <div
          className={cn(
            'px-3 py-2 rounded-[var(--radius-md)] text-[11px] font-medium',
            validation?.ok
              ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]'
              : 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]',
          )}
        >
          {cleanUiText(message)}
        </div>
      )}
      {validation?.warnings?.length ? (
        <div className="p-4 bg-[var(--secondary-bg)] border-l-4 border-[var(--accent-warning)] rounded-[var(--radius-lg)]">
          <h4 className="text-[12px] font-bold text-[var(--accent-warning)] mb-3">⚠ Catatan audio:</h4>
          <ul className="space-y-2">
            {validation.warnings.map((w: string, i: number) => (
              <li
                key={i}
                className="text-[11px] text-[var(--text-primary)] leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-[var(--accent-warning)]"
              >
                {cleanUiText(w)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {peaks.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-muted)]">Audio Waveform</span>
            <span className="text-[var(--text-primary)]">{peaks.length} samples</span>
          </div>
          <WaveformDisplay
            peaks={peaks}
            duration={analysis?.info?.duration || validation?.totalDuration || 0}
            height={60}
            color="#38bdf8"
            progressColor="#22c55e"
            backgroundColor="var(--tertiary-bg)"
            className="rounded-[var(--radius-md)] overflow-hidden border border-[var(--border-subtle)]"
          />
        </div>
      ) : busy ? (
        <WaveformSkeleton height={60} className="rounded-[var(--radius-md)]" />
      ) : (
        <div className="flex items-end gap-px px-3 py-2 h-[48px] bg-[var(--tertiary-bg)] rounded-[var(--radius-md)]">
          {peaks.slice(0, 120).map((p: number, i: number) => (
            <i
              key={i}
              className="w-[3px] min-h-[3px] rounded-t bg-[var(--accent-primary)]"
              style={{ height: `${Math.max(3, p * 54)}px` }}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
