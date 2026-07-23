import { Field, Check, SelectInput } from '../../ui/form-controls';
import { PathInput } from '../../ui/PathInput';
import { cn } from '../../../utils/cn';
import { getDeep } from '../../../lib/config-path';
import { cleanUiText } from '../../../lib/format';
import { Card } from '../../ui/design-system-components';
import type { LyricsCardProps, LyricsEngineState } from './types';

interface EngineCardProps extends LyricsCardProps {
  engine: LyricsEngineState;
}

export function EngineCard({ config, updateConfig, engine }: EngineCardProps) {
  const { text, setText, parsed, message, validation, busy, parseLyrics, autoAlign, validateLyrics, exportLyrics } =
    engine;

  return (
    <Card title="Mesin Lirik">
      <Check
        label="Aktifkan Lirik"
        checked={Boolean(getDeep(config, 'lyrics.enabled', true))}
        onChange={v => updateConfig('lyrics.enabled', v)}
      />
      <Field label="Mode">
        <SelectInput
          value={getDeep(config, 'lyrics.autoMode', 'from-text')}
          onChange={v => updateConfig('lyrics.autoMode', v)}
        >
          <option value="from-text">Dari teks manual</option>
          <option value="from-file">Dari file LRC/SRT</option>
          <option value="auto-align">Auto align durasi</option>
        </SelectInput>
      </Field>
      <Field label="AI Mode">
        <SelectInput value={getDeep(config, 'lyrics.ai', 'Mati')} onChange={v => updateConfig('lyrics.ai', v)}>
          <option value="Mati">Mati / lokal</option>
          <option value="prepare">Siapkan transkrip</option>
          <option value="manual-review">Tinjau manual</option>
        </SelectInput>
      </Field>
      <Field label="Bahasa">
        <SelectInput
          value={getDeep(config, 'lyrics.language', 'Auto')}
          onChange={v => updateConfig('lyrics.language', v)}
        >
          <option>Auto</option>
          <option>Indonesia</option>
          <option>English</option>
          <option>Arabic</option>
          <option>Mixed</option>
        </SelectInput>
      </Field>
      <Field label="File LRC/SRT">
        <PathInput
          value={getDeep(config, 'lyrics.file')}
          onChange={v => updateConfig('lyrics.file', v)}
          placeholder="C:/lirik/lagu.lrc atau .srt"
          filter="lyrics"
        />
      </Field>
      <Field label="Output Lirik">
        <PathInput
          value={getDeep(config, 'lyrics.outputFile', '')}
          onChange={v => updateConfig('lyrics.outputFile', v)}
          placeholder="Opsional: C:/hasil/lyrics.srt"
          kind="save"
          filter="lyrics"
        />
      </Field>
      <textarea
        className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-[11px] min-h-[72px] px-3 py-2 resize-y font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/50"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Tempel lirik polos atau LRC di sini. Auto align akan membagi timing mengikuti durasi audio."
      />
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={parseLyrics}
          disabled={busy}
          className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          Parse
        </button>
        <button
          onClick={autoAlign}
          disabled={busy}
          className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          Selaraskan
        </button>
        <button
          onClick={validateLyrics}
          disabled={busy}
          className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          Cek
        </button>
        <button
          onClick={() => exportLyrics(getDeep(config, 'lyrics.exportFormat', 'srt'))}
          disabled={busy || !parsed.length}
          className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          Ekspor
        </button>
      </div>
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
        <div className="p-3 bg-[var(--secondary-bg)] border-l-4 border-[var(--accent-warning)] rounded-[var(--radius-lg)]">
          <h4 className="text-[11px] font-bold text-[var(--accent-warning)] mb-2">⚠ Catatan lirik:</h4>
          <ul className="space-y-1.5">
            {validation.warnings.map((w: string, i: number) => (
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
      {validation?.quality && (
        <div className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
          <div className="space-y-3">
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] text-[var(--text-muted)] mb-1">Skor Kualitas</span>
              <span className="text-[14px] font-bold text-[var(--accent-primary)]">{validation.quality.score}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] text-[var(--text-muted)] mb-1">Beat Snap</span>
              <span className="text-[14px] font-bold text-[var(--text-primary)]">
                {validation.quality.metrics?.beats || validation.beats?.length || 0}
              </span>
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] text-[var(--text-muted)] mb-1">Baris</span>
              <span className="text-[14px] font-bold text-[var(--text-primary)]">
                {validation.quality.metrics?.lines || parsed.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
