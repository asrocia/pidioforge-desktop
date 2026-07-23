import { Field, Check } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card, SliderControl } from '../../ui/design-system-components';
import { PathInput } from '../../ui/PathInput';
import type { AudioMixingCardProps } from './types';

export function AmbientVoiceCard({ config, updateConfig }: AudioMixingCardProps) {
  return (
    <Card title="Ambient, Voice & FX">
      <Check
        label="ASM Mode (Ambient/BGM Loop)"
        checked={Boolean(getDeep(config, 'audio.asmMode', false))}
        onChange={v => updateConfig('audio.asmMode', v)}
      />
      <Field label="File Ambient">
        <PathInput
          value={getDeep(config, 'audio.ambientLoop', '')}
          onChange={v => updateConfig('audio.ambientLoop', v)}
          placeholder="C:/audio/ambient.mp3"
          filter="audio"
        />
      </Field>
      <SliderControl
        label="Vol Ambient"
        value={Number(getDeep(config, 'audio.ambientVolume', 15))}
        onChange={v => updateConfig('audio.ambientVolume', v)}
        min={0}
        max={100}
      />
      <Field label="Voice Track">
        <PathInput
          value={getDeep(config, 'audio.voiceTrack', '')}
          onChange={v => updateConfig('audio.voiceTrack', v)}
          filter="audio"
        />
      </Field>
      <SliderControl
        label="Volume Voice"
        value={Number(getDeep(config, 'audio.voiceVolume', 100))}
        onChange={v => updateConfig('audio.voiceVolume', v)}
        min={0}
        max={150}
      />
      <Field label="Effect Track">
        <PathInput
          value={getDeep(config, 'audio.effectTrack', '')}
          onChange={v => updateConfig('audio.effectTrack', v)}
          filter="audio"
        />
      </Field>
      <SliderControl
        label="Volume Efek"
        value={Number(getDeep(config, 'audio.effectVolume', 80))}
        onChange={v => updateConfig('audio.effectVolume', v)}
        min={0}
        max={150}
      />
    </Card>
  );
}
