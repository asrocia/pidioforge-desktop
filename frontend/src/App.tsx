import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { cn } from './utils/cn';
import { modules, moduleDisplay, moduleUi } from './constants/modules';
import { ModuleIcon } from './components/ui/ModuleIcon';
import { SettingsPane } from './components/layout/SettingsPane';
import { SettingsPanel } from './components/panels/SettingsPanel';
import { PreviewPane } from './components/panels/PreviewPane';
import { UpdateBanner } from './components/UpdateBanner';
import { ToastContainer, showToast, setupGlobalErrorHandler } from './components/ui/Toast';
import { api, setToastHandler } from './lib/api';
import { setDeep } from './lib/config-path';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { debounce } from './utils/performance';
import type { AppState, ModuleKey, Project } from './types/app.types';

// Setup global error handler and toast handler
setupGlobalErrorHandler();
setToastHandler(showToast);

export function App() {
  const [active, setActive] = useState<ModuleKey>('target');
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [state, setState] = useState<AppState | null>(null);
  const [config, setConfig] = useState<any>(null);
  const [saveInfo, setSaveInfo] = useState('');
  const [perf, setPerf] = useState<any>(null);
  const saveTimer = useRef<number | null>(null);
  const pendingConfig = useRef<any>(null);
  const undoRedo = useUndoRedo<any>(null);
  
  const refresh = useCallback(async () => { 
    const s = await api('/api/state').catch(() => null); 
    if (s) { 
      setState(s); 
      const p = s.projects.find((x: Project) => x.id === s.activeProjectId) || s.projects[0]; 
      setConfig(p?.config); 
      undoRedo.push(p?.config); 
    } 
  }, [undoRedo]);
  
  const refreshPerf = useCallback(async () => { 
    const p = await api('/api/performance/status').catch(() => null); 
    if (p) setPerf(p); 
  }, []);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { refresh(); refreshPerf(); const t = setInterval(() => { refresh(); refreshPerf(); }, Number(perf?.performance?.refreshMs || 1500)); return () => clearInterval(t); }, [perf?.performance?.refreshMs]); // eslint-disable-line
  useEffect(() => () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'z',
      ctrl: true,
      action: () => {
        const prev = undoRedo.undo();
        if (prev) { 
          setConfig(prev); 
          scheduleConfigSave(prev); 
          setSaveInfo('Undo');
          showToast('info', 'Undo');
        }
      },
      description: 'Undo last change'
    },
    {
      key: 'y',
      ctrl: true,
      action: () => {
        const next = undoRedo.redo();
        if (next) { 
          setConfig(next); 
          scheduleConfigSave(next); 
          setSaveInfo('Redo');
          showToast('info', 'Redo');
        }
      },
      description: 'Redo last change'
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      action: () => {
        const next = undoRedo.redo();
        if (next) { 
          setConfig(next); 
          scheduleConfigSave(next); 
          setSaveInfo('Redo');
          showToast('info', 'Redo');
        }
      },
      description: 'Redo last change (alternative)'
    },
    {
      key: 'b',
      ctrl: true,
      action: () => {
        setWorkspaceOpen(!workspaceOpen);
        showToast('info', workspaceOpen ? 'Panel closed' : 'Panel opened');
      },
      description: 'Toggle settings panel'
    },
    {
      key: 's',
      ctrl: true,
      action: () => {
        if (config) {
          scheduleConfigSave(config);
          showToast('success', 'Configuration saved');
        }
      },
      description: 'Save configuration'
    },
    {
      key: 'Tab',
      ctrl: true,
      action: () => {
        const currentIndex = modules.findIndex(m => m.key === active);
        const nextIndex = (currentIndex + 1) % modules.length;
        setActive(modules[nextIndex].key);
        showToast('info', `Switched to ${moduleDisplay[modules[nextIndex].key].title}`);
      },
      description: 'Next module'
    },
    {
      key: 'Tab',
      ctrl: true,
      shift: true,
      action: () => {
        const currentIndex = modules.findIndex(m => m.key === active);
        const prevIndex = (currentIndex - 1 + modules.length) % modules.length;
        setActive(modules[prevIndex].key);
        showToast('info', `Switched to ${moduleDisplay[modules[prevIndex].key].title}`);
      },
      description: 'Previous module'
    }
  ]);

  // Debounced config save for better performance
  const debouncedConfigSave = useMemo(
    () => debounce(async (configToSave: any) => {
      try {
        await api('/api/config', { method: 'POST', body: JSON.stringify(configToSave) });
        setSaveInfo('Tersimpan');
      } catch (e: any) {
        setSaveInfo(e.message || 'Gagal menyimpan');
      }
    }, 450),
    []
  );

  function scheduleConfigSave(next: any) {
    pendingConfig.current = next;
    setSaveInfo('Menyimpan...');
    debouncedConfigSave(next);
  }
  const updateConfig = useCallback((path: string, value: any) => { 
    setConfig((prev: any) => { 
      const next = setDeep(prev || config, path, value); 
      undoRedo.push(next); 
      scheduleConfigSave(next); 
      return next; 
    }); 
  }, [config, undoRedo]);
  
  const applyPreset = useCallback(async (id: string) => { 
    await api(`/api/presets/${id}/apply`, { method: 'POST' }); 
    await refresh(); 
  }, [refresh]);
  
  const savePreset = useCallback(async () => { 
    const name = prompt('Nama preset?') || 'Preset Baru'; 
    await api('/api/presets', { method: 'POST', body: JSON.stringify({ name, config }) }); 
    await refresh(); 
  }, [config, refresh]);
  
  // Memoized computed values
  const projectCount = useMemo(() => state?.projects?.length || 0, [state?.projects]);
  const queueCount = useMemo(() => state?.jobs?.length || 0, [state?.jobs]);
  const renderCount = useMemo(() => perf?.metrics?.activeRenders || 0, [perf?.metrics?.activeRenders]);
  const activeJob = useMemo(() => state?.jobs?.find(j => j.status === 'rendering'), [state?.jobs]);
  const systemReady = useMemo(() => Boolean(state && config), [state, config]);
  const statusText = useMemo(() => 
    activeJob ? `${activeJob.title} / ${activeJob.progress || 0}%` : 
    systemReady ? (saveInfo || 'Siap produksi') : 
    'Menghubungkan backend',
    [activeJob, systemReady, saveInfo]
  );
  const toneAccent: Record<string, string> = {
    cyan:   'text-[#62dbc1]',
    green:  'text-[#2dbb7f]',
    blue:   'text-[#4f8ef7]',
    amber:  'text-[#d9a65f]',
    violet: 'text-[#a855f7]',
    red:    'text-[#e76d78]',
  };

  return (
    <div className={cn('h-screen flex flex-col bg-gradient-to-br from-ds-bg-base via-ds-bg-base to-ds-bg-elevated text-ds-text overflow-hidden', systemReady ? 'appReady' : 'appLoading')}>
      {/* Topbar — premium 40px with 3D border */}
      <header className="h-10 shrink-0 flex items-center gap-4 px-4 bg-gradient-to-r from-ds-bg-elevated via-ds-bg-panel to-ds-bg-elevated border-b-2 border-ds-line-strong shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.4)] z-10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-ds-accent to-ds-purple flex items-center justify-center border-2 border-ds-accent-hover shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_12px_rgba(90,158,255,0.6),0_2px_4px_rgba(0,0,0,0.4)]">
            <span className="text-white text-[10px] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">P</span>
          </div>
          <span className="text-[12px] font-bold tracking-[0.08em] text-ds-title drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">PidioForge</span>
        </div>
        {/* Status indicator with 3D glow effect */}
        <div className="flex items-center gap-2 text-[11px] text-ds-muted">
          <span className={cn(
            'w-2 h-2 rounded-full border-2',
            activeJob ? 'bg-ds-danger border-ds-danger shadow-[0_0_12px_rgba(248,113,113,0.8),inset_0_1px_0_rgba(255,255,255,0.3)] animate-pulse' : systemReady ? 'bg-ds-success border-ds-success shadow-[0_0_12px_rgba(52,211,153,0.8),inset_0_1px_0_rgba(255,255,255,0.3)]' : 'bg-ds-muted border-ds-muted shadow-[0_0_8px_rgba(142,162,184,0.5)] animate-pulse'
          )} />
          <span className="truncate max-w-[200px] font-medium drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">{statusText}</span>
        </div>
        <div className="ml-auto"><UpdateBanner /></div>
      </header>

      {/* Main: icon-sidebar + settings-panel + preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Icon Sidebar — 56px premium with 3D borders */}
        <nav className="w-14 shrink-0 flex flex-col items-center gap-1.5 py-3 bg-gradient-to-b from-ds-bg-elevated via-ds-bg-panel to-ds-bg-elevated border-r-2 border-ds-line-strong overflow-y-auto shadow-[4px_0_12px_rgba(0,0,0,0.3)]">
          {modules.map(item => {
            const isActive = active === item.key;
            const tone = moduleUi[item.key].tone;
            return (
              <button
                key={item.key}
                title={moduleDisplay[item.key].title}
                aria-label={moduleDisplay[item.key].title}
                onClick={() => { setActive(item.key); if (!workspaceOpen) setWorkspaceOpen(true); }}
                className={cn(
                  'relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150 ease-out border-2 will-change-transform',
                  isActive
                    ? cn('bg-gradient-to-br from-ds-bg-panel-2 to-ds-bg-panel border-ds-line-strong shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_8px_rgba(0,0,0,0.4)]', toneAccent[tone] || 'text-ds-accent')
                    : 'text-ds-muted border-ds-line hover:text-ds-text hover:bg-ds-bg-hover hover:border-ds-line-strong hover:shadow-[0_2px_6px_rgba(0,0,0,0.3)]'
                )}
              >
                {isActive && (
                  <span className={cn('absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full shadow-[0_0_8px_currentColor]', `bg-current`)} />
                )}
                <i className="block w-5 h-5">
                  <ModuleIcon kind={moduleUi[item.key].icon} />
                </i>
              </button>
            );
          })}
        </nav>

        {/* Settings Panel — fixed 280px */}
        <SettingsPane
          title={moduleDisplay[active]?.title}
          collapsed={!workspaceOpen}
          onToggle={() => setWorkspaceOpen(!workspaceOpen)}
        >
          <SettingsPanel active={active} config={config} updateConfig={updateConfig} presets={state?.presets || []} applyPreset={applyPreset} savePreset={savePreset} />
        </SettingsPane>

        {/* Toggle button when panel closed */}
        {!workspaceOpen && (
          <button
            onClick={() => setWorkspaceOpen(true)}
            className="shrink-0 flex items-center justify-center w-6 bg-ds-bg-elevated border-r border-ds-line text-ds-muted hover:text-ds-text transition-colors"
            title="Buka panel settings"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}

        {/* Preview area — fills remaining */}
        <div className="flex-1 min-w-0 flex flex-col">
          <PreviewPane active={active} jobs={state?.jobs || []} logs={state?.logs || []} refresh={refresh} config={config} updateConfig={updateConfig} />
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Status bar — 28px premium with 3D border */}
      <footer className="h-7 shrink-0 flex items-center gap-4 px-4 bg-gradient-to-r from-ds-bg-elevated via-ds-bg-panel to-ds-bg-elevated border-t-2 border-ds-line-strong text-[11px] text-ds-muted shadow-[inset_0_-1px_0_rgba(255,255,255,0.08),0_-4px_12px_rgba(0,0,0,0.4)] backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-ds-success shadow-ds-success-glow"></span>
          <span className="font-medium">{perf?.performance?.mode || 'Seimbang'}</span>
          <span className="text-ds-subtle">·</span>
          <span className="text-ds-text">{perf?.encoder || 'encoder'}</span>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border-2 border-ds-line bg-ds-bg-panel shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.2)]">
            <span className="text-ds-subtle text-[10px]">CPU</span>
            <span className={cn('font-bold text-[11px]', (perf?.metrics?.cpu ?? 0) > 80 ? 'text-ds-warn drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]' : 'text-ds-text')}>{perf?.metrics?.cpu ?? 0}%</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border-2 border-ds-line bg-ds-bg-panel shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.2)]">
            <span className="text-ds-subtle text-[10px]">Mem</span>
            <span className={cn('font-bold text-[11px]', (perf?.metrics?.memory ?? 0) > 80 ? 'text-ds-warn drop-shadow-[0_0_4px_rgba(251,191,36,0.6)]' : 'text-ds-text')}>{perf?.metrics?.memory ?? 0}%</span>
          </div>
          <div className="w-px h-4 bg-ds-line-strong shadow-[1px_0_0_rgba(255,255,255,0.05)]"></div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border-2 border-ds-line bg-ds-bg-panel shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.2)]">
            <span className="text-ds-subtle text-[10px]">Proj</span>
            <span className="font-bold text-ds-text text-[11px]">{projectCount}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border-2 border-ds-line bg-ds-bg-panel shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.2)]">
            <span className="text-ds-subtle text-[10px]">Queue</span>
            <span className="font-bold text-ds-text text-[11px]">{queueCount}</span>
          </div>
          {renderCount > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-ds-danger-bg border-2 border-ds-danger shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_4px_8px_rgba(248,113,113,0.5),0_2px_4px_rgba(0,0,0,0.3)]">
              <span className="w-1.5 h-1.5 rounded-full bg-ds-danger border border-ds-danger animate-pulse shadow-[0_0_8px_rgba(248,113,113,0.8)]"></span>
              <span className="font-bold text-ds-danger text-[11px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Render {renderCount}</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

export function Meter({ label, value }: { label: string; value: number }) { return <div className="meter"><i><span style={{ width: `${value}%` }} /></i><p>{label}<small>{value}%</small></p></div>; }
