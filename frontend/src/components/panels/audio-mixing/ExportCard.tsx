import { Field, Check, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card, Callout } from '../../ui/design-system-components';
import type { AudioMixingCardProps } from './types';

export function ExportCard({ config, updateConfig }: AudioMixingCardProps) {
  return (
    <Card title="Audio Export Options">
      <Check
        label="Export Audio Only (tanpa video)"
        checked={Boolean(getDeep(config, 'audio.exportAudioOnly', false))}
        onChange={v => updateConfig('audio.exportAudioOnly', v)}
      />
      <div className="space-y-3">
        <Field label="Export Format">
          <SelectInput
            value={getDeep(config, 'audio.exportFormat', 'mp3')}
            onChange={v => updateConfig('audio.exportFormat', v)}
          >
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="flac">FLAC</option>
            <option value="m4a">M4A/AAC</option>
            <option value="ogg">OGG Vorbis</option>
          </SelectInput>
        </Field>
        <Field label="Export Quality">
          <SelectInput
            value={getDeep(config, 'audio.exportQuality', 'high')}
            onChange={v => updateConfig('audio.exportQuality', v)}
          >
            <option value="low">Low (128k)</option>
            <option value="medium">Medium (192k)</option>
            <option value="high">High (256k)</option>
            <option value="highest">Highest (320k)</option>
          </SelectInput>
        </Field>
      </div>
      <Callout type="tip">
        Export audio only untuk mendapatkan file audio terpisah tanpa video. Berguna untuk podcast atau musik.
      </Callout>
    </Card>
  );
}
