import { Field, Check, TextInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card, SliderControl } from '../../ui/design-system-components';
import type { AudioMixingCardProps } from './types';

export function EqCard({ config, updateConfig }: AudioMixingCardProps) {
  return (
    <Card title="5-Band Parametric EQ">
      <SliderControl
        label="Sub Bass (20-60Hz)"
        value={Number(getDeep(config, 'audio.subBassGain', 0))}
        onChange={v => updateConfig('audio.subBassGain', v)}
        min={-12}
        max={12}
      />
      <SliderControl
        label="Bass (60-250Hz)"
        value={Number(getDeep(config, 'audio.bassGain', 0))}
        onChange={v => updateConfig('audio.bassGain', v)}
        min={-12}
        max={12}
      />
      <SliderControl
        label="Low Mid (250Hz-2kHz)"
        value={Number(getDeep(config, 'audio.lowMidGain', 0))}
        onChange={v => updateConfig('audio.lowMidGain', v)}
        min={-12}
        max={12}
      />
      <SliderControl
        label="High Mid (2k-6kHz)"
        value={Number(getDeep(config, 'audio.highMidGain', 0))}
        onChange={v => updateConfig('audio.highMidGain', v)}
        min={-12}
        max={12}
      />
      <SliderControl
        label="Treble (6k-20kHz)"
        value={Number(getDeep(config, 'audio.trebleGain', 0))}
        onChange={v => updateConfig('audio.trebleGain', v)}
        min={-12}
        max={12}
      />
      <SliderControl
        label="Pan L/R"
        value={Number(getDeep(config, 'audio.pan', 0))}
        onChange={v => updateConfig('audio.pan', v)}
        min={-100}
        max={100}
      />
      <div className="space-y-3">
        <Field label="High-pass Hz">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.highPass', 0)}
            onChange={v => updateConfig('audio.highPass', v)}
          />
        </Field>
        <Field label="Low-pass Hz">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.lowPass', 0)}
            onChange={v => updateConfig('audio.lowPass', v)}
          />
        </Field>
        <Field label="Noise Gate Threshold">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.noiseGateThreshold', -45)}
            onChange={v => updateConfig('audio.noiseGateThreshold', v)}
          />
        </Field>
      </div>
      <Check
        label="De-hum 50Hz ringan"
        checked={Boolean(getDeep(config, 'audio.deHum', false))}
        onChange={v => updateConfig('audio.deHum', v)}
      />
      <Check
        label="Noise gate"
        checked={Boolean(getDeep(config, 'audio.noiseGate', false))}
        onChange={v => updateConfig('audio.noiseGate', v)}
      />
      <Check
        label="Compressor"
        checked={Boolean(getDeep(config, 'audio.compressor', false))}
        onChange={v => updateConfig('audio.compressor', v)}
      />
      <div className="space-y-3">
        <Field label="Threshold (dB)">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.compressorThreshold', -18)}
            onChange={v => updateConfig('audio.compressorThreshold', v)}
          />
        </Field>
        <Field label="Ratio">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.compressorRatio', 3)}
            onChange={v => updateConfig('audio.compressorRatio', v)}
          />
        </Field>
        <Field label="Attack (ms)">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.compressorAttack', 5)}
            onChange={v => updateConfig('audio.compressorAttack', v)}
            placeholder="1-100"
          />
        </Field>
      </div>
      <div className="space-y-3">
        <Field label="Release (ms)">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.compressorRelease', 50)}
            onChange={v => updateConfig('audio.compressorRelease', v)}
            placeholder="10-1000"
          />
        </Field>
        <Field label="Knee (dB)">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.compressorKnee', 2)}
            onChange={v => updateConfig('audio.compressorKnee', v)}
            placeholder="0-10"
          />
        </Field>
        <Field label="Makeup Gain (dB)">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.compressorMakeup', 0)}
            onChange={v => updateConfig('audio.compressorMakeup', v)}
            placeholder="0-24"
          />
        </Field>
      </div>
      <div className="space-y-3">
        <Field label="Level Ducking %">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.duckingLevel', 35)}
            onChange={v => updateConfig('audio.duckingLevel', v)}
          />
        </Field>
      </div>
      <Check
        label="Auto duck saat CTA/voice muncul"
        checked={Boolean(getDeep(config, 'audio.autoDuck', false))}
        onChange={v => updateConfig('audio.autoDuck', v)}
      />
    </Card>
  );
}
