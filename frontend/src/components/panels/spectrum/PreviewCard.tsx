import { SelectInput } from '../../ui/form-controls';
import { cn } from '../../../utils/cn';
import { getDeep } from '../../../lib/config-path';
import { cleanUiText } from '../../../lib/format';
import { fileUrl, nowPlayingText } from '../../../utils/media';
import { applySpectrumFormatPreset } from '../../../utils/format-presets';
import { StatRow } from '../../ui/design-system-components';
import type { SpectrumCardProps, SpectrumEngineState } from './types';

interface PreviewCardProps extends SpectrumCardProps {
  engine: SpectrumEngineState;
}

export function PreviewCard({ config, updateConfig, engine }: PreviewCardProps) {
  const {
    preview,
    message,
    busy,
    dragging,
    setDragging,
    tuned,
    peaks,
    format,
    visual,
    visualType,
    npX,
    npY,
    spY,
    spectrumPreviewheight,
    applyPreset,
    loadPreview,
    analyzeAndTune,
    setDragPosition,
    editNowPlaying,
  } = engine;

  return (
    <div className="p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] space-y-3">
      <div
        className="relative h-[96px] rounded-[var(--radius-md)] overflow-hidden bg-[var(--tertiary-bg)] border border-[var(--border-subtle)]"
        onMouseMove={e => dragging && setDragPosition(e)}
        onMouseUp={() => setDragging('')}
        onMouseLeave={() => setDragging('')}
      >
        {visual && visualType === 'video' && (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src={fileUrl(visual)}
            muted
            loop
            autoPlay
            playsInline
          />
        )}
        {visual && visualType === 'image' && (
          <img className="absolute inset-0 w-full h-full object-cover" src={fileUrl(visual)} />
        )}
        <div className="absolute inset-0 bg-black/30" />
        {getDeep(config, 'spectrum.nowPlaying', true) && (
          <div
            className="absolute text-[13px] font-bold text-white drop-shadow-md cursor-move select-none whitespace-nowrap"
            contentEditable
            suppressContentEditableWarning
            onBlur={e => editNowPlaying(e.currentTarget.textContent || '')}
            onMouseDown={e => {
              setDragging('nowPlaying');
              setDragPosition(e, 'nowPlaying');
            }}
            style={{
              left: `${npX}%`,
              top: `${npY}%`,
              color: getDeep(config, 'spectrum.nowPlayingColor', '#ffffff'),
              fontSize: `${Number(getDeep(config, 'spectrum.nowPlayingFontSize', 26))}px`,
            }}
          >
            {nowPlayingText(config)}
          </div>
        )}
        {getDeep(config, 'spectrum.enabled', true) && (
          <div
            className="absolute flex items-end gap-px cursor-move"
            onMouseDown={e => {
              setDragging('spectrum');
              setDragPosition(e, 'spectrum');
            }}
            style={{
              left: '5%',
              right: '5%',
              top: `${spY}%`,
              height: `${spectrumPreviewheight}px`,
              opacity: Number(getDeep(config, 'spectrum.transparency', 80)) / 100,
            }}
          >
            {(peaks.length ? peaks : Array.from({ length: 64 }, (_, i) => ((i * 17) % 60) / 60))
              .slice(0, 64)
              .map((p: number, i: number) => (
                <i
                  key={i}
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${8 + Number(p) * Math.max(34, spectrumPreviewheight - 12)}px`,
                    background:
                      i % 2
                        ? getDeep(config, 'spectrum.color2', '#38bdf8')
                        : getDeep(config, 'spectrum.color1', 'white'),
                  }}
                />
              ))}
          </div>
        )}
        {getDeep(config, 'spectrum.progressBar', true) && (
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/20">
            <span
              className="block h-full w-[33%]"
              style={{ background: getDeep(config, 'spectrum.progressColor', '#22c55e') }}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <SelectInput value={getDeep(config, 'spectrum.stylePreset', 'clean-wave')} onChange={applyPreset}>
          <option value="clean-wave">Gelombang Bersih</option>
          <option value="neon-bars">Batang Neon</option>
          <option value="minimal-line">Garis Minimal</option>
          <option value="shorts-center">Tengah Shorts</option>
        </SelectInput>
        <button
          onClick={() => applySpectrumFormatPreset(updateConfig, format as 'landscape' | 'vertical' | 'square')}
          className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200"
        >
          Format {format === 'vertical' ? '9:16' : format === 'square' ? '1:1' : '16:9'}
        </button>
        <button
          onClick={loadPreview}
          disabled={busy}
          className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          Pratinjau
        </button>
        <button
          onClick={analyzeAndTune}
          disabled={busy}
          className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          Tuning Otomatis
        </button>
      </div>
      {message && (
        <div
          className={cn(
            'px-3 py-2 rounded-[var(--radius-md)] text-[11px] font-medium',
            preview?.ok
              ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]'
              : 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]',
          )}
          role="status"
          aria-live="polite"
        >
          {cleanUiText(message)}
        </div>
      )}
      {tuned && (
        <StatRow
          stats={[
            { label: 'Sensitivitas', value: tuned.sensitivity ?? 0 },
            { label: 'Tinggi', value: tuned.height ?? 0 },
            { label: 'Rentang Dinamis', value: tuned.dynamicRange ?? 0 },
            { label: 'Beat', value: preview?.beats?.length || 0, accent: true },
          ]}
        />
      )}
      {tuned?.warnings?.length ? (
        <div className="p-3 bg-[var(--secondary-bg)] border-l-4 border-[var(--accent-warning)] rounded-[var(--radius-lg)]">
          <h4 className="text-[11px] font-bold text-[var(--accent-warning)] mb-2">⚠ Catatan analisis:</h4>
          <ul className="space-y-1.5">
            {tuned.warnings.map((w: string, i: number) => (
              <li
                key={i}
                className="text-[10px] text-[var(--text-primary)] leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[var(--accent-warning)]"
              >
                {cleanUiText(w)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
