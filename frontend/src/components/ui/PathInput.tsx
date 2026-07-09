import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { humanSize, fileUrl, normalizeDroppedPath } from '../../utils/media';
import type { PathFilter, PathInfo, PathKind } from '../../types/app.types';

export function filtersFor(kind: PathFilter = 'media') {
  const map: Record<PathFilter, Array<{ name: string; extensions: string[] }>> = {
    media: [{ name: 'Media', extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi', 'mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg', 'jpg', 'jpeg', 'png', 'webp', 'bmp', 'lrc', 'srt'] }],
    visual: [{ name: 'Video/Gambar', extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi', 'jpg', 'jpeg', 'png', 'webp', 'bmp'] }],
    video: [{ name: 'Video', extensions: ['mp4', 'mov', 'mkv', 'webm', 'avi'] }],
    audio: [{ name: 'Audio', extensions: ['mp3', 'wav', 'aac', 'm4a', 'flac', 'ogg'] }],
    image: [{ name: 'Gambar', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] }],
    lyrics: [{ name: 'Lirik', extensions: ['lrc', 'srt', 'txt'] }],
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
    return JSON.parse(localStorage.getItem(recentKey(kind, filter)) || '[]').filter(Boolean).slice(0, 8);
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

export function PathInput({ value, onChange, placeholder, kind = 'file', filter = 'media' }: { value: string; onChange: (v: string) => void; placeholder?: string; kind?: PathKind; filter?: PathFilter }) {
  const [info, setInfo] = useState<PathInfo | null>(null);
  const [recent, setRecent] = useState<string[]>(() => readRecent(kind, filter));
  const [dragging, setDragging] = useState(false);
  const bridgeReady = Boolean(window.pidioforge?.pickPath);
  const currentType = info?.type || localPathType(value);
  const mismatch = Boolean(value && kind === 'file' && currentType && filter !== 'media' && !(filter === 'visual' && ['video', 'image'].includes(currentType)) && filter !== currentType);
  const canPreview = Boolean(value && kind === 'file' && ['video', 'audio', 'image'].includes(currentType));
  const statusText = !value ? '' : info?.warning || (mismatch ? `Tipe file ${currentType} tidak cocok untuk input ${expectedPathType(filter)}.` : '');
  const statusMeta = value && info ? [
    info.isDirectory ? 'folder' : info.isFile ? 'file' : info.type || currentType || '',
    info.size ? humanSize(info.size) : '',
    info.exists === false ? 'tidak ditemukan' : info.ok ? 'siap' : '',
  ].filter(Boolean).join(' / ') : '';

  function commitPath(next: string) {
    onChange(next);
    if (next) setRecent(writeRecent(kind, filter, next));
  }
  async function pick(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (!window.pidioforge?.pickPath) {
      alert('Pemilih file lokal belum aktif. Jalankan aplikasi lewat PidioForge Desktop/Electron, bukan dari browser biasa.');
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
    if (!value) { setInfo(null); return; }
    const t = setTimeout(async () => {
      try {
        const data = await api('/api/path/info', { method: 'POST', body: JSON.stringify({ path: value, kind, filter }) });
        if (!cancelled) {
          setInfo(data);
          if (data.ok) setRecent(writeRecent(kind, filter, value));
        }
      } catch {
        if (!cancelled) setInfo({ ok: false, warning: 'Backend belum siap untuk validasi path.' });
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [value, kind, filter]);
  return <div className={`pathBox ${dragging ? 'dragging' : ''} ${value && info && !info.ok ? 'invalid' : ''}`} style={{minWidth:0}} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
    <div className="file" style={{minWidth:0}}>
      <input value={value ?? ''} placeholder={placeholder || pickerPlaceholder(kind, filter)} onChange={e => onChange(e.target.value)} style={{minWidth:0}} />
      {recent.length ? <select className="recentSelect" value="" onChange={e => e.target.value && commitPath(e.target.value)} title="File/folder terakhir"><option value="">Recent</option>{recent.map(item => <option key={item} value={item}>{item.split(/[\\/]/).pop() || item}</option>)}</select> : null}
      <button type="button" onClick={pick} className={!bridgeReady ? 'pickerWarn' : ''} title={bridgeReady ? 'Buka penyimpanan lokal komputer' : 'Pemilih file aktif saat aplikasi dibuka lewat Electron'}>{pickerButtonLabel(kind, filter)}</button>
      <button type="button" className="miniPathBtn" onClick={reveal} disabled={!value} title="Buka lokasi file/folder di Explorer">Lokasi</button>
      <button type="button" className="miniPathBtn clearPathBtn" onClick={clear} disabled={!value} title="Kosongkan input">X</button>
    </div>
    {statusText ? <small className={info?.ok && !mismatch ? 'pathOk' : 'pathError'}>{statusText}</small> : null}
    {statusMeta ? <small className={info?.ok && !mismatch ? 'pathMeta okMeta' : 'pathMeta errorMeta'}>{statusMeta}</small> : null}
    {mismatch ? <small className="pathError">Input ini butuh {expectedPathType(filter)}, tapi file terbaca sebagai {currentType}.</small> : null}
    {canPreview ? <div className="pathPreview">
      {currentType === 'image' && <img src={fileUrl(value)} />}
      {currentType === 'video' && <video src={fileUrl(value)} muted controls />}
      {currentType === 'audio' && <audio src={fileUrl(value)} controls />}
      <span>{value.split(/[\\/]/).pop()}</span>
    </div> : null}
  </div>;
}
