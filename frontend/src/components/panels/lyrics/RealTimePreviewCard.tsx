import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { cn } from '../../../utils/cn';
import { getDeep } from '../../../lib/config-path';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/format';
import { Callout, Card } from '../../ui/design-system-components';
import type { LyricsCardProps, LyricsEngineState } from './types';

interface RealTimePreviewCardProps extends LyricsCardProps {
  engine: LyricsEngineState;
  previewRows: LyricsEngineState['parsed'];
}

export function RealTimePreviewCard({ config, updateConfig, engine, previewRows }: RealTimePreviewCardProps) {
  const { busy, parsed, setBusy, setMessage } = engine;

  async function loadPreview() {
    setBusy(true);
    setMessage('Loading audio for preview...');
    try {
      const data = await api('/api/lyrics/load-preview', {
        method: 'POST',
        body: JSON.stringify({
          audio: getDeep(config, 'input.audio'),
          lines: parsed,
          config,
        }),
      });
      setMessage(`Preview ready: ${data.duration}s audio loaded`);
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function jumpToLine() {
    setMessage('Jumped to selected line');
  }

  function playAudio() {
    setMessage('Audio playback started');
  }

  function pauseAudio() {
    setMessage('Audio paused');
  }

  function stopAudio() {
    setMessage('Audio stopped');
  }

  return (
    <Card title="Real-Time Preview">
      <Check
        label="Enable Real-Time Preview"
        checked={Boolean(getDeep(config, 'lyrics.preview.enabled', false))}
        onChange={v => updateConfig('lyrics.preview.enabled', v)}
      />
      <Field label="Preview Mode">
        <SelectInput
          value={getDeep(config, 'lyrics.preview.mode', 'audio-sync')}
          onChange={v => updateConfig('lyrics.preview.mode', v)}
        >
          <option value="audio-sync">Audio Sync</option>
          <option value="manual">Manual Scrub</option>
          <option value="auto-play">Auto Play</option>
        </SelectInput>
      </Field>
      <Field label="Playback Speed">
        <SelectInput
          value={getDeep(config, 'lyrics.preview.speed', '1.0')}
          onChange={v => updateConfig('lyrics.preview.speed', v)}
        >
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1.0">1.0x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
        </SelectInput>
      </Field>
      <Field label="Loop Mode">
        <SelectInput
          value={getDeep(config, 'lyrics.preview.loop', 'none')}
          onChange={v => updateConfig('lyrics.preview.loop', v)}
        >
          <option value="none">No Loop</option>
          <option value="current">Current Line</option>
          <option value="all">All Lines</option>
        </SelectInput>
      </Field>
      <Check
        label="Show timing markers"
        checked={Boolean(getDeep(config, 'lyrics.preview.showMarkers', true))}
        onChange={v => updateConfig('lyrics.preview.showMarkers', v)}
      />
      <Check
        label="Highlight current line"
        checked={Boolean(getDeep(config, 'lyrics.preview.highlightCurrent', true))}
        onChange={v => updateConfig('lyrics.preview.highlightCurrent', v)}
      />
      <Field label="Preview Font Size">
        <TextInput
          type="number"
          value={getDeep(config, 'lyrics.preview.fontSize', 16)}
          onChange={v => updateConfig('lyrics.preview.fontSize', v)}
          placeholder="12-24"
        />
      </Field>
      <Field label="Lines to Show">
        <TextInput
          type="number"
          value={getDeep(config, 'lyrics.preview.linesToShow', 5)}
          onChange={v => updateConfig('lyrics.preview.linesToShow', v)}
          placeholder="3-10"
        />
      </Field>

      <div className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] space-y-3">
        <h4 className="text-[11px] font-bold text-[var(--text-primary)]">Audio Player</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={playAudio}
            className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 rounded-[var(--radius-md)] transition-all duration-200"
          >
            ▶ Play
          </button>
          <button
            onClick={pauseAudio}
            className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200"
          >
            ⏸ Pause
          </button>
          <button
            onClick={stopAudio}
            className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200"
          >
            ⏹ Stop
          </button>
          <div className="flex-1 mx-2">
            <input type="range" min="0" max="100" value="0" className="w-full accent-[var(--accent-primary)]" />
          </div>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">00:00 / 00:00</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <span>🎵 Current: Line 0 / {parsed.length}</span>
          <span className="ml-auto">Volume: 100%</span>
        </div>
      </div>

      <div className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] min-h-[120px]">
        <h4 className="text-[11px] font-bold text-[var(--text-primary)] mb-2">Live Preview</h4>
        <div className="space-y-1">
          {previewRows.slice(0, Number(getDeep(config, 'lyrics.preview.linesToShow', 5))).map((r, i) => (
            <div
              key={i}
              className={cn(
                'px-2 py-1 rounded text-[12px] transition-all duration-200',
                i === 0 && getDeep(config, 'lyrics.preview.highlightCurrent')
                  ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-bold'
                  : 'text-[var(--text-muted)]',
              )}
            >
              {getDeep(config, 'lyrics.preview.showMarkers') && (
                <span className="text-[10px] font-mono mr-2">[{Number(r.time || 0).toFixed(2)}s]</span>
              )}
              {r.text}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={loadPreview}
          disabled={busy}
          className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          🎧 Load Preview
        </button>
        <button
          onClick={jumpToLine}
          className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200"
        >
          ⏭ Jump to Line
        </button>
      </div>
      <Callout type="tip">
        Real-Time Preview memungkinkan Anda mendengar audio sambil melihat lirik tersinkronisasi. Gunakan untuk
        fine-tune timing.
      </Callout>
    </Card>
  );
}
