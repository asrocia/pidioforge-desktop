import http from 'node:http';
import { createHttpUtils } from './http-utils.mjs';
import { PORT, ALLOWED_ORIGIN, MAX_BODY_BYTES } from './config.mjs';
import { createQueueRunner } from './queue-engine.mjs';
import { handleRequest } from './routes.mjs';
import { initHistory } from './history.mjs';

const processes = new Map();
const loopJobs = new Map();
const { runQueueLoop, requestStop } = createQueueRunner(processes);
const httpUtils = createHttpUtils({ allowedOrigin: ALLOWED_ORIGIN, maxBodyBytes: MAX_BODY_BYTES });
const { json, sendError } = httpUtils;

const ctx = {
  processes,
  loopJobs,
  runQueueLoop,
  requestQueueStop: requestStop,
  http: httpUtils,
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true });
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  return handleRequest(req, res, url, ctx);
});

server.on('error', error => {
  console.error(`Backend server failed on 127.0.0.1:${PORT}:`, error);
  process.exitCode = 1;
});

try {
  console.log('=== Backend Server Starting ===');
  console.log('Node version:', process.version);
  console.log('Platform:', process.platform, process.arch);
  console.log('CWD:', process.cwd());
  console.log('Environment:', {
    PORT,
    ALLOWED_ORIGIN,
    PIDIOFORGE_RESOURCE_DIR: process.env.PIDIOFORGE_RESOURCE_DIR,
    PIDIOFORGE_DATA_DIR: process.env.PIDIOFORGE_DATA_DIR,
    PIDIOFORGE_LOG_DIR: process.env.PIDIOFORGE_LOG_DIR,
  });
  
  await initHistory();
  console.log('History database initialized successfully');
  
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`PidioForge Production API: http://127.0.0.1:${PORT}`);
    console.log('Backend server ready');
  });
} catch (error) {
  console.error('=== Backend initialization failed ===');
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Error code:', error.code);
  console.error('Error stack:', error.stack);
  
  if (error.message?.includes('better-sqlite3') || error.code === 'ERR_DLOPEN_FAILED') {
    console.error('\n=== SQLite Native Module Error ===');
    console.error('This is likely a Node.js ABI version mismatch.');
    console.error('The better-sqlite3 module needs to be rebuilt for this Electron version.');
    console.error('Expected NODE_MODULE_VERSION:', process.versions.modules);
  }
  
  process.exitCode = 1;
  process.exit(1);
}
