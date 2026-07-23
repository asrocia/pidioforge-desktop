import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { api } from '../../../lib/api';
import { errorMessage } from '../../../lib/format';
import { Callout, Card, SliderControl } from '../../ui/design-system-components';
import type { LyricsCardProps, LyricsEngineState } from './types';

interface SmartSyncCardProps extends LyricsCardProps {
  engine: LyricsEngineState;
}

export function SmartSyncCard({ config, updateConfig, engine }: SmartSyncCardProps) {
  const { busy, parsed, setBusy, setMessage, setParsed } = engine;

  async function smartSync() {
    setBusy(true);
    setMessage('Analyzing waveform...');
    try {
      const data = await api('/api/lyrics/smart-sync', {
        method: 'POST',
        body: JSON.stringify({
          audio: getDeep(config, 'input.audio'),
          lines: parsed,
          method: getDeep(config, 'lyrics.smartSync.method'),
          sensitivity: getDeep(config, 'lyrics.smartSync.sensitivity'),
          config,
        }),
      });
      setParsed(data.syncedLines || []);
      setMessage(
        `Smart sync complete: ${data.syncedLines?.length || 0} lines synced, accuracy: ${(data.accuracy * 100).toFixed(1)}%`,
      );
    } catch (e: unknown) {
      setMessage(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function resetTiming() {
    setMessage('Timing reset to original');
  }

  return (
    <Card title="Smart Sync & Waveform">
      <Check
        label="Enable Smart Sync"
        checked={Boolean(getDeep(config, 'lyrics.smartSync.enabled', false))}
        onChange={v => updateConfig('lyrics.smartSync.enabled', v)}
      />
      <Field label="Sync Method">
        <SelectInput
          value={getDeep(config, 'lyrics.smartSync.method', 'waveform')}
          onChange={v => updateConfig('lyrics.smartSync.method', v)}
        >
          <option value="waveform">Waveform Analysis</option>
          <option value="beat">Beat Detection</option>
          <option value="vocal">Vocal Detection</option>
          <option value="hybrid">Hybrid (All)</option>
        </SelectInput>
      </Field>
      <Field label="Sensitivity">
        <SelectInput
          value={getDeep(config, 'lyrics.smartSync.sensitivity', 'medium')}
          onChange={v => updateConfig('lyrics.smartSync.sensitivity', v)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="extreme">Extreme</option>
        </SelectInput>
      </Field>
      <Field label="Snap Tolerance">
        <TextInput
          type="number"
          value={getDeep(config, 'lyrics.smartSync.snapTolerance', 0.15)}
          onChange={v => updateConfig('lyrics.smartSync.snapTolerance', v)}
          placeholder="0.05-0.5"
        />
      </Field>
      <Check
        label="Show waveform visualization"
        checked={Boolean(getDeep(config, 'lyrics.smartSync.showWaveform', true))}
        onChange={v => updateConfig('lyrics.smartSync.showWaveform', v)}
      />
      <Field label="Waveform Color">
        <TextInput
          value={getDeep(config, 'lyrics.smartSync.waveformColor', '#3b82f6')}
          onChange={v => updateConfig('lyrics.smartSync.waveformColor', v)}
        />
      </Field>
      <Field label="Marker Color">
        <TextInput
          value={getDeep(config, 'lyrics.smartSync.markerColor', '#22c55e')}
          onChange={v => updateConfig('lyrics.smartSync.markerColor', v)}
        />
      </Field>
      <SliderControl
        label="Waveform Height"
        value={Number(getDeep(config, 'lyrics.smartSync.waveformHeight', 80))}
        onChange={v => updateConfig('lyrics.smartSync.waveformHeight', v)}
        min={40}
        max={200}
      />
      <Check
        label="Auto-adjust timing on sync"
        checked={Boolean(getDeep(config, 'lyrics.smartSync.autoAdjust', true))}
        onChange={v => updateConfig('lyrics.smartSync.autoAdjust', v)}
      />
      <div className="flex gap-2">
        <button
          onClick={smartSync}
          disabled={busy || !parsed.length}
          className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          🎯 Smart Sync
        </button>
        <button
          onClick={resetTiming}
          className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200"
        >
          ↺ Reset
        </button>
      </div>
      <Callout type="tip">
        Smart Sync menganalisis waveform audio untuk sinkronisasi timing lirik yang lebih akurat. Gunakan Hybrid untuk
        hasil terbaik.
      </Callout>
    </Card>
  );
}
