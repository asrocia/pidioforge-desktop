import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { PathInput } from '../../ui/PathInput';
import { getDeep } from '../../../lib/config-path';
import { Callout, Card, SliderControl } from '../../ui/design-system-components';
import type { BrandingCardProps, BrandingEngineState } from './types';

interface BumperCardProps extends BrandingCardProps {
  engine: BrandingEngineState;
}

export function BumperCard({ config, updateConfig, engine }: BumperCardProps) {
  const { busy, previewBumper } = engine;

  return (
    <Card
      title="Bumper Video"
      action={
        <button
          onClick={previewBumper}
          disabled={busy || !getDeep(config, 'branding.bumperVideo')}
          className="px-3 py-1 text-[10px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          🎬 Preview
        </button>
      }
    >
      <Check
        label="Aktifkan bumper"
        checked={Boolean(getDeep(config, 'branding.bumperEnabled', false))}
        onChange={v => updateConfig('branding.bumperEnabled', v)}
      />
      <Field label="Template Bumper">
        <SelectInput
          value={getDeep(config, 'branding.bumperTemplate', 'custom')}
          onChange={v => {
            updateConfig('branding.bumperTemplate', v);
            if (v === 'minimal-fade') {
              updateConfig('branding.bumperTransition', 'fade');
              updateConfig('branding.bumperFadeDuration', 0.8);
              updateConfig('branding.bumperDuration', 2);
            }
            if (v === 'dynamic-wipe') {
              updateConfig('branding.bumperTransition', 'wipe');
              updateConfig('branding.bumperFadeDuration', 0.3);
              updateConfig('branding.bumperDuration', 3);
            }
            if (v === 'professional-dissolve') {
              updateConfig('branding.bumperTransition', 'dissolve');
              updateConfig('branding.bumperFadeDuration', 1.0);
              updateConfig('branding.bumperDuration', 4);
            }
          }}
        >
          <option value="custom">Custom</option>
          <option value="minimal-fade">Minimal Fade (2s)</option>
          <option value="dynamic-wipe">Dynamic Wipe (3s)</option>
          <option value="professional-dissolve">Professional Dissolve (4s)</option>
          <option value="energetic-zoom">Energetic Zoom (2.5s)</option>
          <option value="smooth-slide">Smooth Slide (3s)</option>
        </SelectInput>
      </Field>
      <Field label="File Bumper">
        <PathInput
          value={getDeep(config, 'branding.bumperVideo')}
          onChange={v => updateConfig('branding.bumperVideo', v)}
          placeholder="C:/brand/intro-outro.mp4"
          filter="video"
        />
      </Field>
      <Field label="Posisi">
        <SelectInput
          value={getDeep(config, 'branding.bumperPosition', 'Akhir')}
          onChange={v => updateConfig('branding.bumperPosition', v)}
        >
          <option>Awal</option>
          <option>Akhir</option>
          <option>Keduanya</option>
        </SelectInput>
      </Field>
      <Field label="Transisi">
        <SelectInput
          value={getDeep(config, 'branding.bumperTransition', 'fade')}
          onChange={v => updateConfig('branding.bumperTransition', v)}
        >
          <option value="fade">Fade</option>
          <option value="cut">Cut</option>
          <option value="overlay">Overlay</option>
          <option value="wipe">Wipe</option>
          <option value="dissolve">Dissolve</option>
          <option value="zoom">Zoom</option>
          <option value="slide">Slide</option>
        </SelectInput>
      </Field>
      <Field label="Durasi Intro">
        <TextInput
          type="number"
          value={getDeep(config, 'branding.bumperDurationIntro', getDeep(config, 'branding.bumperDuration', 3))}
          onChange={v => updateConfig('branding.bumperDurationIntro', v)}
        />
      </Field>
      <Field label="Durasi Outro">
        <TextInput
          type="number"
          value={getDeep(config, 'branding.bumperDurationOutro', getDeep(config, 'branding.bumperDuration', 3))}
          onChange={v => updateConfig('branding.bumperDurationOutro', v)}
        />
      </Field>
      <Field label="Fade Durasi">
        <TextInput
          type="number"
          value={getDeep(config, 'branding.bumperFadeDuration', 0.45)}
          onChange={v => updateConfig('branding.bumperFadeDuration', v)}
        />
      </Field>
      <Field label="Audio Utama">
        <SelectInput
          value={getDeep(config, 'branding.bumperAudioMode', 'after-intro')}
          onChange={v => updateConfig('branding.bumperAudioMode', v)}
        >
          <option value="after-intro">Setelah intro</option>
          <option value="together">Bersamaan</option>
          <option value="mute-bumper">Mute bumper</option>
          <option value="duck-audio">Duck audio (lower)</option>
        </SelectInput>
      </Field>
      {getDeep(config, 'branding.bumperAudioMode') === 'duck-audio' && (
        <div className="space-y-3 p-3 bg-[var(--tertiary-bg)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
          <SliderControl
            label="Duck Level (%)"
            value={Number(getDeep(config, 'branding.bumperDuckLevel', 30))}
            onChange={v => updateConfig('branding.bumperDuckLevel', v)}
            min={0}
            max={100}
          />
          <Field label="Duck Fade">
            <TextInput
              type="number"
              value={getDeep(config, 'branding.bumperDuckFade', 0.5)}
              onChange={v => updateConfig('branding.bumperDuckFade', v)}
              placeholder="0.5"
            />
          </Field>
        </div>
      )}
      <Callout type="tip">
        Intro & outro dapat memiliki durasi berbeda. Audio ducking akan menurunkan volume audio utama saat bumper
        diputar.
      </Callout>
    </Card>
  );
}
