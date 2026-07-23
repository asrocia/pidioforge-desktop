import React, { useState } from 'react';
import { cn } from '../../utils/cn';

const LAYER_LABELS: Record<string, { label: string; icon: string }> = {
  bumper: { label: 'Bumper', icon: '🎬' },
  particle: { label: 'Particle', icon: '✨' },
  logo: { label: 'Logo', icon: '🏷️' },
  cta: { label: 'CTA', icon: '📢' },
  spectrum: { label: 'Spectrum', icon: '🎵' },
  lyrics: { label: 'Lirik', icon: '📝' },
  watermark: { label: 'Watermark', icon: '💧' },
  nowPlaying: { label: 'Now Playing', icon: '🎶' },
  timestamp: { label: 'Timestamp', icon: '🕒' },
  lowerThird: { label: 'Lower Third', icon: '📺' },
};

interface LayerOrderInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function LayerOrderInput({ value, onChange, className }: LayerOrderInputProps) {
  const layers = value.split(',').filter(Boolean);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set(layers));

  function handleDragStart(e: React.DragEvent, index: number) {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index !== draggedIndex) setDragOverIndex(index);
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  function handleDrop(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    setDragOverIndex(null);
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const reordered = [...layers];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    onChange(reordered.join(','));
    setDraggedIndex(null);
  }

  function handleDragEnd() {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }

  function toggleLayer(layer: string) {
    const next = new Set(selected);
    if (next.has(layer)) {
      next.delete(layer);
    } else {
      next.add(layer);
    }
    setSelected(next);

    // Rebuild value: keep order, filter to selected
    const allLayers = Object.keys(LAYER_LABELS);
    const currentOrder = layers.filter(l => next.has(l));
    const newLayers = allLayers.filter(l => next.has(l) && !currentOrder.includes(l));
    onChange([...currentOrder, ...newLayers].join(','));
  }

  function moveLayer(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= layers.length) return;
    const reordered = [...layers];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    onChange(reordered.join(','));
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Active layers — drag reorder */}
      <div className="space-y-1">
        {layers.map((layer, index) => {
          const info = LAYER_LABELS[layer] || { label: layer, icon: '📦' };
          const isDragged = index === draggedIndex;
          const isDragOver = index === dragOverIndex;

          return (
            <div
              key={layer}
              draggable
              onDragStart={e => handleDragStart(e, index)}
              onDragOver={e => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                'flex items-center gap-2 px-2.5 py-1.5 rounded-[var(--radius-md)] border cursor-grab transition-all text-[11px]',
                isDragOver
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 scale-[1.01]'
                  : isDragged
                    ? 'border-[var(--accent-warning)] opacity-50'
                    : 'border-[var(--border-subtle)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80',
              )}
            >
              <span className="text-[var(--text-muted)] select-none cursor-grab">⠿</span>
              <span className="text-sm">{info.icon}</span>
              <span className="font-medium text-[var(--text-primary)] flex-1">{info.label}</span>
              <span className="text-[9px] text-[var(--text-muted)] tabular-nums w-4 text-center">{index + 1}</span>
              <button
                type="button"
                onClick={() => moveLayer(index, -1)}
                disabled={index === 0}
                className="w-5 h-5 flex items-center justify-center text-[10px] rounded hover:bg-[var(--secondary-bg)] disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={`Pindah ${info.label} ke atas`}
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => moveLayer(index, 1)}
                disabled={index === layers.length - 1}
                className="w-5 h-5 flex items-center justify-center text-[10px] rounded hover:bg-[var(--secondary-bg)] disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={`Pindah ${info.label} ke bawah`}
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => toggleLayer(layer)}
                className="w-5 h-5 flex items-center justify-center text-[10px] text-[var(--accent-danger)] rounded hover:bg-[var(--accent-danger)]/10"
                aria-label={`Hapus layer ${info.label}`}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      {/* Inactive layers — click to add */}
      {Object.keys(LAYER_LABELS).filter(l => !layers.includes(l)).length > 0 && (
        <div className="flex gap-1.5 flex-wrap pt-1 border-t border-[var(--border-subtle)]">
          {Object.entries(LAYER_LABELS)
            .filter(([key]) => !layers.includes(key))
            .map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleLayer(key)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[var(--text-muted)] bg-[var(--secondary-bg)] border border-dashed border-[var(--border-medium)] rounded-[var(--radius-md)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] transition-colors"
              >
                <span>{info.icon}</span>
                <span>+ {info.label}</span>
              </button>
            ))}
        </div>
      )}

      {/* Hint */}
      <p className="text-[9px] text-[var(--text-muted)]">
        Drag untuk mengatur urutan render semua layer, termasuk teks (lirik, watermark, now playing, timestamp, lower
        third). Layer di bawah tampil di atas layer sebelumnya.
      </p>
    </div>
  );
}
