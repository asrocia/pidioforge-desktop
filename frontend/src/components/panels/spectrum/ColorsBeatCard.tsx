import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card, SliderControl } from '../../ui/design-system-components';
import type { SpectrumCardProps, SpectrumEngineState } from './types';

interface ColorsBeatCardProps extends SpectrumCardProps {
  engine: SpectrumEngineState;
}

export function ColorsBeatCard({ config, updateConfig, engine }: ColorsBeatCardProps) {
  const { commitColors } = engine;

  return (
    <Card title="Warna & Reaksi Beat">
      <Field label="Color Mode">
        <SelectInput
          value={getDeep(config, 'spectrum.colorMode', 'static')}
          onChange={v => updateConfig('spectrum.colorMode', v)}
        >
          <option value="static">Static</option>
          <option value="gradient">Gradient</option>
          <option value="rainbow">Rainbow Cycle</option>
          <option value="beat-reactive">Beat Reactive</option>
          <option value="pulse">Pulse</option>
        </SelectInput>
      </Field>
      <Field label="Warna 1">
        <TextInput
          value={getDeep(config, 'spectrum.color1', 'white')}
          onChange={v => {
            updateConfig('spectrum.color1', v);
            setTimeout(commitColors, 0);
          }}
        />
      </Field>
      <Field label="Warna 2">
        <TextInput
          value={getDeep(config, 'spectrum.color2', '#22c55e')}
          onChange={v => {
            updateConfig('spectrum.color2', v);
            setTimeout(commitColors, 0);
          }}
        />
      </Field>
      <Field label="Warna Progress">
        <TextInput
          value={getDeep(config, 'spectrum.progressColor', 'white')}
          onChange={v => updateConfig('spectrum.progressColor', v)}
        />
      </Field>
      <Field label="Gradient Direction">
        <SelectInput
          value={getDeep(config, 'spectrum.gradientDirection', 'horizontal')}
          onChange={v => updateConfig('spectrum.gradientDirection', v)}
        >
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
          <option value="radial">Radial</option>
        </SelectInput>
      </Field>
      <Field label="Rainbow Speed">
        <TextInput
          type="number"
          value={getDeep(config, 'spectrum.rainbowSpeed', 2)}
          onChange={v => updateConfig('spectrum.rainbowSpeed', v)}
          placeholder="1-10"
        />
      </Field>
      <Check
        label="Glow beat reactive"
        checked={Boolean(getDeep(config, 'spectrum.glow', false))}
        onChange={v => updateConfig('spectrum.glow', v)}
      />
      <SliderControl
        label="Kekuatan Glow"
        value={Number(getDeep(config, 'spectrum.glowStrength', 35))}
        onChange={v => updateConfig('spectrum.glowStrength', v)}
        min={0}
        max={100}
      />
      <Check
        label="Beat Reactive"
        checked={Boolean(getDeep(config, 'spectrum.beatReactive', true))}
        onChange={v => updateConfig('spectrum.beatReactive', v)}
      />
      <SliderControl
        label="Sensitivitas Beat"
        value={Number(getDeep(config, 'spectrum.beatSensitivity', 55))}
        onChange={v => updateConfig('spectrum.beatSensitivity', v)}
        min={0}
        max={100}
      />
      <SliderControl
        label="Smoothing"
        value={Number(getDeep(config, 'spectrum.smoothing', 45))}
        onChange={v => updateConfig('spectrum.smoothing', v)}
        min={0}
        max={100}
      />
      <Field label="Penguatan">
        <TextInput
          type="number"
          value={getDeep(config, 'spectrum.gain', 1)}
          onChange={v => updateConfig('spectrum.gain', v)}
        />
      </Field>
    </Card>
  );
}
