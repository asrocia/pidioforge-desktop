import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Callout, Card } from '../../ui/design-system-components';
import type { LoopingCardProps } from './types';

export function AudioSyncCard({ config, updateConfig }: LoopingCardProps) {
  return (
    <Card title="Audio Sync & Beat Matching">
      <Check
        label="Enable Audio Sync"
        checked={Boolean(getDeep(config, 'loop.audioSync', false))}
        onChange={v => updateConfig('loop.audioSync', v)}
      />
      <Field label="Sync Mode">
        <SelectInput
          value={getDeep(config, 'loop.audioSyncMode', 'beat')}
          onChange={v => updateConfig('loop.audioSyncMode', v)}
        >
          <option value="beat">Beat Detection</option>
          <option value="bar">Bar/Measure</option>
          <option value="phrase">Phrase</option>
          <option value="manual">Manual BPM</option>
        </SelectInput>
      </Field>
      <Field label="BPM (Manual)">
        <TextInput
          type="number"
          value={getDeep(config, 'loop.bpm', 120)}
          onChange={v => updateConfig('loop.bpm', v)}
          placeholder="60-200"
        />
      </Field>
      <Field label="Beat Offset">
        <TextInput
          type="number"
          value={getDeep(config, 'loop.beatOffset', 0)}
          onChange={v => updateConfig('loop.beatOffset', v)}
          placeholder="ms"
        />
      </Field>
      <Check
        label="Snap Loop to Beat Grid"
        checked={Boolean(getDeep(config, 'loop.snapToBeat', true))}
        onChange={v => updateConfig('loop.snapToBeat', v)}
      />
      <Check
        label="Quantize Loop Duration"
        checked={Boolean(getDeep(config, 'loop.quantizeDuration', false))}
        onChange={v => updateConfig('loop.quantizeDuration', v)}
      />
      <Field label="Audio Fade In">
        <TextInput
          type="number"
          value={getDeep(config, 'loop.audioFadeIn', 0.1)}
          onChange={v => updateConfig('loop.audioFadeIn', v)}
          placeholder="seconds"
        />
      </Field>
      <Field label="Audio Fade Out">
        <TextInput
          type="number"
          value={getDeep(config, 'loop.audioFadeOut', 0.1)}
          onChange={v => updateConfig('loop.audioFadeOut', v)}
          placeholder="seconds"
        />
      </Field>
      <Callout type="tip">
        Audio sync memastikan loop point selaras dengan beat musik untuk hasil yang lebih natural dan musikal.
      </Callout>
    </Card>
  );
}
