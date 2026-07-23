import { Field, Check, TextInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Callout, Card } from '../../ui/design-system-components';
import type { BrandingCardProps } from './types';

export function BrandColorsCard({ config, updateConfig }: BrandingCardProps) {
  return (
    <Card title="Brand Color Palette">
      <Check
        label="Enable Brand Colors"
        checked={Boolean(getDeep(config, 'branding.brandColors.enabled', false))}
        onChange={v => updateConfig('branding.brandColors.enabled', v)}
      />
      <div className="space-y-3">
        <Field label="Primary Color">
          <TextInput
            value={getDeep(config, 'branding.brandColors.primary', '#3b82f6')}
            onChange={v => updateConfig('branding.brandColors.primary', v)}
          />
        </Field>
        <Field label="Secondary Color">
          <TextInput
            value={getDeep(config, 'branding.brandColors.secondary', '#8b5cf6')}
            onChange={v => updateConfig('branding.brandColors.secondary', v)}
          />
        </Field>
        <Field label="Accent Color">
          <TextInput
            value={getDeep(config, 'branding.brandColors.accent', '#f59e0b')}
            onChange={v => updateConfig('branding.brandColors.accent', v)}
          />
        </Field>
      </div>
      <div className="space-y-3">
        <Field label="Background Color">
          <TextInput
            value={getDeep(config, 'branding.brandColors.background', '#000000')}
            onChange={v => updateConfig('branding.brandColors.background', v)}
          />
        </Field>
        <Field label="Text Color">
          <TextInput
            value={getDeep(config, 'branding.brandColors.text', '#ffffff')}
            onChange={v => updateConfig('branding.brandColors.text', v)}
          />
        </Field>
      </div>
      <Check
        label="Apply to All Elements"
        checked={Boolean(getDeep(config, 'branding.brandColors.applyToAll', false))}
        onChange={v => updateConfig('branding.brandColors.applyToAll', v)}
      />
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => {
            updateConfig('branding.brandColors.primary', '#3b82f6');
            updateConfig('branding.brandColors.secondary', '#8b5cf6');
            updateConfig('branding.brandColors.accent', '#f59e0b');
          }}
          className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200"
        >
          Blue Theme
        </button>
        <button
          onClick={() => {
            updateConfig('branding.brandColors.primary', '#ef4444');
            updateConfig('branding.brandColors.secondary', '#f97316');
            updateConfig('branding.brandColors.accent', '#fbbf24');
          }}
          className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200"
        >
          Red Theme
        </button>
        <button
          onClick={() => {
            updateConfig('branding.brandColors.primary', '#10b981');
            updateConfig('branding.brandColors.secondary', '#14b8a6');
            updateConfig('branding.brandColors.accent', '#06b6d4');
          }}
          className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200"
        >
          Green Theme
        </button>
        <button
          onClick={() => {
            updateConfig('branding.brandColors.primary', '#ec4899');
            updateConfig('branding.brandColors.secondary', '#a855f7');
            updateConfig('branding.brandColors.accent', '#f472b6');
          }}
          className="px-3 py-1.5 text-[11px] font-semibold text-[var(--text-primary)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80 border border-[var(--border-subtle)] rounded-[var(--radius-md)] transition-all duration-200"
        >
          Pink Theme
        </button>
      </div>
      <Callout type="tip">
        Brand colors akan diterapkan ke logo glow, text overlays, social badges, dan elemen branding lainnya untuk
        konsistensi visual.
      </Callout>
    </Card>
  );
}
