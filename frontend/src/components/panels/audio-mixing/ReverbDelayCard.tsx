import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card, Callout, SliderControl } from '../../ui/design-system-components';
import type { AudioMixingCardProps } from './types';

export function ReverbDelayCard({ config, updateConfig }: AudioMixingCardProps) {
  return (
    <Card title="Reverb & Delay Effects">
      <Check
        label="Enable Reverb"
        checked={Boolean(getDeep(config, 'audio.reverb', false))}
        onChange={v => updateConfig('audio.reverb', v)}
      />
      <SliderControl
        label="Reverb Amount"
        value={Number(getDeep(config, 'audio.reverbAmount', 20))}
        onChange={v => updateConfig('audio.reverbAmount', v)}
        min={0}
        max={100}
      />
      <div className="space-y-3">
        <Field label="Reverb Type">
          <SelectInput
            value={getDeep(config, 'audio.reverbType', 'room')}
            onChange={v => updateConfig('audio.reverbType', v)}
          >
            <option value="room">Room</option>
            <option value="hall">Hall</option>
            <option value="plate">Plate</option>
            <option value="spring">Spring</option>
          </SelectInput>
        </Field>
        <Field label="Reverb Size">
          <SelectInput
            value={getDeep(config, 'audio.reverbSize', 'medium')}
            onChange={v => updateConfig('audio.reverbSize', v)}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </SelectInput>
        </Field>
      </div>
      <Check
        label="Enable Delay/Echo"
        checked={Boolean(getDeep(config, 'audio.delay', false))}
        onChange={v => updateConfig('audio.delay', v)}
      />
      <div className="space-y-3">
        <Field label="Delay Time (ms)">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.delayTime', 250)}
            onChange={v => updateConfig('audio.delayTime', v)}
            placeholder="50-2000"
          />
        </Field>
        <Field label="Feedback %">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.delayFeedback', 30)}
            onChange={v => updateConfig('audio.delayFeedback', v)}
            placeholder="0-90"
          />
        </Field>
        <Field label="Delay Mix %">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.delayMix', 25)}
            onChange={v => updateConfig('audio.delayMix', v)}
            placeholder="0-100"
          />
        </Field>
      </div>
      <Callout type="tip">
        Reverb menambah ruang & kedalaman. Delay menciptakan echo. Gunakan dengan hati-hati untuk hasil natural.
      </Callout>
    </Card>
  );
}
