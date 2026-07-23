import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card } from '../../ui/design-system-components';
import type { LyricsCardProps } from './types';

export function TimingOutputCard({ config, updateConfig }: LyricsCardProps) {
  return (
    <Card title="Timing & Output">
      <Field label="Format Output">
        <SelectInput
          value={getDeep(config, 'lyrics.exportFormat', 'srt')}
          onChange={v => updateConfig('lyrics.exportFormat', v)}
        >
          <option value="srt">SRT</option>
          <option value="lrc">LRC</option>
          <option value="vtt">VTT</option>
        </SelectInput>
      </Field>
      <Field label="Durasi Baris">
        <TextInput
          type="number"
          value={getDeep(config, 'lyrics.lineDuration', 3)}
          onChange={v => updateConfig('lyrics.lineDuration', v)}
        />
      </Field>
      <Field label="Offset Detik">
        <TextInput
          type="number"
          value={getDeep(config, 'lyrics.offset', 0)}
          onChange={v => updateConfig('lyrics.offset', v)}
        />
      </Field>
      <Field label="Lead In">
        <TextInput
          type="number"
          value={getDeep(config, 'lyrics.leadIn', 0.15)}
          onChange={v => updateConfig('lyrics.leadIn', v)}
        />
      </Field>
      <Field label="Maks Karakter">
        <TextInput
          type="number"
          value={getDeep(config, 'lyrics.maxChars', 42)}
          onChange={v => updateConfig('lyrics.maxChars', v)}
        />
      </Field>
      <Field label="Model">
        <SelectInput value={getDeep(config, 'lyrics.model', 'Cepat')} onChange={v => updateConfig('lyrics.model', v)}>
          <option>Cepat</option>
          <option>Akurat</option>
          <option>Karaoke</option>
        </SelectInput>
      </Field>
      <Field label="Durasi Min">
        <TextInput
          type="number"
          value={getDeep(config, 'lyrics.minLineDuration', 1.1)}
          onChange={v => updateConfig('lyrics.minLineDuration', v)}
        />
      </Field>
      <Field label="Durasi Maks">
        <TextInput
          type="number"
          value={getDeep(config, 'lyrics.maxLineDuration', 5)}
          onChange={v => updateConfig('lyrics.maxLineDuration', v)}
        />
      </Field>
      <Field label="Batas Kualitas">
        <TextInput
          type="number"
          value={getDeep(config, 'lyrics.qualityGate', 82)}
          onChange={v => updateConfig('lyrics.qualityGate', v)}
        />
      </Field>
      <Check
        label="Smart timing berbobot"
        checked={Boolean(getDeep(config, 'lyrics.smartTiming', true))}
        onChange={v => updateConfig('lyrics.smartTiming', v)}
      />
      <Check
        label="Beat snap"
        checked={Boolean(getDeep(config, 'lyrics.beatSnap', true))}
        onChange={v => updateConfig('lyrics.beatSnap', v)}
      />
      <Field label="Jendela Snap">
        <TextInput
          type="number"
          value={getDeep(config, 'lyrics.beatSnapWindow', 0.22)}
          onChange={v => updateConfig('lyrics.beatSnapWindow', v)}
        />
      </Field>
      <Check
        label="Auto save hasil export"
        checked={Boolean(getDeep(config, 'lyrics.autoSave', true))}
        onChange={v => updateConfig('lyrics.autoSave', v)}
      />
    </Card>
  );
}
