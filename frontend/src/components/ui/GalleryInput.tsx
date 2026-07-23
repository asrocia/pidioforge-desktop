import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { fileUrl, normalizeDroppedPath, humanSize } from '../../utils/media';
import { cn } from '../../utils/cn';
import type { PathFilter } from '../../types/app.types';

interface GalleryItem {
  path: string;
  name: string;
  size?: number;
  type?: 'image' | 'video' | 'unknown';
  error?: string;
}

interface GalleryInputProps {
  images: string[];
  onChange: (images: string[]) => void;
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
  filter?: PathFilter;
  placeholder?: string;
  className?: string;
  maxCount?: number;
}

export function GalleryInput({
  images: rawPaths,
  onChange,
  activeIndex = 0,
  onActiveChange,
  filter = 'visual',
  placeholder = 'Tambah gambar untuk gallery',
  className = '',
  maxCount = 50,
}: GalleryInputProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // Convert paths to items dengan validation
  useEffect(() => {
    const updateItems = async () => {
      const newItems: GalleryItem[] = [];
      for (const path of rawPaths) {
        // Cari item yang sudah ada untuk reuse info
        const existing = items.find(item => item.path === path);
        if (existing) {
          newItems.push(existing);
          continue;
        }

        // Buat item sementara
        newItems.push({
          path,
          name: path.split(/[\\/]/).pop() || path,
          type: 'unknown',
        });

        // Fetch info dari backend
        try {
          setLoading(prev => ({ ...prev, [path]: true }));
          const data = await api('/api/path/info', {
            method: 'POST',
            body: JSON.stringify({ path, kind: 'file', filter }),
          });

          const itemIndex = newItems.findIndex(item => item.path === path);
          if (itemIndex >= 0) {
            const ext = path.toLowerCase().split('.').pop();
            const isImage = ext && ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'].includes(ext);
            const isVideo = ext && ['mp4', 'mov', 'mkv', 'webm', 'avi'].includes(ext);

            newItems[itemIndex] = {
              path,
              name: data.name || newItems[itemIndex].name,
              size: data.size,
              type: isImage ? 'image' : isVideo ? 'video' : 'unknown',
              error: data.warning || (data.ok ? undefined : 'File tidak valid'),
            };
          }
        } catch {
          const itemIndex = newItems.findIndex(item => item.path === path);
          if (itemIndex >= 0) {
            newItems[itemIndex].error = 'Validasi gagal';
          }
        } finally {
          setLoading(prev => ({ ...prev, [path]: false }));
        }
      }

      setItems(newItems);
    };

    updateItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawPaths, filter]);

  async function pickImages() {
    if (!window.pidioforge?.pickPaths) {
      alert('Multi-select hanya tersedia di aplikasi desktop. Jalankan PidioForge Desktop.');
      return;
    }

    try {
      const paths = await window.pidioforge.pickPaths({
        kind: 'file',
        title: 'Pilih gambar untuk gallery',
        defaultPath: rawPaths[0] || undefined,
        filters: [
          {
            name: 'Video/Gambar',
            extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi', 'jpg', 'jpeg', 'png', 'webp', 'bmp'],
          },
        ],
      });

      if (paths.length === 0) return;

      // Filter untuk menghindari duplikat
      const newPaths = [...rawPaths];
      let added = 0;
      for (const path of paths) {
        if (!newPaths.includes(path) && newPaths.length < maxCount) {
          newPaths.push(path);
          added++;
        }
      }

      if (added > 0) {
        onChange(newPaths);
        // Auto set active ke gambar pertama yang baru jika belum ada active
        if (activeIndex < 0 && newPaths.length > 0) {
          onActiveChange?.(0);
        }
      }
    } catch (error) {
      console.error('Gagal memilih gambar', error);
      alert('Gagal membuka dialog pemilih file.');
    }
  }

  function removeImage(index: number) {
    const newPaths = [...rawPaths];
    newPaths.splice(index, 1);
    onChange(newPaths);

    // Adjust active index jika dihapus
    if (activeIndex >= newPaths.length && newPaths.length > 0) {
      onActiveChange?.(newPaths.length - 1);
    } else if (activeIndex === index) {
      onActiveChange?.(Math.max(0, index - 1));
    }
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    setDraggedId(`${index}`);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index.toString() !== draggedId) {
      setDragOverId(`${index}`);
    }
  }

  function handleDragLeave() {
    setDragOverId(null);
  }

  function handleDrop(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    setDragOverId(null);

    if (!draggedId) return;
    const fromIndex = parseInt(draggedId);
    if (fromIndex === targetIndex) return;

    const newPaths = [...rawPaths];
    const [moved] = newPaths.splice(fromIndex, 1);
    newPaths.splice(targetIndex, 0, moved);
    onChange(newPaths);

    // Update active index jika berpindah
    if (activeIndex === fromIndex) {
      onActiveChange?.(targetIndex);
    } else if (activeIndex === targetIndex) {
      onActiveChange?.(fromIndex);
    }

    setDraggedId(null);
  }

  function handleDragEnd() {
    setDraggedId(null);
    setDragOverId(null);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const dropped = e.dataTransfer.files;
    if (!dropped.length) return;

    const newPaths = [...rawPaths];
    let added = 0;

    for (let i = 0; i < dropped.length && newPaths.length < maxCount; i++) {
      const file = dropped[i] as File & { path?: string };
      const path =
        file.path ||
        normalizeDroppedPath(e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain'));
      if (path && !newPaths.includes(path)) {
        newPaths.push(path);
        added++;
      }
    }

    if (added > 0) {
      onChange(newPaths);
      if (activeIndex < 0 && newPaths.length > 0) {
        onActiveChange?.(0);
      }
    }
  }

  const isEmpty = rawPaths.length === 0;
  const canAdd = rawPaths.length < maxCount;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop Zone */}
      <div
        className={cn(
          'p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors',
          dragging
            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
            : isEmpty
              ? 'border-[var(--border-medium)] bg-[var(--tertiary-bg)] hover:bg-[var(--tertiary-bg)]/80'
              : 'border-[var(--border-subtle)] bg-transparent hover:bg-[var(--tertiary-bg)]',
        )}
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={isEmpty ? pickImages : undefined}
      >
        {isEmpty ? (
          <div className="space-y-2">
            <div className="text-3xl text-[var(--text-muted)]">📷</div>
            <p className="text-sm font-medium text-[var(--text-primary)]">{placeholder}</p>
            <p className="text-xs text-[var(--text-muted)]">Klik atau drag & drop gambar (max {maxCount})</p>
            <button
              type="button"
              onClick={pickImages}
              className="mt-3 px-4 py-2 text-sm font-semibold bg-[var(--accent-primary)] text-white rounded-md hover:bg-[var(--accent-primary)]/90 transition-colors"
            >
              Tambah Gambar
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm text-[var(--text-muted)]">Drag gambar ke sini untuk menambah ke gallery</p>
          </div>
        )}
      </div>

      {/* Thumbnail Grid */}
      {!isEmpty && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">{rawPaths.length} gambar dalam gallery</p>
            <button
              type="button"
              onClick={pickImages}
              disabled={!canAdd}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-md transition-colors',
                canAdd
                  ? 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90'
                  : 'bg-[var(--tertiary-bg)] text-[var(--text-muted)] cursor-not-allowed',
              )}
            >
              + Tambah ({maxCount - rawPaths.length} tersisa)
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {items.map((item, index) => {
              const isActive = index === activeIndex;
              const isLoading = loading[item.path];
              const isDragged = `${index}` === draggedId;
              const isDragOver = `${index}` === dragOverId;

              return (
                <div
                  key={item.path}
                  className={cn(
                    'relative group rounded-md overflow-hidden border-2 transition-all',
                    isActive
                      ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20'
                      : isDragOver
                        ? 'border-[var(--accent-primary)] border-dashed'
                        : isDragged
                          ? 'border-[var(--accent-warning)] opacity-50'
                          : 'border-[var(--border-medium)] hover:border-[var(--border-strong)]',
                  )}
                  draggable
                  onDragStart={e => handleDragStart(e, index)}
                  onDragOver={e => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onActiveChange?.(index)}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-[var(--tertiary-bg)] relative">
                    {item.type === 'image' ? (
                      <img src={fileUrl(item.path)} alt={item.name} className="w-full h-full object-cover" />
                    ) : item.type === 'video' ? (
                      <video src={fileUrl(item.path)} className="w-full h-full object-cover" muted playsInline />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                        {isLoading ? '⋯' : '📁'}
                      </div>
                    )}

                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute top-1 right-1 w-3 h-3 bg-[var(--accent-primary)] rounded-full ring-2 ring-white" />
                    )}

                    {/* Loading Overlay */}
                    {isLoading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}

                    {/* Error Overlay */}
                    {item.error && !isLoading && (
                      <div className="absolute inset-0 bg-[var(--accent-danger)]/20 flex items-center justify-center">
                        <div className="text-xs text-white bg-[var(--accent-danger)] px-1 rounded">⚠</div>
                      </div>
                    )}

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="absolute top-1 left-1 w-5 h-5 bg-[var(--accent-danger)] text-white text-xs rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--accent-danger)]/90"
                    >
                      ×
                    </button>
                  </div>

                  {/* Info */}
                  <div className="p-1.5 bg-[var(--secondary-bg)]">
                    <p className="text-xs font-medium truncate text-[var(--text-primary)]">{item.name}</p>
                    {item.size && (
                      <p className="text-[10px] text-[var(--text-muted)] truncate">{humanSize(item.size)}</p>
                    )}
                    {item.error && <p className="text-[10px] text-[var(--accent-danger)] truncate">{item.error}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drag Instructions */}
          <div className="text-xs text-[var(--text-muted)] text-center">
            Drag gambar untuk mengubah urutan • Klik untuk preview • × untuk hapus
          </div>
        </div>
      )}
    </div>
  );
}
