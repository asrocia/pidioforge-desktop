import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { PathInput } from '../../ui/PathInput';
import { getDeep } from '../../../lib/config-path';
import { Card, Collapsible } from '../../ui/design-system-components';
import type { TargetCardProps, TargetEngineState } from './types';

interface InputCardProps extends TargetCardProps {
  engine: TargetEngineState;
}

export function InputCard({ config, updateConfig, engine }: InputCardProps) {
  const { batchOpen, setBatchOpen } = engine;

  return (
    <>
      <Card title="Input Utama">
        <Field label="File Visual">
          <PathInput
            value={getDeep(config, 'input.visual')}
            onChange={v => updateConfig('input.visual', v)}
            filter="visual"
          />
        </Field>
        <Field label="File Audio">
          <PathInput
            value={getDeep(config, 'input.audio')}
            onChange={v => updateConfig('input.audio', v)}
            filter="audio"
          />
        </Field>
        <Field label="Judul Default">
          <TextInput
            value={getDeep(config, 'input.title')}
            onChange={v => updateConfig('input.title', v)}
            placeholder="Judul video"
          />
        </Field>
        <Field label="Output Folder">
          <PathInput
            value={getDeep(config, 'input.output')}
            onChange={v => updateConfig('input.output', v)}
            placeholder="Hasil"
            kind="directory"
          />
        </Field>
      </Card>

      <Collapsible title="Batch Folder" open={batchOpen} onToggle={() => setBatchOpen(!batchOpen)}>
        <div className="space-y-3">
          <Field label="Folder Utama">
            <PathInput
              value={getDeep(config, 'input.bahanFolder')}
              onChange={v => updateConfig('input.bahanFolder', v)}
              placeholder="D:/Bahan Video Musik"
              kind="directory"
            />
          </Field>
          <Field label="Folder Visual">
            <PathInput
              value={getDeep(config, 'input.visualFolder')}
              onChange={v => updateConfig('input.visualFolder', v)}
              placeholder="Opsional: folder video/gambar"
              kind="directory"
            />
          </Field>
          <Field label="Folder Audio">
            <PathInput
              value={getDeep(config, 'input.audioFolder')}
              onChange={v => updateConfig('input.audioFolder', v)}
              placeholder="Opsional: folder mp3/wav"
              kind="directory"
            />
          </Field>
          <Field label="Folder Lirik">
            <PathInput
              value={getDeep(config, 'input.lyricFolder')}
              onChange={v => updateConfig('input.lyricFolder', v)}
              placeholder="Opsional: folder .lrc/.srt"
              kind="directory"
            />
          </Field>
          <Field label="Pair Mode">
            <SelectInput
              value={getDeep(config, 'input.pairMode', 'by-name')}
              onChange={v => updateConfig('input.pairMode', v)}
            >
              <option value="by-name">Nama/Fuzzy</option>
              <option value="by-order">Urutan</option>
              <option value="random-visual">Visual acak/audio</option>
              <option value="one-audio-all-visual">1 audio semua visual</option>
            </SelectInput>
          </Field>
          <Field label="Ignore Words">
            <TextInput
              value={getDeep(config, 'input.ignoreWords', '')}
              onChange={v => updateConfig('input.ignoreWords', v)}
            />
          </Field>
          <Field label="Output Pattern">
            <TextInput
              value={getDeep(config, 'target.outputPattern', '{title}-{date}-{num}')}
              onChange={v => updateConfig('target.outputPattern', v)}
            />
          </Field>
          <Check
            label="Auto-pair berdasarkan nama/fuzzy"
            checked={Boolean(getDeep(config, 'input.autoPairByName', true))}
            onChange={v => updateConfig('input.autoPairByName', v)}
          />
          <Check
            label="Exclude folder output saat scan"
            checked={Boolean(getDeep(config, 'input.excludeOutputOnScan', true))}
            onChange={v => updateConfig('input.excludeOutputOnScan', v)}
          />
        </div>
      </Collapsible>
    </>
  );
}
