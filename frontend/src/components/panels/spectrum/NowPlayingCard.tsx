import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Callout, Card, SliderControl } from '../../ui/design-system-components';
import type { SpectrumCardProps, SpectrumEngineState } from './types';

interface NowPlayingCardProps extends SpectrumCardProps {
  engine: SpectrumEngineState;
}

export function NowPlayingCard({ config, updateConfig, engine }: NowPlayingCardProps) {
  const { npX, npY } = engine;

  return (
    <Card title="Info Lagu">
      <Check
        label="Now Playing"
        checked={Boolean(getDeep(config, 'spectrum.nowPlaying', true))}
        onChange={v => updateConfig('spectrum.nowPlaying', v)}
      />
      <Field label="Template">
        <TextInput
          value={getDeep(config, 'spectrum.nowPlayingTemplate', '{title}')}
          onChange={v => updateConfig('spectrum.nowPlayingTemplate', v)}
        />
      </Field>
      <Field label="Posisi">
        <SelectInput
          value={getDeep(config, 'spectrum.nowPlayingPosition', 'Atas')}
          onChange={v => updateConfig('spectrum.nowPlayingPosition', v)}
        >
          <option>Atas</option>
          <option>Tengah</option>
          <option>Bawah</option>
        </SelectInput>
      </Field>
      <Field label="Ukuran Font">
        <TextInput
          type="number"
          value={getDeep(config, 'spectrum.nowPlayingFontSize', 26)}
          onChange={v => updateConfig('spectrum.nowPlayingFontSize', v)}
        />
      </Field>

      <div className="mt-3 p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] space-y-3">
        <h4 className="text-[11px] font-bold text-[var(--text-primary)]">Text Effects</h4>
        <Field label="Font Family">
          <SelectInput
            value={getDeep(config, 'spectrum.nowPlayingFont', 'Inter')}
            onChange={v => updateConfig('spectrum.nowPlayingFont', v)}
          >
            <option value="Inter">Inter (Default)</option>
            <option value="Arial">Arial</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Verdana">Verdana</option>
            <option value="Impact">Impact</option>
            <option value="Comic Sans MS">Comic Sans MS</option>
            <option value="Trebuchet MS">Trebuchet MS</option>
          </SelectInput>
        </Field>
        <Field label="Font Weight">
          <SelectInput
            value={getDeep(config, 'spectrum.nowPlayingFontWeight', 'bold')}
            onChange={v => updateConfig('spectrum.nowPlayingFontWeight', v)}
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
            <option value="bolder">Bolder</option>
            <option value="lighter">Lighter</option>
          </SelectInput>
        </Field>
        <Field label="Text Transform">
          <SelectInput
            value={getDeep(config, 'spectrum.nowPlayingTransform', 'none')}
            onChange={v => updateConfig('spectrum.nowPlayingTransform', v)}
          >
            <option value="none">None</option>
            <option value="uppercase">UPPERCASE</option>
            <option value="lowercase">lowercase</option>
            <option value="capitalize">Capitalize</option>
          </SelectInput>
        </Field>
        <Check
          label="Text Shadow"
          checked={Boolean(getDeep(config, 'spectrum.nowPlayingShadow', true))}
          onChange={v => updateConfig('spectrum.nowPlayingShadow', v)}
        />
        <SliderControl
          label="Shadow Blur"
          value={Number(getDeep(config, 'spectrum.nowPlayingShadowBlur', 4))}
          onChange={v => updateConfig('spectrum.nowPlayingShadowBlur', v)}
          min={0}
          max={20}
        />
        <Check
          label="Text Outline"
          checked={Boolean(getDeep(config, 'spectrum.nowPlayingOutline', false))}
          onChange={v => updateConfig('spectrum.nowPlayingOutline', v)}
        />
        <Field label="Outline Color">
          <TextInput
            value={getDeep(config, 'spectrum.nowPlayingOutlineColor', '#000000')}
            onChange={v => updateConfig('spectrum.nowPlayingOutlineColor', v)}
          />
        </Field>
        <Field label="Outline Width">
          <TextInput
            type="number"
            value={getDeep(config, 'spectrum.nowPlayingOutlineWidth', 2)}
            onChange={v => updateConfig('spectrum.nowPlayingOutlineWidth', v)}
            placeholder="1-5"
          />
        </Field>
        <Check
          label="Text Glow"
          checked={Boolean(getDeep(config, 'spectrum.nowPlayingGlow', false))}
          onChange={v => updateConfig('spectrum.nowPlayingGlow', v)}
        />
        <Field label="Glow Color">
          <TextInput
            value={getDeep(config, 'spectrum.nowPlayingGlowColor', '#ffffff')}
            onChange={v => updateConfig('spectrum.nowPlayingGlowColor', v)}
          />
        </Field>
        <Field label="Glow Strength">
          <TextInput
            type="number"
            value={getDeep(config, 'spectrum.nowPlayingGlowStrength', 10)}
            onChange={v => updateConfig('spectrum.nowPlayingGlowStrength', v)}
            placeholder="5-30"
          />
        </Field>
        <Check
          label="Beat Reactive Text"
          checked={Boolean(getDeep(config, 'spectrum.nowPlayingBeatReactive', false))}
          onChange={v => updateConfig('spectrum.nowPlayingBeatReactive', v)}
        />
        <Field label="Text Animation">
          <SelectInput
            value={getDeep(config, 'spectrum.nowPlayingAnimation', 'none')}
            onChange={v => updateConfig('spectrum.nowPlayingAnimation', v)}
          >
            <option value="none">None</option>
            <option value="fade">Fade In</option>
            <option value="slide">Slide In</option>
            <option value="bounce">Bounce</option>
            <option value="typewriter">Typewriter</option>
            <option value="pulse">Pulse</option>
          </SelectInput>
        </Field>
      </div>
      <Field label="Posisi X">
        <TextInput
          type="number"
          value={npX}
          onChange={v => updateConfig('spectrum.nowPlayingX', Math.max(4, Math.min(96, Number(v || 50))))}
        />
      </Field>
      <Field label="Posisi Y">
        <TextInput
          type="number"
          value={npY}
          onChange={v => updateConfig('spectrum.nowPlayingY', Math.max(6, Math.min(94, Number(v || 14))))}
        />
      </Field>
      <Field label="Edit Cepat">
        <input
          readOnly
          className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-muted)] text-[11px] min-h-[26px] px-2 py-1"
          value="klik teks di preview"
        />
      </Field>
      <Field label="Artis">
        <TextInput
          value={getDeep(config, 'spectrum.nowPlayingArtist', '')}
          onChange={v => updateConfig('spectrum.nowPlayingArtist', v)}
        />
      </Field>
      <Field label="Album">
        <TextInput
          value={getDeep(config, 'spectrum.nowPlayingAlbum', '')}
          onChange={v => updateConfig('spectrum.nowPlayingAlbum', v)}
        />
      </Field>
      <Field label="Warna">
        <TextInput
          value={getDeep(config, 'spectrum.nowPlayingColor', '#ffffff')}
          onChange={v => updateConfig('spectrum.nowPlayingColor', v)}
        />
      </Field>
      <Check
        label="Auto ambil judul dari nama file jika kosong"
        checked={Boolean(getDeep(config, 'spectrum.nowPlayingAutoFromFile', true))}
        onChange={v => updateConfig('spectrum.nowPlayingAutoFromFile', v)}
      />
      <Callout type="tip">
        Variable template: {'{title}'}, {'{artist}'}, {'{album}'}, {'{filename}'}
      </Callout>
    </Card>
  );
}
