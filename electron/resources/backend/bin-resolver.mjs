import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const isWin = process.platform === 'win32';
const exe = isWin ? '.exe' : '';
const platformDir = isWin ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux';

function uniq(items) {
  return [...new Set(items.filter(Boolean).map(x => path.resolve(String(x))))];
}

function envPath(name) {
  const v = process.env[name];
  if (!v) return '';
  return path.resolve(v);
}

function candidatesFor(tool) {
  const envSpecific = tool === 'ffmpeg' ? envPath('PIDIOFORGE_FFMPEG_PATH') : envPath('PIDIOFORGE_FFPROBE_PATH');
  const resourceDir = process.env.PIDIOFORGE_RESOURCE_DIR || '';
  const appDir = process.env.PIDIOFORGE_APP_DIR || process.cwd();
  const names = [tool + exe, tool];
  const dirs = [
    path.join(resourceDir, 'bin'),
    path.join(resourceDir, 'bin', platformDir),
    path.join(resourceDir, 'bin', process.platform),
    path.join(resourceDir, 'ffmpeg'),
    path.join(resourceDir, 'ffmpeg', platformDir),
    path.join(resourceDir, 'ffmpeg', process.platform),
    path.join(appDir, 'bin'),
    path.join(appDir, 'bin', platformDir),
    path.join(appDir, 'bin', process.platform),
    path.join(root, 'bin'),
    path.join(root, 'bin', platformDir),
    path.join(root, 'bin', process.platform),
    path.join(here, 'bin'),
    path.join(here, 'bin', platformDir),
    path.join(here, 'bin', process.platform),
    path.join(here, 'ffmpeg-8.1.1-essentials_build', 'bin'),
    path.join(here, 'ffmpeg', 'bin'),
    path.join(here, 'ffmpeg'),
    path.join(root, 'ffmpeg-8.1.1-essentials_build', 'bin'),
    path.join(root, 'ffmpeg', 'bin'),
    path.join(root, 'ffmpeg'),
    path.join(root, 'tools', 'ffmpeg'),
  ];
  return uniq([
    envSpecific,
    ...dirs.flatMap(dir => names.map(name => path.join(dir, name))),
  ]);
}

export function resolveBinary(tool) {
  for (const c of candidatesFor(tool)) {
    if (existsSync(c)) return c;
  }
  return tool + exe;
}

export const FFMPEG = resolveBinary('ffmpeg');
export const FFPROBE = resolveBinary('ffprobe');

export function binaryDiagnostics() {
  return {
    ffmpegPath: FFMPEG,
    ffprobePath: FFPROBE,
    resourceDir: process.env.PIDIOFORGE_RESOURCE_DIR || '',
    dataDir: process.env.PIDIOFORGE_DATA_DIR || '',
  };
}
