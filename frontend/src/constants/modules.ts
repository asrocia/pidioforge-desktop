import type { ModuleKey } from '../types/app.types';

export const modules: Array<{ key: ModuleKey; title: string; sub: string }> = [
  { key: 'target', title: 'SUMBER & ENGINE', sub: 'input nyata / ffmpeg' },
  { key: 'branding', title: 'BRANDING', sub: 'logo / bumper / ajakan' },
  { key: 'audio', title: 'AUDIO & MIXING', sub: 'volume / efek reaktif' },
  { key: 'lyrics', title: 'LIRIK OTOMATIS', sub: 'parser LRC/SRT' },
  { key: 'spectrum', title: 'SPEKTRUM & NOW PLAYING', sub: 'waveform / progress' },
  { key: 'overlay', title: 'OVERLAY', sub: 'particle / timestamp' },
  { key: 'queue', title: 'QUEUE', sub: 'batch render nyata' },
  { key: 'loop', title: 'LOOPING', sub: 'video pendek jadi panjang' },
  { key: 'templates', title: 'TEMPLATES', sub: 'quick start presets' },
  { key: 'help', title: 'BANTUAN', sub: 'panduan fitur' },
];

export const moduleDisplay: Record<ModuleKey, { title: string; sub: string }> = {
  target: { title: 'Sumber & Engine', sub: 'input nyata / ffmpeg' },
  branding: { title: 'Branding', sub: 'logo / bumper / ajakan' },
  audio: { title: 'Audio & Mixing', sub: 'volume / efek reaktif' },
  lyrics: { title: 'Lirik Otomatis', sub: 'parser LRC / SRT' },
  spectrum: { title: 'Spektrum', sub: 'waveform / progress' },
  overlay: { title: 'Overlay', sub: 'particle / timestamp' },
  queue: { title: 'Queue', sub: 'batch render' },
  loop: { title: 'Seamless Looping', sub: 'video 8 detik jadi durasi panjang' },
  templates: { title: 'Templates', sub: 'quick start presets' },
  help: { title: 'Bantuan', sub: 'panduan fitur dan alur kerja' },
};

export const moduleUi: Record<ModuleKey, { icon: ModuleKey; tone: string }> = {
  target: { icon: 'target', tone: 'cyan' },
  branding: { icon: 'branding', tone: 'green' },
  audio: { icon: 'audio', tone: 'blue' },
  lyrics: { icon: 'lyrics', tone: 'amber' },
  spectrum: { icon: 'spectrum', tone: 'cyan' },
  overlay: { icon: 'overlay', tone: 'violet' },
  queue: { icon: 'queue', tone: 'red' },
  loop: { icon: 'loop', tone: 'green' },
  templates: { icon: 'templates', tone: 'violet' },
  help: { icon: 'help', tone: 'blue' },
};

export type QueueStatus = 'all' | 'standby' | 'rendering' | 'done' | 'failed' | 'cancelled';

export const queueStatusLabelMap: Record<Exclude<QueueStatus, 'all'>, string> = {
  standby: 'Siaga',
  rendering: 'Memproses',
  done: 'Selesai',
  failed: 'Gagal',
  cancelled: 'Dibatalkan',
};

export function queueStatusLabel(status: string): string {
  return queueStatusLabelMap[status as Exclude<QueueStatus, 'all'>] || status || '-';
}
