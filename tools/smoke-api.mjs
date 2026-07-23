const API_BASE_URL = process.env.PIDIOFORGE_API_URL || 'http://127.0.0.1:8787';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  return { response, body };
}

async function main() {
  const health = await request('/api/health');
  if (!health.response.ok || !health.body.ok) {
    throw new Error(`health check failed: ${health.response.status}`);
  }

  const invalidJson = await request('/api/path/info', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{invalid-json',
  });
  if (invalidJson.response.status !== 400) {
    throw new Error(`invalid JSON expected 400, got ${invalidJson.response.status}`);
  }
  if (!invalidJson.body.error) {
    throw new Error('invalid JSON response missing error');
  }
  if ('stack' in invalidJson.body) {
    throw new Error('invalid JSON response leaked stack');
  }

  // Smoke check extended API routes
  const diag = await request('/api/system/diagnostics');
  if (!diag.response.ok || !('ffmpeg' in diag.body)) {
    throw new Error('diagnostics check failed');
  }

  const cleanup = await request('/api/preview/cleanup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ maxAge: 1800000 }),
  });
  if (!cleanup.response.ok) {
    throw new Error(`preview cleanup check failed: status ${cleanup.response.status}`);
  }

  console.log('smoke:api ok');
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
