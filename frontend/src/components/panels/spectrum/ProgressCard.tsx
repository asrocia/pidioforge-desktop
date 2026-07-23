import { Field, Check, SelectInput } from '../../ui/form-controls';
import { getDeep } from '../../../lib/config-path';
import { Card } from '../../ui/design-system-components';
import type { SpectrumCardProps } from './types';

export function ProgressCard({ config, updateConfig }: SpectrumCardProps) {
  return (
    <Card title="Progress">
      <Check
        label="Progress Bar"
        checked={Boolean(getDeep(config, 'spectrum.progressBar', true))}
        onChange={v => updateConfig('spectrum.progressBar', v)}
      />
      <Field label="Gaya">
        <SelectInput
          value={getDeep(config, 'spectrum.progressStyle', 'line')}
          onChange={v => updateConfig('spectrum.progressStyle', v)}
        >
          <option value="line">Line</option>
          <option value="thin">Thin</option>
        </SelectInput>
      </Field>
      <Field label="Status">
        <input
          readOnly
          className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-muted)] text-[11px] min-h-[26px] px-2 py-1"
          value={getDeep(config, 'spectrum.progressBar', true) ? 'Aktif' : 'Mati'}
        />
      </Field>
      <Field label="Durasi">
        <input
          readOnly
          className="w-full bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[var(--text-muted)] text-[11px] min-h-[26px] px-2 py-1"
          value={`${getDeep(config, 'target.duration', 0) || 'audio'}s`}
        />
      </Field>
    </Card>
  );
}
