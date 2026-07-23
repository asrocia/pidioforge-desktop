import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Callout, Card, SliderControl } from '../../ui/design-system-components';
import type { SpectrumCardProps } from './types';

export function ParticlesCard({ config, updateConfig }: SpectrumCardProps) {
  return (
    <Card title="Particle Effects">
      <Check
        label="Enable Particle Effects"
        checked={Boolean(getDeep(config, 'spectrum.particles.enabled', false))}
        onChange={v => updateConfig('spectrum.particles.enabled', v)}
      />
      <Field label="Particle Type">
        <SelectInput
          value={getDeep(config, 'spectrum.particles.type', 'confetti')}
          onChange={v => updateConfig('spectrum.particles.type', v)}
        >
          <option value="confetti">Confetti</option>
          <option value="sparkles">Sparkles</option>
          <option value="bubbles">Bubbles</option>
          <option value="notes">Music Notes</option>
          <option value="stars">Stars</option>
        </SelectInput>
      </Field>
      <Field label="Trigger">
        <SelectInput
          value={getDeep(config, 'spectrum.particles.trigger', 'beat')}
          onChange={v => updateConfig('spectrum.particles.trigger', v)}
        >
          <option value="beat">On Beat</option>
          <option value="continuous">Continuous</option>
          <option value="drop">On Drop</option>
        </SelectInput>
      </Field>
      <Field label="Density">
        <SelectInput
          value={getDeep(config, 'spectrum.particles.density', 'medium')}
          onChange={v => updateConfig('spectrum.particles.density', v)}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="extreme">Extreme</option>
        </SelectInput>
      </Field>
      <SliderControl
        label="Particle Size"
        value={Number(getDeep(config, 'spectrum.particles.size', 8))}
        onChange={v => updateConfig('spectrum.particles.size', v)}
        min={4}
        max={32}
      />
      <SliderControl
        label="Particle Speed"
        value={Number(getDeep(config, 'spectrum.particles.speed', 50))}
        onChange={v => updateConfig('spectrum.particles.speed', v)}
        min={10}
        max={100}
      />
      <SliderControl
        label="Lifetime (seconds)"
        value={Number(getDeep(config, 'spectrum.particles.lifetime', 3))}
        onChange={v => updateConfig('spectrum.particles.lifetime', v)}
        min={1}
        max={10}
      />
      <Field label="Particle Color 1">
        <TextInput
          value={getDeep(config, 'spectrum.particles.color1', '#ff6b6b')}
          onChange={v => updateConfig('spectrum.particles.color1', v)}
        />
      </Field>
      <Field label="Particle Color 2">
        <TextInput
          value={getDeep(config, 'spectrum.particles.color2', '#4ecdc4')}
          onChange={v => updateConfig('spectrum.particles.color2', v)}
        />
      </Field>
      <Check
        label="Rainbow Colors"
        checked={Boolean(getDeep(config, 'spectrum.particles.rainbow', false))}
        onChange={v => updateConfig('spectrum.particles.rainbow', v)}
      />
      <Check
        label="Gravity Effect"
        checked={Boolean(getDeep(config, 'spectrum.particles.gravity', true))}
        onChange={v => updateConfig('spectrum.particles.gravity', v)}
      />
      <Callout type="tip">
        Particle effects menambah energi visual. Gunakan "On Beat" untuk sinkronisasi dengan musik.
      </Callout>
    </Card>
  );
}
