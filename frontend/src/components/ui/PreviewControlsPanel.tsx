interface PreviewControlsPanelProps {
  quality: string;
  onQualityChange: (value: string) => void;
  safePreset: string;
  onSafePresetChange: (value: string) => void;
  zoom: string;
  onZoomChange: (value: string) => void;
  showModeToggle: boolean;
  previewMode: 'live' | 'rendered';
  onToggleMode: () => void;
}

export function PreviewControlsPanel({
  quality,
  onQualityChange,
  safePreset,
  onSafePresetChange,
  zoom,
  onZoomChange,
  showModeToggle,
  previewMode,
  onToggleMode,
}: PreviewControlsPanelProps) {
  return (
    <div className="bg-[var(--tertiary-bg)] border-2 border-[var(--border-medium)] rounded-lg p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_6px_rgba(0,0,0,0.25)]">
      <h3 className="text-[11px] font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide">
        ⚙️ Kontrol Preview
      </h3>
      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Mutu</span>
          <select
            value={quality}
            onChange={e => onQualityChange(e.target.value)}
            className="bg-[var(--surface)] border-2 border-[var(--border-medium)] rounded-md text-[var(--text-primary)] text-[11px] h-8 px-2 hover:border-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
          >
            <option value="draft">Draf</option>
            <option value="normal">Normal</option>
            <option value="high">Tinggi</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Area Aman</span>
          <select
            value={safePreset}
            onChange={e => onSafePresetChange(e.target.value)}
            className="bg-[var(--surface)] border-2 border-[var(--border-medium)] rounded-md text-[var(--text-primary)] text-[11px] h-8 px-2 hover:border-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
          >
            <option value="youtube">YouTube</option>
            <option value="shorts">Shorts</option>
            <option value="square">Square</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] text-[var(--text-muted)] font-semibold uppercase">Zoom</span>
          <select
            value={zoom}
            onChange={e => onZoomChange(e.target.value)}
            className="bg-[var(--surface)] border-2 border-[var(--border-medium)] rounded-md text-[var(--text-primary)] text-[11px] h-8 px-2 hover:border-[var(--accent-primary)] focus:border-[var(--accent-primary)] transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]"
          >
            <option>100</option>
            <option>75</option>
            <option>50</option>
          </select>
        </label>
      </div>
      {showModeToggle && (
        <button
          onClick={onToggleMode}
          className="w-full mt-2 px-4 py-2 bg-[var(--surface)] border-2 border-[var(--border-medium)] text-[var(--text-primary)] rounded-md text-[11px] font-bold hover:bg-[var(--surface-hover)] hover:border-[var(--accent-primary)] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_2px_4px_rgba(0,0,0,0.2)]"
        >
          {previewMode === 'live' ? '🎬 Tampilkan Hasil Render' : '📁 Tampilkan Live File'}
        </button>
      )}
    </div>
  );
}
