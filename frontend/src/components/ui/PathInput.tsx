/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { humanSize, fileUrl, normalizeDroppedPath } from '../../utils/media';
import type { PathFilter, PathInfo, PathKind } from '../../types/app.types';

export function filtersFor(kind: PathFilter = 'media') {
  const map: Record<PathFilter, Array<{ name: string; extensions: string[] }>> = {
    media: [
      {
        name: 'Media',
        extensions: [
          'mp4',
          'mov',
          'mkv',
          'webm',
          'avi',
          'mp3',
          'wav',
          'aac',
          'm4a',
          'flac',
          'ogg',
          'jpg',
          'jpeg',
          'png',
          'webp',
          'bmp',
          'lrc',
          'srt',
        ],
      },
    ],
    visual: [
      { name: 'Video/Gambar', extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi', 'jpg', 'jpeg', 'png', 'webp', 'bmp'] },
    ],
    video: [{ name: 'Video', extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi'] }],
    audio: [{ name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg'] }],
    image: [{ name: 'Gambar', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] }],
    lyrics: [{ name: 'Lirik', extensions: ['lrc', 'srt', 'txt'] }],
    lut: [{ name: 'LUT File', extensions: ['cube', '3dl'] }],
  };
  return [...map[kind], { name: 'Semua File', extensions: ['*'] }];
}

export function pickerButtonLabel(kind: PathKind, filter: PathFilter): string {
  if (kind === 'directory') return 'Buka Folder';
  if (kind === 'save') return 'Simpan Ke';
  const labels: Record<PathFilter, string> = {
    media: 'Pilih Media',
    visual: 'Pilih Visual',
    video: 'Pilih Video',
    audio: 'Pilih Audio',
    image: 'Pilih Gambar',
    lyrics: 'Pilih Lirik',
    lut: 'Pilih LUT',
  };
  return labels[filter] || 'Pilih File';
}

function pickerTitle(kind: PathKind, filter: PathFilter): string {
  if (kind === 'directory') return 'Pilih folder dari komputer';
  if (kind === 'save') return 'Pilih lokasi penyimpanan output';
  return pickerButtonLabel(kind, filter).replace('Pilih', 'Pilih file');
}

function pickerPlaceholder(kind: PathKind, filter: PathFilter): string {
  if (kind === 'directory') return 'Klik Buka Folder untuk memilih folder';
  if (kind === 'save') return 'Klik Simpan Ke untuk menentukan lokasi output';
  return `Klik ${pickerButtonLabel(kind, filter)} untuk memilih dari galeri/penyimpanan`;
}

function recentKey(kind: PathKind, filter: PathFilter): string {
  return `pidioforge.recent.${kind}.${filter}`;
}

function readRecent(kind: PathKind, filter: PathFilter): string[] {
  try {
    return JSON.parse(localStorage.getItem(recentKey(kind, filter)) || '[]')
      .filter(Boolean)
      .slice(0, 8);
  } catch {
    return [];
  }
}

function writeRecent(kind: PathKind, filter: PathFilter, picked: string): string[] {
  if (!picked) return readRecent(kind, filter);
  const next = [picked, ...readRecent(kind, filter).filter((item: string) => item !== picked)].slice(0, 8);
  localStorage.setItem(recentKey(kind, filter), JSON.stringify(next));
  return next;
}

function expectedPathType(filter: PathFilter): string {
  if (filter === 'visual') return 'video/gambar';
  if (filter === 'media') return 'media';
  if (filter === 'lyrics') return 'lirik';
  if (filter === 'lut') return 'LUT file';
  return filter;
}

function localPathType(file = ''): string {
  const ext = String(file).split('.').pop()?.toLowerCase() || '';
  if (['mp4', 'mov', 'mkv', 'webm', 'avi'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg'].includes(ext)) return 'audio';
  if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'].includes(ext)) return 'image';
  if (['lrc', 'srt', 'txt'].includes(ext)) return 'lyrics';
  return ext ? 'file' : '';
}

function statusTone(info: PathInfo | null, mismatch: boolean, value: string): 'success' | 'warning' | 'error' | 'idle' {
  if (!value) return 'idle';
  if (mismatch) return 'error';
  if (info?.ok) return 'success';
  if (info?.warning) return 'warning';
  return 'error';
}

export function PathInput({
  value,
  onChange,
  placeholder,
  kind = 'file',
  filter = 'media',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  kind?: PathKind;
  filter?: PathFilter;
}) {
  const [info, setInfo] = useState<PathInfo | null>(null);
  const [recent, setRecent] = useState<string[]>(() => readRecent(kind, filter));
  const [dragging, setDragging] = useState(false);
  const bridgeReady = Boolean(window.pidioforge?.pickPath);
  const currentType = info?.type || localPathType(value);
  const mismatch = Boolean(
    value &&
    kind === 'file' &&
    currentType &&
    filter !== 'media' &&
    !(filter === 'visual' && ['video', 'image'].includes(currentType)) &&
    filter !== currentType,
  );
  const canPreview = Boolean(value && kind === 'file' && ['video', 'audio', 'image'].includes(currentType));
  const statusText = !value
    ? ''
    : info?.warning ||
      (mismatch
        ? `Tipe file ${currentType} tidak cocok untuk input ${expectedPathType(filter)}.`
        : 'File siap dipakai');
  const statusMeta =
    value && info
      ? [
          info.isDirectory ? 'folder' : info.isFile ? 'file' : info.type || currentType || '',
          info.size ? humanSize(info.size) : '',
          info.exists === false ? 'tidak ditemukan' : info.ok ? 'siap' : '',
        ]
          .filter(Boolean)
          .join(' / ')
      : '';
  const tone = statusTone(info, mismatch, value);
  const isEmpty = !value;
  const fileName = value.split(/[\\/]/).pop() || value;
  const showRecent = recent.length > 0;

  function commitPath(next: string) {
    onChange(next);
    if (next) setRecent(writeRecent(kind, filter, next));
  }

  async function pick(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (!window.pidioforge?.pickPath) {
      alert(
        'Pemilih file lokal belum aktif. Jalankan aplikasi lewat PidioForge Desktop/Electron, bukan dari browser biasa.',
      );
      return;
    }
    try {
      const picked = await window.pidioforge.pickPath({
        kind,
        defaultPath: value || undefined,
        title: pickerTitle(kind, filter),
        filters: kind === 'directory' ? undefined : filtersFor(filter),
      });
      if (picked) commitPath(picked);
    } catch (error) {
      console.error('Gagal membuka pemilih file lokal', error);
      alert('Gagal membuka penyimpanan lokal. Tutup aplikasi lalu buka lagi lewat PidioForge Desktop.');
    }
  }

  async function reveal(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!value) return;
    if (!window.pidioforge?.revealPath) {
      alert('Buka lokasi file hanya tersedia di aplikasi desktop.');
      return;
    }
    const result = await window.pidioforge.revealPath(value);
    if (!result?.ok) alert(result?.error || 'Lokasi file tidak bisa dibuka.');
  }

  function clear(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
    setInfo(null);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const file = e.dataTransfer.files?.[0] as File & { path?: string };
    const dropped = file?.path || e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
    if (!dropped) {
      alert('Drag & drop file lokal hanya tersedia saat berjalan di aplikasi desktop.');
      return;
    }
    commitPath(normalizeDroppedPath(dropped));
  }

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (!value) {
        setInfo(null);
        return;
      }

      try {
        const data = await api('/api/path/info', {
          method: 'POST',
          body: JSON.stringify({ path: value, kind, filter }),
        });
        if (!cancelled) {
          setInfo(data);
          if (data.ok) setRecent(writeRecent(kind, filter, value));
        }
      } catch {
        if (!cancelled) setInfo({ ok: false, warning: 'Backend belum siap untuk validasi path.' });
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value, kind, filter]);

  return (
    <div className="w-full min-w-0 overflow-x-hidden space-y-2">
      <div
        className={`w-full min-w-0 rounded-[var(--radius-md)] border-2 transition-all ${
          dragging
            ? 'border-[var(--accent-primary)] bg-[rgba(59,130,246,0.08)] border-dashed'
            : isEmpty
              ? 'border-[var(--border-medium)] bg-[var(--tertiary-bg)] border-dashed'
              : tone === 'error'
                ? 'border-[var(--accent-danger)]/40 bg-[var(--secondary-bg)]'
                : tone === 'warning'
                  ? 'border-[var(--accent-warning)]/40 bg-[var(--secondary-bg)]'
                  : 'border-[var(--border-subtle)] bg-[var(--secondary-bg)]'
        }`}
        onDragOver={e => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div className="w-full min-w-0 p-3 space-y-2">
          <button
            type="button"
            onClick={pick}
            className={`w-full min-w-0 px-4 py-2.5 rounded-[var(--radius-sm)] text-[13px] font-bold border transition-all ${
              !bridgeReady
                ? 'bg-[var(--accent-warning)] border-[var(--accent-warning-hover)] text-white hover:bg-[var(--accent-warning-hover)]'
                : 'bg-[var(--accent-primary)] border-[var(--accent-primary-hover)] text-white hover:bg-[var(--accent-primary-hover)]'
            }`}
            title={
              bridgeReady ? 'Buka penyimpanan lokal komputer' : 'Pemilih file aktif saat aplikasi dibuka lewat Electron'
            }
          >
            {kind === 'directory'
              ? '📁 '
              : filter === 'visual'
                ? '🎬 '
                : filter === 'audio'
                  ? '🎵 '
                  : filter === 'lyrics'
                    ? '📝 '
                    : '📄 '}
            {pickerButtonLabel(kind, filter)}
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={reveal}
              disabled={!value}
              className="flex-1 min-w-[120px] px-3 py-2 rounded-[var(--radius-sm)] text-[12px] font-semibold bg-[var(--surface)] border border-[var(--border-medium)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Buka lokasi file/folder di Explorer"
            >
              📁 Lokasi
            </button>
            <button
              type="button"
              onClick={clear}
              disabled={!value}
              className="flex-1 min-w-[120px] px-3 py-2 rounded-[var(--radius-sm)] text-[12px] font-semibold bg-[var(--accent-danger)] border border-[var(--accent-danger-hover)] text-white hover:bg-[var(--accent-danger-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              title="Kosongkan input"
            >
              ✕ Hapus
            </button>
            {showRecent && (
              <select
                className="w-full min-w-0 bg-[var(--surface)] border border-[var(--border-medium)] rounded-[var(--radius-sm)] text-[var(--text-primary)] text-[12px] min-h-[36px] px-2 py-2 cursor-pointer hover:border-[var(--border-strong)] transition-all"
                value=""
                onChange={e => e.target.value && commitPath(e.target.value)}
                title="File/folder terakhir"
              >
                <option value="">Recent</option>
                {recent.map(item => (
                  <option key={item} value={item}>
                    {item.split(/[\\/]/).pop() || item}
                  </option>
                ))}
              </select>
            )}
          </div>

          {!isEmpty && (
            <div
              className={`w-full rounded-[var(--radius-sm)] px-3 py-2 text-[12px] font-medium ${
                tone === 'success'
                  ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)] border border-[var(--accent-success)]/20'
                  : tone === 'warning'
                    ? 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)] border border-[var(--accent-warning)]/20'
                    : 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)] border border-[var(--accent-danger)]/20'
              }`}
            >
              <div className="break-words whitespace-normal">{statusText}</div>
              {statusMeta && (
                <div className="mt-1 text-[11px] opacity-80 break-words whitespace-normal">{statusMeta}</div>
              )}
            </div>
          )}

          {canPreview && !isEmpty && (
            <div className="w-full min-w-0 flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--border-medium)] bg-[var(--surface)] p-2">
              {currentType === 'image' && (
                <img
                  src={fileUrl(value)}
                  className="w-16 h-16 object-cover rounded-[var(--radius-sm)] flex-shrink-0"
                  alt="Preview"
                />
              )}
              {currentType === 'video' && (
                <video
                  src={fileUrl(value)}
                  muted
                  controls
                  className="w-16 h-16 object-cover rounded-[var(--radius-sm)] flex-shrink-0"
                />
              )}
              {currentType === 'audio' && (
                <div className="w-16 h-16 flex-shrink-0 rounded-[var(--radius-sm)] bg-[var(--tertiary-bg)] flex items-center justify-center text-[24px]">
                  🎵
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="text-[12px] font-semibold text-[var(--text-primary)] break-all">{fileName}</div>
                <div className="text-[11px] text-[var(--text-muted)] break-all">{value}</div>
                {info?.size ? (
                  <div className="text-[11px] text-[var(--text-secondary)]">{humanSize(info.size)}</div>
                ) : null}
                {currentType === 'audio' && <audio src={fileUrl(value)} controls className="w-full h-9 mt-1" />}
              </div>
            </div>
          )}

          {isEmpty && (
            <div className="text-[12px] text-[var(--text-muted)] break-words whitespace-normal">
              {placeholder || pickerPlaceholder(kind, filter)}
            </div>
          )}
        </div>
      </div>

      {mismatch && (
        <div className="w-full rounded-[var(--radius-md)] border border-[var(--accent-danger)]/30 bg-[var(--accent-danger)]/10 px-3 py-2 text-[12px] text-[var(--accent-danger)] break-words whitespace-normal">
          Input ini butuh {expectedPathType(filter)}, tapi file terbaca sebagai {currentType}.
        </div>
      )}
    </div>
  );
}
