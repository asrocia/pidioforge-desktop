import { spawn } from 'node:child_process';

function run(name, cmd, args) {
  const p = spawn(cmd, args, { stdio: 'inherit' });
  p.on('exit', code => console.log(`${name} exit ${code}`));
  return p;
}

async function waitFor(url, timeoutMs = 30000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 350));
  }
  throw new Error(`Timeout menunggu ${url}`);
}

const web = run('vite', process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '1420', 'frontend']);
const api = run('api', process.execPath, ['backend/server.mjs']);

try {
  await Promise.all([
    waitFor('http://127.0.0.1:1420'),
    waitFor('http://127.0.0.1:8787/api/health'),
  ]);
  const electron = run('electron', process.execPath, ['node_modules/electron/cli.js', 'electron/main.mjs']);
  electron.on('exit', () => {
    if (!web.killed) web.kill('SIGTERM');
    if (!api.killed) api.kill('SIGTERM');
  });
} catch (error) {
  console.error(error.message);
  if (!web.killed) web.kill('SIGTERM');
  if (!api.killed) api.kill('SIGTERM');
  process.exitCode = 1;
}
