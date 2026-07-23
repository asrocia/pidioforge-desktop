import { Field, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Callout, Card } from '../../ui/design-system-components';
import type { BrandingCardProps } from './types';

export function TemplatesCard({ config, updateConfig }: BrandingCardProps) {
  return (
    <Card title="Branding Templates">
      <Field label="Template Preset">
        <SelectInput
          value={getDeep(config, 'branding.template', 'custom')}
          onChange={v => {
            updateConfig('branding.template', v);
            if (v === 'youtube-pro') {
              updateConfig('branding.logoEnabled', true);
              updateConfig('branding.logoPosition', 'Kanan Atas');
              updateConfig('branding.logoScale', 18);
              updateConfig('branding.ctaEnabled', true);
              updateConfig('branding.ctaPosition', 'Kanan Bawah');
              updateConfig('branding.textOverlay.enabled', true);
              updateConfig('branding.textOverlay.type', 'lower-third');
              updateConfig('branding.brandColors.primary', '#ff0000');
            }
            if (v === 'tiktok-viral') {
              updateConfig('branding.logoEnabled', true);
              updateConfig('branding.logoPosition', 'Kanan Atas');
              updateConfig('branding.logoScale', 22);
              updateConfig('branding.socialBadges.enabled', true);
              updateConfig('branding.socialBadges.position', 'bottom-left');
              updateConfig('branding.textOverlay.enabled', true);
              updateConfig('branding.textOverlay.type', 'caption');
              updateConfig('branding.brandColors.primary', '#fe2c55');
            }
            if (v === 'instagram-clean') {
              updateConfig('branding.logoEnabled', true);
              updateConfig('branding.logoPosition', 'Tengah');
              updateConfig('branding.logoScale', 35);
              updateConfig('branding.logoAnimation', 'fade');
              updateConfig('branding.socialBadges.enabled', true);
              updateConfig('branding.brandColors.primary', '#e1306c');
            }
            if (v === 'podcast-minimal') {
              updateConfig('branding.logoEnabled', true);
              updateConfig('branding.logoPosition', 'Kiri Atas');
              updateConfig('branding.logoScale', 20);
              updateConfig('branding.textOverlay.enabled', true);
              updateConfig('branding.textOverlay.type', 'lower-third');
              updateConfig('branding.watermarkEnabled', true);
              updateConfig('branding.brandColors.primary', '#1db954');
            }
            if (v === 'gaming-stream') {
              updateConfig('branding.logoEnabled', true);
              updateConfig('branding.logoGlow', true);
              updateConfig('branding.logoPosition', 'Kanan Atas');
              updateConfig('branding.ctaEnabled', true);
              updateConfig('branding.socialBadges.enabled', true);
              updateConfig('branding.textOverlay.enabled', true);
              updateConfig('branding.brandColors.primary', '#9146ff');
            }
          }}
        >
          <option value="custom">Custom</option>
          <option value="youtube-pro">YouTube Professional</option>
          <option value="tiktok-viral">TikTok Viral</option>
          <option value="instagram-clean">Instagram Clean</option>
          <option value="podcast-minimal">Podcast Minimal</option>
          <option value="gaming-stream">Gaming Stream</option>
        </SelectInput>
      </Field>
      <div className="p-3 bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)]">
        <h4 className="text-[11px] font-bold text-[var(--text-primary)] mb-2">Template Features:</h4>
        <ul className="space-y-1.5 text-[10px] text-[var(--text-muted)]">
          <li className="pl-3 relative before:content-['•'] before:absolute before:left-0">
            YouTube Pro: Logo + CTA + Lower Third + Watermark
          </li>
          <li className="pl-3 relative before:content-['•'] before:absolute before:left-0">
            TikTok Viral: Logo + Social Badges + Captions
          </li>
          <li className="pl-3 relative before:content-['•'] before:absolute before:left-0">
            Instagram Clean: Centered Logo + Social Badges
          </li>
          <li className="pl-3 relative before:content-['•'] before:absolute before:left-0">
            Podcast Minimal: Logo + Lower Third + Watermark
          </li>
          <li className="pl-3 relative before:content-['•'] before:absolute before:left-0">
            Gaming Stream: Logo Glow + CTA + Social + Overlays
          </li>
        </ul>
      </div>
      <Callout type="tip">
        Templates mengatur semua elemen branding sekaligus. Pilih template lalu customize sesuai kebutuhan.
      </Callout>
    </Card>
  );
}
