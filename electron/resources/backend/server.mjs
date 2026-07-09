import http from 'node:http';
import { createHttpUtils } from './http-utils.mjs';
import { PORT, ALLOWED_ORIGIN, MAX_BODY_BYTES } from './config.mjs';
import { createQueueRunner } from './queue-engine.mjs';
import { handleRequest } from './routes.mjs';
import { initHistory } from "./history.mjs";

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

initHistory().then(() => {
  server.listen(PORT, '127.0.0.1', () => console.log(`PidioForge Production API: http://127.0.0.1:${PORT}`));
});
