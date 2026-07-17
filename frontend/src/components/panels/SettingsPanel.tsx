import { useEffect, useState, Suspense } from 'react';
import { getDeep } from '../../lib/config-path';
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
  HelpPanel 
} from './index';
import type { ModuleKey, Preset } from '../../types/app.types';

export function ModulePresetControl({ active, config, updateConfig }: { active: ModuleKey; config: any; updateConfig: (path: string, value: any) => void }) {
  const storageKey = `pidioforge.modulePresets.${active}`;
  const [presets, setPresets] = useState<Array<{ name: string; data: any }>>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
  });
  useEffect(() => {
    try { setPresets(JSON.parse(localStorage.getItem(storageKey) || '[]')); } catch { setPresets([]); }
  }, [storageKey]);
  function saveModulePreset() {
    const name = prompt('Nama preset modul?');
    if (!name) return;
    const data = structuredClone(getDeep(config, active, {}));
    const next = [{ name, data }, ...presets.filter(p => p.name !== name)].slice(0, 12);
    localStorage.setItem(storageKey, JSON.stringify(next));
    setPresets(next);
  }
  function applyModulePreset(name: string) {
    const preset = presets.find(p => p.name === name);
    if (!preset) return;
    for (const [path, value] of flattenModulePatch(preset.data, active)) updateConfig(path, value);
  }
  return <div className="modulePreset"><select value="" onChange={e => e.target.value && applyModulePreset(e.target.value)}><option value="">Modul Preset</option>{presets.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}</select><button type="button" onClick={saveModulePreset}>Simpan Modul</button></div>;
}

export function SettingsPanel({ active, config, updateConfig, presets, applyPreset, savePreset }: { active: ModuleKey; config: any; updateConfig: (path: string, value: any) => void; presets: Preset[]; applyPreset: (id: string) => void; savePreset: () => void }) {
  if (!config) return <main className="section"><h2>Memuat config...</h2></main>;
  return <main className="section">
    <div className="sectionTop">
      <div className="sectionHeading">
        <small>Workspace</small>
        <h2>{moduleDisplay[active]?.title}</h2>
        <p>{moduleDisplay[active]?.sub}</p>
      </div>
    </div>
    <PanelErrorBoundary fallbackTitle={moduleDisplay[active]?.title} key={active}>
      <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="text-gray-400">Loading panel...</div></div>}>
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
    {active !== 'help' && <div className="sectionPresetDock">
      <div className="presetBar">
        <select onChange={e => e.target.value && applyPreset(e.target.value)} defaultValue="">
          <option value="">Pilih Preset</option>
          {presets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={savePreset}>Simpan Preset</button>
      </div>
      <ModulePresetControl active={active} config={config} updateConfig={updateConfig} />
    </div>}
  </main>;
}
