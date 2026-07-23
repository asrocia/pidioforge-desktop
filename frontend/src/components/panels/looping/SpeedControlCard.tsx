import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Callout, Card } from '../../ui/design-system-components';
import type { LoopingCardProps } from './types';

export function SpeedControlCard({ config, updateConfig }: LoopingCardProps) {
  return (
    <Card title="Speed Control & Time Remapping">
      <Check
        label="Enable Speed Ramping"
        checked={Boolean(getDeep(config, 'loop.speedRamping', false))}
        onChange={v => updateConfig('loop.speedRamping', v)}
      />
      <Field label="Speed Mode">
        <SelectInput
          value={getDeep(config, 'loop.speedMode', 'constant')}
          onChange={v => updateConfig('loop.speedMode', v)}
        >
          <option value="constant">Constant</option>
          <option value="ease-in">Ease In</option>
          <option value="ease-out">Ease Out</option>
          <option value="ease-in-out">Ease In-Out</option>
          <option value="custom">Custom Curve</option>
        </SelectInput>
      </Field>
      <Field label="Speed Multiplier">
        <TextInput
          type="number"
          value={getDeep(config, 'loop.speedMultiplier', 1.0)}
          onChange={v => updateConfig('loop.speedMultiplier', v)}
          placeholder="0.5-2.0"
        />
      </Field>
      <Field label="Transition Duration">
        <TextInput
          type="number"
          value={getDeep(config, 'loop.transitionDuration', 0.5)}
          onChange={v => updateConfig('loop.transitionDuration', v)}
          placeholder="seconds"
        />
      </Field>
      <Check
        label="Slow Motion at Loop Point"
        checked={Boolean(getDeep(config, 'loop.slowMotion', false))}
        onChange={v => updateConfig('loop.slowMotion', v)}
      />
      <Field label="Slow Motion Speed">
        <TextInput
          type="number"
          value={getDeep(config, 'loop.slowMotionSpeed', 0.5)}
          onChange={v => updateConfig('loop.slowMotionSpeed', v)}
          placeholder="0.1-0.9"
        />
      </Field>
      <Field label="Slow Motion Duration">
        <TextInput
          type="number"
          value={getDeep(config, 'loop.slowMotionDuration', 1.0)}
          onChange={v => updateConfig('loop.slowMotionDuration', v)}
          placeholder="seconds"
        />
      </Field>
      <Check
        label="Frame Blending (Smooth Slow-Mo)"
        checked={Boolean(getDeep(config, 'loop.frameBlending', true))}
        onChange={v => updateConfig('loop.frameBlending', v)}
      />
      <Callout type="tip">
        Speed ramping membuat transisi loop lebih halus dengan memperlambat atau mempercepat video di titik sambungan.
      </Callout>
    </Card>
  );
}
