import { cn } from '../../utils/cn';
import { ActionButtonGroup } from './design-system-components';
import type { LiveTarget } from '../../types/preview.types';

type LiveLayer = { id: LiveTarget; label: string; enabled: boolean; primary?: boolean };

interface PreviewLayerSourcePanelProps {
  liveLayers: LiveLayer[];
  selectedLive: LiveTarget | '';
  lockedLayers: Set<LiveTarget>;
  onToggleLayerVisibility: (id: LiveTarget) => void;
  onSelectLive: (id: LiveTarget) => void;
  onCenterLiveLayer: (id: LiveTarget) => void;
  onToggleLayerLock: (id: LiveTarget) => void;
  onResetSelectedLayer: () => void;
  canResetSelectedLayer: boolean;
  showSafeArea: boolean;
  showGrid: boolean;
  onToggleSafeArea: () => void;
  onToggleGrid: () => void;
  contextPanel: React.ReactNode;
}

export function PreviewLayerSourcePanel({
  liveLayers,
  selectedLive,
  lockedLayers,
  onToggleLayerVisibility,
  onSelectLive,
  onCenterLiveLayer,
  onToggleLayerLock,
  onResetSelectedLayer,
  canResetSelectedLayer,
  showSafeArea,
  showGrid,
  onToggleSafeArea,
  onToggleGrid,
  contextPanel,
}: PreviewLayerSourcePanelProps) {
  return (
    <div className="bg-[var(--tertiary-bg)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-3 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-semibold text-[var(--text-primary)]">Sources</h3>
        <span className="text-[11px] text-[var(--text-muted)]">
          {selectedLive ? liveLayers.find(x => x.id === selectedLive)?.label : 'Pilih layer'}
        </span>
      </div>
      <div className="flex flex-col gap-1 mb-2">
        {liveLayers.map(layer => {
          const isLocked = lockedLayers.has(layer.id);
          return (
            <div
              key={layer.id}
              className={cn(
                'flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] border transition-all',
                selectedLive === layer.id
                  ? 'bg-[var(--accent-primary)]/15 border-[var(--accent-primary)]'
                  : 'bg-[var(--surface)] border-[var(--border-medium)] hover:bg-[var(--surface-hover)]',
              )}
            >
              <button
                type="button"
                onClick={() => onToggleLayerVisibility(layer.id)}
                title={layer.enabled ? 'Sembunyikan layer' : 'Tampilkan layer'}
                className={cn(
                  'shrink-0 min-w-[54px] h-7 px-2 flex items-center justify-center rounded-[var(--radius-sm)] text-[10px] font-bold transition-all border',
                  layer.enabled
                    ? 'text-[var(--accent-success)] border-[var(--accent-success)]/30 bg-[var(--accent-success)]/10 hover:bg-[var(--accent-success)]/15'
                    : 'text-[var(--text-muted)] border-[var(--border-medium)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]',
                )}
              >
                {layer.enabled ? 'SHOW' : 'HIDE'}
              </button>
              <button
                type="button"
                disabled={!layer.enabled || isLocked}
                onClick={() => onSelectLive(layer.id)}
                onDoubleClick={() => onCenterLiveLayer(layer.id)}
                className={cn(
                  'flex-1 text-left text-[11px] font-semibold truncate',
                  !layer.enabled && 'opacity-50',
                  isLocked
                    ? 'cursor-not-allowed text-[var(--text-muted)]'
                    : 'text-[var(--text-primary)] cursor-pointer',
                  layer.primary && layer.enabled && selectedLive !== layer.id && 'text-[var(--accent-success)]',
                )}
              >
                {layer.label}
              </button>
              <button
                type="button"
                onClick={() => onToggleLayerLock(layer.id)}
                title={isLocked ? 'Buka kunci layer' : 'Kunci layer'}
                className={cn(
                  'shrink-0 min-w-[54px] h-7 px-2 flex items-center justify-center rounded-[var(--radius-sm)] text-[10px] font-bold transition-all border',
                  isLocked
                    ? 'text-[var(--accent-warning)] border-[var(--accent-warning)]/30 bg-[var(--accent-warning)]/10 hover:bg-[var(--accent-warning)]/15'
                    : 'text-[var(--text-muted)] border-[var(--border-medium)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]',
                )}
              >
                {isLocked ? 'LOCK' : 'FREE'}
              </button>
            </div>
          );
        })}
      </div>
      <ActionButtonGroup
        actions={[
          {
            id: 'reset-layer',
            label: 'Reset',
            icon: '🔄',
            variant: 'secondary',
            disabled: !canResetSelectedLayer,
            onClick: onResetSelectedLayer,
          },
          {
            id: 'safe-area',
            label: showSafeArea ? 'Safe Aktif' : 'Safe Mati',
            icon: '🛟',
            variant: 'secondary',
            onClick: onToggleSafeArea,
          },
          {
            id: 'grid',
            label: showGrid ? 'Grid Aktif' : 'Grid Mati',
            icon: '📐',
            variant: 'secondary',
            onClick: onToggleGrid,
          },
        ]}
      />
      {contextPanel}
    </div>
  );
}
