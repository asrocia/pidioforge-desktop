import { Field, Check, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card, SliderControl } from '../../ui/design-system-components';
import type { AudioMixingCardProps } from './types';

export function BeatReactiveCard({ config, updateConfig }: AudioMixingCardProps) {
  return (
    <Card title="Beat & Reactive FX">
      <Check
        label="Beat detection nyata dari waveform"
        checked={Boolean(getDeep(config, 'audio.beatDetection', true))}
        onChange={v => updateConfig('audio.beatDetection', v)}
      />
      <Field label="Reactive FX">
        <SelectInput
          value={getDeep(config, 'audio.reactiveFx', 'Beat Flash')}
          onChange={v => updateConfig('audio.reactiveFx', v)}
        >
          <option>Beat Flash</option>
          <option>Logo Pulse</option>
          <option>Background Jedug</option>
          <option>Mati</option>
        </SelectInput>
      </Field>
      <SliderControl
        label="Strength"
        value={Number(getDeep(config, 'audio.reactiveStrength', 40))}
        onChange={v => updateConfig('audio.reactiveStrength', v)}
        min={0}
        max={100}
      />
      <Field label="Warna Flash">
        <SelectInput
          value={getDeep(config, 'audio.beatFlashColor', 'white')}
          onChange={v => updateConfig('audio.beatFlashColor', v)}
        >
          <option>white</option>
          <option>red</option>
          <option>blue</option>
          <option>yellow</option>
          <option>cyan</option>
        </SelectInput>
      </Field>
    </Card>
  );
}
