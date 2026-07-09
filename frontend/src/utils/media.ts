import { API_BASE_URL } from '../lib/api';
import { getDeep } from '../lib/config-path';

const API = API_BASE_URL;

export function fileUrl(file = ''): string {
  if (!file) return '';
  if (/^https?:\/\//i.test(file)) return file;
  if (/^file:\/\//i.test(file)) return `${API}/api/media/file?path=${encodeURIComponent(normalizeDroppedPath(file))}`;
  return `${API}/api/media/file?path=${encodeURIComponent(file)}`;
}

export function mediaKind(file = ''): string {
  const ext = String(file).split('.').pop()?.toLowerCase() || '';
  if (['mp4', 'mov', 'mkv', 'webm', 'avi'].includes(ext)) return 'video';
  if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'].includes(ext)) return 'image';
  return '';
}

export function cornerPosition(xPct: number, yPct: number): string {
  if (xPct > 35 && xPct < 65 && yPct > 30 && yPct < 70) return 'Tengah';
  const h = xPct < 50 ? 'Kiri' : 'Kanan';
  const v = yPct < 50 ? 'Atas' : 'Bawah';
  return `${h} ${v}`;
}

export function nowPlayingText(config: any): string {
  const audio = getDeep(config, 'input.audio', '');
  const fallbackTitle = getDeep(config, 'spectrum.nowPlayingAutoFromFile', true) && audio ? String(audio).split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') : '';
  const title = getDeep(config, 'input.title', '') || fallbackTitle || 'Now Playing';
  return String(getDeep(config, 'spectrum.nowPlayingTemplate', '{title}'))
    .replaceAll('{title}', title)
    .replaceAll('{artist}', getDeep(config, 'spectrum.nowPlayingArtist', ''))
    .replaceAll('{album}', getDeep(config, 'spectrum.nowPlayingAlbum', ''))
    .replaceAll('{filename}', audio ? String(audio).split(/[\\/]/).pop() || '' : '');
}

export function humanSize(size: number): string {
  if (!Number.isFinite(size)) return '-';
  if (size > 1024 * 1024 * 1024) return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size > 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard?.writeText(text).catch(() => {});
}

export function flattenModulePatch(value: any, prefix = ''): Array<[string, any]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [[prefix, value]];
  return Object.entries(value).flatMap(([k, v]) => flattenModulePatch(v, prefix ? `${prefix}.${k}` : k));
}

export function normalizeDroppedPath(raw = ''): string {
  const value = String(raw).trim();
  if (/^file:\/\/\//i.test(value)) return decodeURIComponent(value.replace(/^file:\/\/\/?/i, '')).replace(/^\//, '');
  return value;
}
