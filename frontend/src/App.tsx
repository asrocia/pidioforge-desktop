import React, { useEffect, useRef, useState } from 'react';
import { cn } from './utils/cn';
import { modules, moduleDisplay, moduleUi } from './constants/modules';
import { ModuleIcon } from './components/ui/ModuleIcon';
import { WorkspacePopup } from './components/layout/WorkspacePopup';
import { SettingsPanel } from './components/panels/SettingsPanel';
import { PreviewPane } from './components/panels/PreviewPane';
import { api } from './lib/api';
import { setDeep } from './lib/config-path';
import { useUndoRedo } from './hooks/useUndoRedo';
import type { AppState, ModuleKey, Project } from './types/app.types';

export function App() {
  const [active, setActive] = useState<ModuleKey>('target'); const [workspaceOpen, setWorkspaceOpen] = useState(true); const [sidebarCollapsed, setSidebarCollapsed] = useState(false); const [state, setState] = useState<AppState | null>(null); const [config, setConfig] = useState<any>(null); const [saveInfo, setSaveInfo] = useState(''); const [perf, setPerf] = useState<any>(null);
  const saveTimer = useRef<number | null>(null);
  const pendingConfig = useRef<any>(null);
  const undoRedo = useUndoRedo<any>(null);
  const refresh = async () => { const s = await api('/api/state').catch(() => null); if (s) { setState(s); const p = s.projects.find((x: Project) => x.id === s.activeProjectId) || s.projects[0]; setConfig(p?.config); undoRedo.push(p?.config); } };
  const refreshPerf = async () => { const p = await api('/api/performance/status').catch(() => null); if (p) setPerf(p); };
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { refresh(); refreshPerf(); const t = setInterval(() => { refresh(); refreshPerf(); }, Number(perf?.performance?.refreshMs || 1500)); return () => clearInterval(t); }, [perf?.performance?.refreshMs]); // eslint-disable-line
  useEffect(() => () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); }, []);

  // Keyboard shortcuts: Ctrl+Z = undo, Ctrl+Y / Ctrl+Shift+Z = redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const prev = undoRedo.undo();
        if (prev) { setConfig(prev); scheduleConfigSave(prev); setSaveInfo('Undo'); }
      }
      if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        const next = undoRedo.redo();
        if (next) { setConfig(next); scheduleConfigSave(next); setSaveInfo('Redo'); }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function scheduleConfigSave(next: any) {
    pendingConfig.current = next;
    setSaveInfo('Menyimpan...');
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      const payload = pendingConfig.current;
      saveTimer.current = null;
      try {
        await api('/api/config', { method: 'POST', body: JSON.stringify(payload) });
        setSaveInfo('Tersimpan');
      } catch (e: any) {
        setSaveInfo(e.message || 'Gagal menyimpan');
      }
    }, 450);
  }
  function updateConfig(path: string, value: any) { setConfig((prev: any) => { const next = setDeep(prev || config, path, value); undoRedo.push(next); scheduleConfigSave(next); return next; }); }
  async function applyPreset(id: string) { await api(`/api/presets/${id}/apply`, { method: 'POST' }); await refresh(); }
  async function savePreset() { const name = prompt('Nama preset?') || 'Preset Baru'; await api('/api/presets', { method: 'POST', body: JSON.stringify({ name, config }) }); await refresh(); }
  const projectCount = state?.projects?.length || 0;
  const queueCount = state?.jobs?.length || 0;
  const renderCount = perf?.metrics?.activeRenders || 0;
  const activeJob = state?.jobs?.find(j => j.status === 'rendering');
  const systemReady = Boolean(state && config);
  const statusText = activeJob ? `${activeJob.title} / ${activeJob.progress || 0}%` : systemReady ? (saveInfo || 'Siap produksi') : 'Menghubungkan backend';
  const toneAccent: Record<string, string> = {
    cyan:   'text-[#62dbc1]',
    green:  'text-[#2dbb7f]',
    blue:   'text-[#4f8ef7]',
    amber:  'text-[#d9a65f]',
    violet: 'text-[#a855f7]',
    red:    'text-[#e76d78]',
  };
  return (
    <div className={cn('h-screen flex flex-col bg-[#090e14] text-[#dce8ef] overflow-hidden', systemReady ? 'appReady' : 'appLoading')}>
      {/* Topbar */}
      <header className="h-11 shrink-0 flex items-center gap-3 px-4 bg-[#0b0e13] border-b border-[rgba(142,162,184,0.18)] z-10">
        {/* Brand */}
        <div className="flex flex-col leading-none min-w-[100px]">
          <span className="text-[11px] font-bold tracking-[0.15em] text-[#eef7f6]">PIDEOFORGE</span>
          <small className="text-[9px] text-[#8da0af] tracking-wide">by Bangalimin</small>
        </div>
        {/* Status */}
        <div className={cn(
          'flex items-center gap-2 px-3 py-1 rounded-md text-[11px] border',
          activeJob
            ? 'bg-[#1a1421] border-[#7d52d9] text-[#b99cff]'
            : systemReady
              ? 'bg-[#0e1a14] border-[rgba(45,187,127,0.4)] text-[#2dbb7f]'
              : 'bg-[#121821] border-[rgba(142,162,184,0.22)] text-[#8da0af]'
        )}>
          <span className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            activeJob ? 'bg-[#7d52d9] animate-pulse' : systemReady ? 'bg-[#2dbb7f]' : 'bg-[#8da0af] animate-pulse'
          )} />
          <div className="flex flex-col leading-none gap-0.5">
            <b className="font-semibold text-[10px] uppercase tracking-wider opacity-70">
              {activeJob ? 'Rendering' : systemReady ? 'Status' : 'Koneksi'}
            </b>
            <small className="text-[10px] max-w-[200px] truncate opacity-90">{statusText}</small>
          </div>
        </div>
        {/* Perf */}
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex flex-col leading-none text-right">
            <b className="text-[10px] text-[#8da0af] font-medium">{perf?.performance?.mode || 'Seimbang'}</b>
            <small className="text-[9px] text-[#8da0af] opacity-60">{perf?.encoder || 'encoder'}</small>
          </div>
          {[
            { label: 'CPU', value: perf?.metrics?.cpu ?? 0 },
            { label: 'Mem', value: perf?.metrics?.memory ?? 0 },
            { label: 'Render', value: Math.min(100, (perf?.metrics?.activeRenders || 0) * 50) },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center leading-none">
              <b className="text-[12px] font-semibold text-[#eef7f6]">{value}%</b>
              <small className="text-[9px] text-[#8da0af]">{label}</small>
            </div>
          ))}
        </div>
        {/* Stats */}
        <div className="flex items-center gap-4 pl-4 border-l border-[rgba(142,162,184,0.18)]">
          {[
            { label: 'Project', value: projectCount },
            { label: 'Antrian', value: queueCount },
            { label: 'Render Aktif', value: renderCount },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center leading-none">
              <b className="text-[12px] font-semibold text-[#eef7f6]">{value}</b>
              <small className="text-[9px] text-[#8da0af]">{label}</small>
            </div>
          ))}
        </div>
      </header>
      {/* Main layout: sidebar + preview, workspace floats above preview */}
      <div className={cn('workspaceMain flex-1 grid overflow-hidden relative transition-all', sidebarCollapsed ? 'grid-cols-[48px_minmax(0,1fr)]' : 'grid-cols-[140px_minmax(0,1fr)]')}>
        {/* Sidebar nav */}
        <nav className={cn('flex flex-col gap-0.5 bg-[#0b0e13] border-r border-[rgba(142,162,184,0.18)] overflow-y-auto transition-all', sidebarCollapsed ? 'p-1 items-center' : 'p-1.5')}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center justify-center w-full py-1.5 mb-1 rounded-md text-[#8da0af] hover:text-[#dce8ef] hover:bg-[#0f1620] transition-colors border border-transparent"
            title={sidebarCollapsed ? 'Perlebar sidebar' : 'Kecilkan sidebar'}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d={sidebarCollapsed ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'} /></svg>
          </button>
          {modules.map(item => {
            const isActive = active === item.key;
            const tone = moduleUi[item.key].tone;
            return (
              <button
                key={item.key}
                title={`${moduleDisplay[item.key].title} — ${moduleDisplay[item.key].sub}`}
                aria-label={moduleDisplay[item.key].title}
                onClick={() => { setActive(item.key); setWorkspaceOpen(true); }}
                className={cn(
                  'flex items-center gap-2 w-full rounded-md transition-colors',
                  'border border-transparent',
                  sidebarCollapsed ? 'justify-center py-2.5 px-1' : 'py-2 px-2',
                  isActive
                    ? cn('bg-[#121821] border-[rgba(142,162,184,0.22)]', toneAccent[tone] || 'text-[#4f8ef7]')
                    : 'text-[#8da0af] hover:text-[#dce8ef] hover:bg-[#0f1620]'
                )}
              >
                <i className={cn('block w-5 h-5 shrink-0', isActive ? '' : 'opacity-70')}>
                  <ModuleIcon kind={moduleUi[item.key].icon} />
                </i>
                {!sidebarCollapsed && (
                  <div className="flex flex-col min-w-0">
                    <b className="text-[11px] font-semibold leading-tight truncate">
                      {moduleDisplay[item.key].title}
                    </b>
                    <small className="text-[9px] opacity-50 leading-tight truncate">
                      {moduleDisplay[item.key].sub}
                    </small>
                  </div>
                )}
              </button>
            );
          })}
        </nav>
        <WorkspacePopup
          open={workspaceOpen}
          title={moduleDisplay[active]?.title}
          onOpen={() => setWorkspaceOpen(true)}
          onClose={() => setWorkspaceOpen(false)}
        >
          <SettingsPanel active={active} config={config} updateConfig={updateConfig} presets={state?.presets || []} applyPreset={applyPreset} savePreset={savePreset} />
        </WorkspacePopup>
        <PreviewPane active={active} jobs={state?.jobs || []} logs={state?.logs || []} refresh={refresh} config={config} updateConfig={updateConfig} />
      </div>
    </div>
  );
}

export function Meter({ label, value }: { label: string; value: number }) { return <div className="meter"><i><span style={{ width: `${value}%` }} /></i><p>{label}<small>{value}%</small></p></div>; }
