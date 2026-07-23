import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Callout, Card, SliderControl } from '../../ui/design-system-components';
import { PathInput } from '../../ui/PathInput';
import type { SpectrumCardProps } from './types';

export function LogoOverlayCard({ config, updateConfig }: SpectrumCardProps) {
  return (
    <Card title="Logo/Watermark Overlay">
      <Check
        label="Enable Logo/Watermark"
        checked={Boolean(getDeep(config, 'spectrum.logo.enabled', false))}
        onChange={v => updateConfig('spectrum.logo.enabled', v)}
      />
      <Field label="Logo Image">
        <PathInput
          value={getDeep(config, 'spectrum.logo.image', '')}
          onChange={v => updateConfig('spectrum.logo.image', v)}
          placeholder="Pilih logo/watermark"
          filter="image"
        />
      </Field>
      <Field label="Position">
        <SelectInput
          value={getDeep(config, 'spectrum.logo.position', 'top-right')}
          onChange={v => updateConfig('spectrum.logo.position', v)}
        >
          <option value="top-left">Top Left</option>
          <option value="top-center">Top Center</option>
          <option value="top-right">Top Right</option>
          <option value="center">Center</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-center">Bottom Center</option>
          <option value="bottom-right">Bottom Right</option>
          <option value="custom">Custom (X/Y)</option>
        </SelectInput>
      </Field>
      <Field label="Size %">
        <TextInput
          type="number"
          value={getDeep(config, 'spectrum.logo.size', 15)}
          onChange={v => updateConfig('spectrum.logo.size', v)}
          placeholder="5-50"
        />
      </Field>
      <Field label="Opacity %">
        <TextInput
          type="number"
          value={getDeep(config, 'spectrum.logo.opacity', 80)}
          onChange={v => updateConfig('spectrum.logo.opacity', v)}
          placeholder="0-100"
        />
      </Field>
      <Field label="Custom X %">
        <TextInput
          type="number"
          value={getDeep(config, 'spectrum.logo.x', 85)}
          onChange={v => updateConfig('spectrum.logo.x', v)}
          placeholder="0-100"
        />
      </Field>
      <Field label="Custom Y %">
        <TextInput
          type="number"
          value={getDeep(config, 'spectrum.logo.y', 10)}
          onChange={v => updateConfig('spectrum.logo.y', v)}
          placeholder="0-100"
        />
      </Field>
      <Field label="Animation">
        <SelectInput
          value={getDeep(config, 'spectrum.logo.animation', 'none')}
          onChange={v => updateConfig('spectrum.logo.animation', v)}
        >
          <option value="none">None</option>
          <option value="fade">Fade In/Out</option>
          <option value="pulse">Pulse</option>
          <option value="bounce">Bounce</option>
          <option value="rotate">Rotate</option>
        </SelectInput>
      </Field>
      <SliderControl
        label="Padding (px)"
        value={Number(getDeep(config, 'spectrum.logo.padding', 20))}
        onChange={v => updateConfig('spectrum.logo.padding', v)}
        min={0}
        max={100}
      />
      <Check
        label="Beat Reactive"
        checked={Boolean(getDeep(config, 'spectrum.logo.beatReactive', false))}
        onChange={v => updateConfig('spectrum.logo.beatReactive', v)}
      />
      <Callout type="tip">
        Logo akan muncul di atas video. Gunakan PNG transparan untuk hasil terbaik. Drag di preview untuk posisi custom.
      </Callout>
    </Card>
  );
}
