import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card, SliderControl } from '../../ui/design-system-components';
import type { AudioMixingCardProps } from './types';

export function VolumeCard({ config, updateConfig }: AudioMixingCardProps) {
  return (
    <Card title="Volume & Mastering">
      <SliderControl
        label="Volume Video"
        value={Number(getDeep(config, 'audio.videoVolume', 0))}
        onChange={v => updateConfig('audio.videoVolume', v)}
        min={0}
        max={150}
      />
      <SliderControl
        label="Volume Audio/BGM"
        value={Number(getDeep(config, 'audio.bgmVolume', 100))}
        onChange={v => updateConfig('audio.bgmVolume', v)}
        min={0}
        max={150}
      />
      <SliderControl
        label="Penguatan Master"
        value={Number(getDeep(config, 'audio.masterGain', 100))}
        onChange={v => updateConfig('audio.masterGain', v)}
        min={0}
        max={150}
      />
      <div className="space-y-3">
        <Field label="Bitrate Audio">
          <SelectInput
            value={getDeep(config, 'audio.audioBitrate', '192k')}
            onChange={v => updateConfig('audio.audioBitrate', v)}
          >
            <option>128k</option>
            <option>192k</option>
            <option>256k</option>
            <option>320k</option>
          </SelectInput>
        </Field>
        <Field label="Fade Masuk">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.fadeIn', 0.6)}
            onChange={v => updateConfig('audio.fadeIn', v)}
          />
        </Field>
        <Field label="Fade Keluar">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.fadeOut', 1.2)}
            onChange={v => updateConfig('audio.fadeOut', v)}
          />
        </Field>
      </div>
      <Check
        label="Normalize loudness (-14 LUFS)"
        checked={Boolean(getDeep(config, 'audio.normalize', true))}
        onChange={v => updateConfig('audio.normalize', v)}
      />
      <Check
        label="Limiter anti pecah"
        checked={Boolean(getDeep(config, 'audio.limiter', true))}
        onChange={v => updateConfig('audio.limiter', v)}
      />
    </Card>
  );
}
