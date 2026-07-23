import { useMemo, useState, Suspense } from 'react';
import { getDeep } from '../../lib/config-path';
import { showPrompt } from '../ui/Dialogs';
import { flattenModulePatch } from '../../utils/media';
import { moduleDisplay } from '../../constants/modules';
import { PanelErrorBoundary } from '../ErrorBoundary';
import {
  TargetPanel,
  BrandingPanel,
  AudioMixingPanel,
  LyricsPanel,
  SpectrumPanel,
  OverlayPanel,
  QueuePanel,
  LoopingPanel,
  TemplatesPanel,
  HelpPanel,
} from './index';
import type { ModuleKey, PidioConfig, Preset } from '../../types/app.types';

export function ModulePresetControl({
  active,
  config,
  updateConfig,
}: {
  active: ModuleKey;
  config: PidioConfig;
  updateConfig: (path: string, value: unknown) => void;
}) {
  const storageKey = `pidioforge.modulePresets.${active}`;
  const [presetVersion, setPresetVersion] = useState(0);
  const presets = useMemo<Array<{ name: string; data: unknown }>>(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '[]');
    } catch {
      return [];
    }
    // presetVersion forces recompute after localStorage write
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, presetVersion]);
  async function saveModulePreset() {
    const name = await showPrompt('Nama preset modul?');
    if (!name) return;
    const data = structuredClone(getDeep(config, active, {}));
    const next = [{ name, data }, ...presets.filter(p => p.name !== name)].slice(0, 12);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setPresetVersion(v => v + 1);
  }
  function applyModulePreset(name: string) {
    const preset = presets.find(p => p.name === name);
    if (!preset) return;
    for (const [path, value] of flattenModulePatch(preset.data, active)) updateConfig(path, value);
  }
  return (
    <div className="flex items-center gap-2">
      <select
        value=""
        onChange={e => e.target.value && applyModulePreset(e.target.value)}
        className="h-[26px] px-2 text-[10px] font-semibold bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-[var(--text-primary)] min-w-[120px]"
      >
        <option value="">Modul Preset</option>
        {presets.map(p => (
          <option key={p.name} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={saveModulePreset}
        className="h-[26px] px-3 text-[10px] font-semibold bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] text-[var(--text-primary)] hover:bg-[var(--secondary-bg)] transition-colors duration-200"
      >
        Simpan Modul
      </button>
    </div>
  );
}

export function SettingsPanel({
  active,
  config,
  updateConfig,
  presets,
  applyPreset,
  savePreset,
}: {
  active: ModuleKey;
  config: PidioConfig | null;
  updateConfig: (path: string, value: unknown) => void;
  presets: Preset[];
  applyPreset: (id: string) => void;
  savePreset: () => void;
}) {
  if (!config)
    return (
      <main className="flex flex-col h-full bg-[var(--secondary-bg)] overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3" role="status" aria-label="Loading configuration">
            <div className="w-6 h-6 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            <span className="text-[12px] text-[var(--text-muted)]">Memuat config...</span>
          </div>
        </div>
      </main>
    );
  return (
    <main className="flex flex-col h-full bg-[var(--secondary-bg)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] flex-shrink-0">
        <div>
          <h2 className="text-[13px] font-bold text-[var(--text-primary)] uppercase">{moduleDisplay[active]?.title}</h2>
        </div>
        {active !== 'help' && (
          <div className="flex gap-2">
            <select
              onChange={e => e.target.value && applyPreset(e.target.value)}
              defaultValue=""
              className="h-[26px] px-2 text-[10px] font-semibold bg-[var(--tertiary-bg)] border-2 border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[var(--text-primary)]"
            >
              <option value="">Pilih Preset</option>
              {presets.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              onClick={savePreset}
              className="h-[26px] px-3 text-[9px] font-semibold bg-[var(--surface)] border-2 border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
            >
              Simpan
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <PanelErrorBoundary fallbackTitle={moduleDisplay[active]?.title} key={active}>
          <Suspense
            fallback={
              <div className="flex items-center justify-center p-8">
                <div className="text-gray-400">Loading...</div>
              </div>
            }
          >
            {active === 'target' && <TargetPanel config={config} updateConfig={updateConfig} />}
            {active === 'branding' && <BrandingPanel config={config} updateConfig={updateConfig} />}
            {active === 'audio' && <AudioMixingPanel config={config} updateConfig={updateConfig} />}
            {active === 'lyrics' && <LyricsPanel config={config} updateConfig={updateConfig} />}
            {active === 'spectrum' && <SpectrumPanel config={config} updateConfig={updateConfig} />}
            {active === 'overlay' && <OverlayPanel config={config} updateConfig={updateConfig} />}
            {active === 'queue' && <QueuePanel config={config} />}
            {active === 'loop' && <LoopingPanel config={config} updateConfig={updateConfig} />}
            {active === 'templates' && <TemplatesPanel config={config} updateConfig={updateConfig} />}
            {active === 'help' && <HelpPanel />}
          </Suspense>
        </PanelErrorBoundary>
        {active !== 'help' && (
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
            <ModulePresetControl active={active} config={config} updateConfig={updateConfig} />
          </div>
        )}
      </div>
    </main>
  );
}
