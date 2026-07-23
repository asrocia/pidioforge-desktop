import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card, SliderControl } from '../../ui/design-system-components';
import type { LyricsCardProps, LyricsEngineState } from './types';

interface StyleCardProps extends LyricsCardProps {
  engine: LyricsEngineState;
}

export function StyleCard({ config, updateConfig, engine }: StyleCardProps) {
  return (
    <Card title="Style Lirik">
      <Field label="Preset Gaya">
        <SelectInput value={getDeep(config, 'lyrics.stylePreset', 'modern')} onChange={engine.applyLyricPreset}>
          <option value="modern">Modern Clean</option>
          <option value="karaoke">Karaoke Highlight</option>
          <option value="shorts-bold">Shorts Bold</option>
          <option value="minimal">Minimal Subtitle</option>
        </SelectInput>
      </Field>
      <Field label="Font">
        <TextInput value={getDeep(config, 'lyrics.font', 'Arial')} onChange={v => updateConfig('lyrics.font', v)} />
      </Field>
      <Field label="Posisi">
        <SelectInput
          value={getDeep(config, 'lyrics.position', 'Bawah')}
          onChange={v => updateConfig('lyrics.position', v)}
        >
          <option>Bawah</option>
          <option>Tengah</option>
          <option>Atas</option>
        </SelectInput>
      </Field>
      <Field label="Perataan">
        <SelectInput
          value={getDeep(config, 'lyrics.align', 'Rata Tengah')}
          onChange={v => updateConfig('lyrics.align', v)}
        >
          <option>Rata Tengah</option>
          <option>Rata Kiri</option>
          <option>Rata Kanan</option>
        </SelectInput>
      </Field>
      <Field label="Warna">
        <TextInput value={getDeep(config, 'lyrics.color', '#ffffff')} onChange={v => updateConfig('lyrics.color', v)} />
      </Field>
      <Field label="Warna Highlight">
        <TextInput
          value={getDeep(config, 'lyrics.highlightColor', '#22c55e')}
          onChange={v => updateConfig('lyrics.highlightColor', v)}
        />
      </Field>
      <SliderControl
        label="Skala"
        value={Number(getDeep(config, 'lyrics.scale', 28))}
        onChange={v => updateConfig('lyrics.scale', v)}
        min={16}
        max={60}
      />
      <SliderControl
        label="Outline"
        value={Number(getDeep(config, 'lyrics.outline', 2))}
        onChange={v => updateConfig('lyrics.outline', v)}
        min={0}
        max={6}
      />
      <SliderControl
        label="Shadow"
        value={Number(getDeep(config, 'lyrics.shadow', 1))}
        onChange={v => updateConfig('lyrics.shadow', v)}
        min={0}
        max={5}
      />
      <Check
        label="Karaoke"
        checked={Boolean(getDeep(config, 'lyrics.karaoke', false))}
        onChange={v => updateConfig('lyrics.karaoke', v)}
      />
      <Check
        label="Word-by-word"
        checked={Boolean(getDeep(config, 'lyrics.wordByWord', false))}
        onChange={v => updateConfig('lyrics.wordByWord', v)}
      />
      <Check
        label="Uppercase"
        checked={Boolean(getDeep(config, 'lyrics.uppercase', false))}
        onChange={v => updateConfig('lyrics.uppercase', v)}
      />
      <Check
        label="Area Aman subtitle"
        checked={Boolean(getDeep(config, 'lyrics.safeArea', true))}
        onChange={v => updateConfig('lyrics.safeArea', v)}
      />
    </Card>
  );
}
