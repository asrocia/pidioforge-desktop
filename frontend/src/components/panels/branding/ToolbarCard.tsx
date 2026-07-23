import { SelectInput } from '../../ui/form-controls';
import { cn } from '../../../utils/cn';
import { getDeep } from '../../../lib/config-path';
import { cleanUiText } from '../../../lib/format';
import { Callout } from '../../ui/design-system-components';
import type { BrandingCardProps, BrandingEngineState } from './types';

interface ToolbarCardProps extends BrandingCardProps {
  engine: BrandingEngineState;
}

export function ToolbarCard({ config, updateConfig, engine }: ToolbarCardProps) {
  const { message, validation, busy, applyBrandPreset, validateBranding } = engine;

  return (
    <div className="p-4 bg-[var(--secondary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] space-y-3">
      <div className="flex gap-2 flex-wrap">
        <SelectInput value={getDeep(config, 'branding.brandPreset', 'custom')} onChange={applyBrandPreset}>
          <option value="custom">Branding Kustom</option>
          <option value="none">Tanpa Branding</option>
          <option value="logo-only">Logo Saja</option>
          <option value="logo-cta">Logo + CTA</option>
          <option value="youtube-full">Branding YouTube Penuh</option>
          <option value="shorts">Branding Shorts</option>
        </SelectInput>
        <SelectInput
          value={getDeep(config, 'branding.safeAreaPreset', 'youtube')}
          onChange={v => updateConfig('branding.safeAreaPreset', v)}
        >
          <option value="youtube">Area Aman YouTube</option>
          <option value="shorts">Area Aman Shorts/TikTok</option>
          <option value="reels">Area Aman Reels</option>
          <option value="center-title">Area Aman Judul Tengah</option>
        </SelectInput>
        <button
          onClick={validateBranding}
          disabled={busy}
          className="px-4 py-2 text-[12px] font-semibold text-white bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-[var(--radius-md)] transition-all duration-200"
        >
          Validasi Aset
        </button>
      </div>
      <Callout type="tip">
        Edit posisi branding langsung di layar PREVIEW kanan. Geser logo, CTA, atau watermark; klik watermark untuk ubah
        teks.
      </Callout>
      {message && (
        <div
          className={cn(
            'px-3 py-2 rounded-[var(--radius-md)] text-[11px] font-medium',
            validation?.ok
              ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]'
              : 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]',
          )}
        >
          {cleanUiText(message)}
        </div>
      )}
      {validation?.warnings?.length ? (
        <div className="p-4 bg-[var(--secondary-bg)] border-l-4 border-[var(--accent-warning)] rounded-[var(--radius-lg)]">
          <h4 className="text-[12px] font-bold text-[var(--accent-warning)] mb-3">⚠ Catatan aset:</h4>
          <ul className="space-y-2">
            {validation.warnings.map((warning: string, i: number) => (
              <li
                key={i}
                className="text-[11px] text-[var(--text-primary)] leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-[var(--accent-warning)]"
              >
                {warning}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
