import { Field, Check, TextInput, SelectInput } from '../../ui/form-controls';
import { PathInput } from '../../ui/PathInput';
import { getDeep } from '../../../lib/config-path';
import { Card, SliderControl } from '../../ui/design-system-components';
import type { BrandingCardProps, BrandingEngineState } from './types';

interface LogoCardProps extends BrandingCardProps {
  engine: BrandingEngineState;
}

export function LogoCard({ config, updateConfig, engine }: LogoCardProps) {
  const { positionOptions } = engine;

  return (
    <Card title="Logo Overlay">
      <Check
        label="Aktifkan logo"
        checked={Boolean(getDeep(config, 'branding.logoEnabled', true))}
        onChange={v => updateConfig('branding.logoEnabled', v)}
      />
      <Field label="File Logo">
        <PathInput
          value={getDeep(config, 'branding.logo')}
          onChange={v => updateConfig('branding.logo', v)}
          placeholder="PNG transparan direkomendasikan"
          filter="image"
        />
      </Field>
      <div className="space-y-3">
        <Field label="Posisi">
          <SelectInput
            value={getDeep(config, 'branding.logoPosition', 'Kanan Atas')}
            onChange={v => updateConfig('branding.logoPosition', v)}
          >
            {positionOptions}
          </SelectInput>
        </Field>
        <Field label="Animasi">
          <SelectInput
            value={getDeep(config, 'branding.logoAnimation', 'none')}
            onChange={v => updateConfig('branding.logoAnimation', v)}
          >
            <option value="none">Statis</option>
            <option value="fade">Fade in/out</option>
            <option value="slide-left">Slide dari kanan</option>
            <option value="slide-right">Slide dari kiri</option>
            <option value="pulse">Pulse ringan</option>
            <option value="zoom">Zoom ringan</option>
          </SelectInput>
        </Field>
        <Field label="Fade">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.logoFadeDuration', 0.6)}
            onChange={v => updateConfig('branding.logoFadeDuration', v)}
          />
        </Field>
      </div>
      <div className="space-y-3">
        <Field label="Mulai detik">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.logoStart', 0)}
            onChange={v => updateConfig('branding.logoStart', v)}
          />
        </Field>
        <Field label="Selesai detik">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.logoEnd', 0)}
            onChange={v => updateConfig('branding.logoEnd', v)}
          />
        </Field>
        <Field label="Preset">
          <SelectInput
            value="custom"
            onChange={v => {
              if (v === 'corner') {
                updateConfig('branding.logoPosition', 'Kanan Atas');
                updateConfig('branding.logoScale', 18);
              }
              if (v === 'center') {
                updateConfig('branding.logoPosition', 'Tengah');
                updateConfig('branding.logoScale', 35);
              }
            }}
          >
            <option value="custom">Custom</option>
            <option value="corner">Corner kecil</option>
            <option value="center">Center besar</option>
          </SelectInput>
        </Field>
      </div>
      <SliderControl
        label="Scale Logo"
        value={Number(getDeep(config, 'branding.logoScale', 18))}
        onChange={v => updateConfig('branding.logoScale', v)}
        min={5}
        max={100}
      />
      <SliderControl
        label="Opacity Logo"
        value={Number(getDeep(config, 'branding.logoOpacity', 100))}
        onChange={v => updateConfig('branding.logoOpacity', v)}
        min={0}
        max={100}
      />

      {/* Advanced Logo Effects */}
      <div className="mt-3 p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] space-y-3">
        <h4 className="text-[11px] font-bold text-[var(--text-primary)]">Advanced Logo Effects</h4>
        <Check
          label="Enable Glow Effect"
          checked={Boolean(getDeep(config, 'branding.logoGlow', false))}
          onChange={v => updateConfig('branding.logoGlow', v)}
        />
        <div className="space-y-3">
          <Field label="Glow Color">
            <TextInput
              value={getDeep(config, 'branding.logoGlowColor', '#ffffff')}
              onChange={v => updateConfig('branding.logoGlowColor', v)}
            />
          </Field>
          <Field label="Glow Strength">
            <TextInput
              type="number"
              value={getDeep(config, 'branding.logoGlowStrength', 15)}
              onChange={v => updateConfig('branding.logoGlowStrength', v)}
              placeholder="5-50"
            />
          </Field>
          <Field label="Glow Blur">
            <TextInput
              type="number"
              value={getDeep(config, 'branding.logoGlowBlur', 10)}
              onChange={v => updateConfig('branding.logoGlowBlur', v)}
              placeholder="5-30"
            />
          </Field>
        </div>
        <Check
          label="Enable Shadow"
          checked={Boolean(getDeep(config, 'branding.logoShadow', true))}
          onChange={v => updateConfig('branding.logoShadow', v)}
        />
        <div className="space-y-3">
          <Field label="Shadow Color">
            <TextInput
              value={getDeep(config, 'branding.logoShadowColor', '#000000')}
              onChange={v => updateConfig('branding.logoShadowColor', v)}
            />
          </Field>
          <Field label="Shadow Blur">
            <TextInput
              type="number"
              value={getDeep(config, 'branding.logoShadowBlur', 8)}
              onChange={v => updateConfig('branding.logoShadowBlur', v)}
              placeholder="0-20"
            />
          </Field>
          <Field label="Shadow Offset">
            <TextInput
              type="number"
              value={getDeep(config, 'branding.logoShadowOffset', 4)}
              onChange={v => updateConfig('branding.logoShadowOffset', v)}
              placeholder="0-10"
            />
          </Field>
        </div>
        <Check
          label="Enable Border"
          checked={Boolean(getDeep(config, 'branding.logoBorder', false))}
          onChange={v => updateConfig('branding.logoBorder', v)}
        />
        <div className="space-y-3">
          <Field label="Border Color">
            <TextInput
              value={getDeep(config, 'branding.logoBorderColor', '#ffffff')}
              onChange={v => updateConfig('branding.logoBorderColor', v)}
            />
          </Field>
          <Field label="Border Width">
            <TextInput
              type="number"
              value={getDeep(config, 'branding.logoBorderWidth', 2)}
              onChange={v => updateConfig('branding.logoBorderWidth', v)}
              placeholder="1-10"
            />
          </Field>
          <Field label="Border Style">
            <SelectInput
              value={getDeep(config, 'branding.logoBorderStyle', 'solid')}
              onChange={v => updateConfig('branding.logoBorderStyle', v)}
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </SelectInput>
          </Field>
        </div>
        <Check
          label="Enable 3D Effect"
          checked={Boolean(getDeep(config, 'branding.logo3D', false))}
          onChange={v => updateConfig('branding.logo3D', v)}
        />
        <div className="space-y-3">
          <Field label="3D Depth">
            <TextInput
              type="number"
              value={getDeep(config, 'branding.logo3DDepth', 5)}
              onChange={v => updateConfig('branding.logo3DDepth', v)}
              placeholder="1-20"
            />
          </Field>
          <Field label="3D Angle">
            <TextInput
              type="number"
              value={getDeep(config, 'branding.logo3DAngle', 45)}
              onChange={v => updateConfig('branding.logo3DAngle', v)}
              placeholder="0-360"
            />
          </Field>
        </div>
      </div>
      <div className="space-y-3">
        <Field label="Margin X">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.logoMarginX', 20)}
            onChange={v => updateConfig('branding.logoMarginX', v)}
          />
        </Field>
        <Field label="Margin Y">
          <TextInput
            type="number"
            value={getDeep(config, 'branding.logoMarginY', 20)}
            onChange={v => updateConfig('branding.logoMarginY', v)}
          />
        </Field>
        <Field label="Area Aman">
          <input
            readOnly
            value={getDeep(config, 'branding.safeAreaPreset', 'youtube')}
            className="bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-muted)] text-[11px] min-h-[26px] px-2 py-1 w-full"
          />
        </Field>
      </div>
    </Card>
  );
}
