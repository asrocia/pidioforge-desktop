import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { PathInput } from '../../ui/PathInput';
import { getDeep } from '../../../lib/config-path';
import { Card, SliderControl } from '../../ui/design-system-components';
import type { BrandingCardProps, BrandingEngineState } from './types';

interface CtaCardProps extends BrandingCardProps {
  engine: BrandingEngineState;
}

export function CtaCard({ config, updateConfig, engine }: CtaCardProps) {
  const { positionOptions, applyCtaPreset } = engine;

  return (
    <Card title="CTA Greenscreen">
      <Check
        label="Aktifkan CTA greenscreen"
        checked={Boolean(getDeep(config, 'branding.ctaEnabled', false))}
        onChange={v => updateConfig('branding.ctaEnabled', v)}
      />
      <Field label="File CTA">
        <PathInput
          value={getDeep(config, 'branding.ctaGreenscreen')}
          onChange={v => updateConfig('branding.ctaGreenscreen', v)}
          placeholder="Video greenscreen subscribe/like"
          filter="video"
        />
      </Field>
      <div className="space-y-3">
        <Field label="CTA Preset">
          <SelectInput value={getDeep(config, 'branding.ctaPreset', 'subscribe-lower-right')} onChange={applyCtaPreset}>
            <option value="subscribe-lower-right">Subscribe lower right</option>
            <option value="like-subscribe-bottom">Like + subscribe bottom</option>
            <option value="bell-popup">Bell popup</option>
            <option value="center-cta">Center CTA</option>
          </SelectInput>
        </Field>
        <Field label="Posisi">
          <SelectInput
            value={getDeep(config, 'branding.ctaPosition', 'Kanan Bawah')}
            onChange={v => updateConfig('branding.ctaPosition', v)}
          >
            {positionOptions}
          </SelectInput>
        </Field>
        <Field label="Muncul detik">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.ctaAt', 2)}
            onChange={v => updateConfig('branding.ctaAt', v)}
          />
        </Field>
      </div>
      <div className="space-y-3">
        <Field label="Durasi">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.ctaDuration', 8)}
            onChange={v => updateConfig('branding.ctaDuration', v)}
          />
        </Field>
        <Field label="Chroma Preset">
          <SelectInput
            value={getDeep(config, 'branding.ctaChromaPreset', 'green')}
            onChange={v => {
              updateConfig('branding.ctaChromaPreset', v);
              if (v === 'green') updateConfig('branding.ctaChromaColor', '0x00ff00');
              if (v === 'blue') updateConfig('branding.ctaChromaColor', '0x0000ff');
            }}
          >
            <option value="green">Auto Green</option>
            <option value="blue">Auto Blue</option>
            <option value="manual">Manual</option>
            <option value="auto">Auto Soft</option>
          </SelectInput>
        </Field>
        <Field label="Chroma Color">
          <TextInput
            value={getDeep(config, 'branding.ctaChromaColor', '0x00ff00')}
            onChange={v => updateConfig('branding.ctaChromaColor', v)}
          />
        </Field>
      </div>
      <SliderControl
        label="Scale CTA"
        value={Number(getDeep(config, 'branding.ctaScale', 26))}
        onChange={v => updateConfig('branding.ctaScale', v)}
        min={5}
        max={100}
      />
      <div className="space-y-3">
        <Field label="Similarity">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.ctaSimilarity', 0.35)}
            onChange={v => updateConfig('branding.ctaSimilarity', v)}
          />
        </Field>
        <Field label="Blend">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.ctaBlend', 0.08)}
            onChange={v => updateConfig('branding.ctaBlend', v)}
          />
        </Field>
        <Field label="Status">
          <input
            readOnly
            value={getDeep(config, 'branding.ctaEnabled', false) ? 'Aktif' : 'Mati'}
            className="bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-muted)] text-[11px] min-h-[26px] px-2 py-1 w-full"
          />
        </Field>
      </div>
    </Card>
  );
}
