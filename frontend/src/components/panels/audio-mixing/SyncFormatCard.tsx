import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card, Callout } from '../../ui/design-system-components';
import type { AudioMixingCardProps } from './types';

export function SyncFormatCard({ config, updateConfig }: AudioMixingCardProps) {
  return (
    <Card title="Audio Sync & Format">
      <div className="space-y-3">
        <Field label="Audio Offset (ms)">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.syncOffset', 0)}
            onChange={v => updateConfig('audio.syncOffset', v)}
            placeholder="-100 cepat, +100 delay"
          />
        </Field>
        <Field label="Trim Start (detik)">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.trimStart', 0)}
            onChange={v => updateConfig('audio.trimStart', v)}
            placeholder="0"
          />
        </Field>
        <Field label="Trim End (detik)">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.trimEnd', 0)}
            onChange={v => updateConfig('audio.trimEnd', v)}
            placeholder="0"
          />
        </Field>
      </div>
      <div className="space-y-3">
        <Field label="Sample Rate">
          <SelectInput
            value={getDeep(config, 'audio.sampleRate', '48000')}
            onChange={v => updateConfig('audio.sampleRate', v)}
          >
            <option value="44100">44.1 kHz (CD)</option>
            <option value="48000">48 kHz (Standard)</option>
            <option value="96000">96 kHz (Hi-Res)</option>
          </SelectInput>
        </Field>
        <Field label="Audio Codec">
          <SelectInput value={getDeep(config, 'audio.codec', 'aac')} onChange={v => updateConfig('audio.codec', v)}>
            <option value="aac">AAC (Recommended)</option>
            <option value="mp3">MP3 (Compatible)</option>
            <option value="opus">Opus (Efficient)</option>
            <option value="flac">FLAC (Lossless)</option>
          </SelectInput>
        </Field>
        <Field label="Stereo Width">
          <TextInput
            type="number"
            value={getDeep(config, 'audio.stereoWidth', 100)}
            onChange={v => updateConfig('audio.stereoWidth', v)}
            placeholder="0-200%"
          />
        </Field>
      </div>
      <Check
        label="Mono Compatibility Check"
        checked={Boolean(getDeep(config, 'audio.monoCheck', false))}
        onChange={v => updateConfig('audio.monoCheck', v)}
      />
      <Callout type="tip">
        Gunakan offset untuk sinkronisasi audio-video. Stereo width: 0=Mono, 100=Normal, 200=Wide
      </Callout>
    </Card>
  );
}
