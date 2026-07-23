import { cp, mkdir, rm, copyFile, writeFile, chmod } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const resources = path.join(root, 'electron', 'resources');
const backendOut = path.join(resources, 'backend');
const backendDependenciesOut = path.join(backendOut, 'vendor', 'node_modules');
const platform = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'macos' : 'linux';
const backendRuntimeDependencies = ['better-sqlite3', 'bindings', 'file-uri-to-path'];
async function copyBackendDependencies() {
  for (const dependency of backendRuntimeDependencies) {
    const source = path.join(root, 'node_modules', dependency);
    const destination = path.join(backendDependenciesOut, dependency);
    if (!existsSync(source)) {
      throw new Error(`Missing backend runtime dependency: ${dependency}`);
    }
    await cp(source, destination, { recursive: true });
  }

  const nativeBinary = path.join(backendDependenciesOut, 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
  if (!existsSync(nativeBinary)) {
    throw new Error(`Missing native backend binary: ${nativeBinary}`);
  }
}
const binOut = path.join(resources, 'bin', platform);
const exe = process.platform === 'win32' ? '.exe' : '';

async function copyIfExists(src, dest, mode) {
  if (!src || !existsSync(src)) return false;
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(src, dest);
  if (mode) await chmod(dest, mode).catch(() => {});
  return true;
}
function which(cmd) {
  const res = spawnSync(process.platform === 'win32' ? 'where' : 'which', [cmd], { encoding: 'utf8' });
  if (res.status !== 0) return '';
  return (
    res.stdout
      .split(/\r?\n/)
      .map(s => s.trim())
      .find(Boolean) || ''
  );
}
function bundledTool(tool) {
  const candidates = [
    path.join(root, 'backend', 'ffmpeg-8.1.1-essentials_build', 'bin', `${tool}${exe}`),
    path.join(root, 'backend', 'ffmpeg', 'bin', `${tool}${exe}`),
    path.join(root, 'backend', 'bin', `${tool}${exe}`),
    path.join(root, 'tools', 'ffmpeg', `${tool}${exe}`),
  ];
  return candidates.find(item => existsSync(item)) || '';
}

await mkdir(resources, { recursive: true });
await rm(backendOut, { recursive: true, force: true });
await cp(path.join(root, 'backend'), backendOut, {
  recursive: true,
  filter: src => {
    const rel = path.relative(path.join(root, 'backend'), src);
    if (!rel) return true; // root dir itself
    const first = rel.split(path.sep)[0];
    // Exclude non-runtime directories
    if (first === '.data' || first === 'ffmpeg-8.1.1-essentials_build' || first === 'ffmpeg' || first === 'bin')
      return false;
    // Exclude non-runtime file patterns
    const base = path.basename(src);
    if (base.includes('.test.') || base.includes('.spec.') || base === '__tests__' || base === '__mocks__')
      return false;
    if (base.endsWith('.md') && base !== 'package.json') return false;
    return true;
  },
});
await copyBackendDependencies();

await mkdir(binOut, { recursive: true });
console.log(`Backend runtime dependencies ready: ${backendRuntimeDependencies.join(', ')}`);
const copied = [];
const nodeSrc = process.execPath;
if (await copyIfExists(nodeSrc, path.join(binOut, `node${exe}`), 0o755)) copied.push(`node${exe}`);
for (const tool of ['ffmpeg', 'ffprobe']) {
  const env = process.env[`PIDIOFORGE_${tool.toUpperCase()}_PATH`];
  const src = env || bundledTool(tool) || which(tool);
  if (await copyIfExists(src, path.join(binOut, `${tool}${exe}`), 0o755)) copied.push(`${tool}${exe}`);
}

await writeFile(
  path.join(resources, 'README-PIDIOFORGE-RESOURCES.txt'),
  `PidioForge Electron build resources\n\nBackend copied: electron/resources/backend\nBinaries copied for ${platform}: ${copied.join(', ') || '-'}\n\nFor Windows installer build, run this prepare script on Windows so ffmpeg.exe and ffprobe.exe are bundled correctly. You may also set PIDIOFORGE_FFMPEG_PATH and PIDIOFORGE_FFPROBE_PATH.\n`,
);

const missing = ['node', 'ffmpeg', 'ffprobe'].filter(name => !copied.some(x => x.startsWith(name)));
console.log(`PidioForge resources ready: ${copied.join(', ') || 'no binaries copied'}`);
if (missing.length) console.warn(`WARNING missing binaries: ${missing.join(', ')}`);
