export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function createHttpUtils({ allowedOrigin, maxBodyBytes }) {
  function corsHeaders(req = null) {
    const origin = req?.headers?.origin || allowedOrigin;
    const allowed = new Set([allowedOrigin, 'http://127.0.0.1:1420', 'http://localhost:1420', 'file://', 'null']);
    return {
      'access-control-allow-origin': allowed.has(origin) || origin === 'null' || !origin ? '*' : allowedOrigin,
      'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'access-control-allow-headers': 'content-type',
    };
  }

  function json(res, code, data) {
    res.writeHead(code, { 'content-type': 'application/json', ...corsHeaders(res.req) });
    res.end(JSON.stringify(data));
  }

  function sendError(res, code, message) {
    return json(res, code, { error: message });
  }

  async function body(req) {
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > maxBodyBytes) throw new HttpError(413, 'Payload terlalu besar');
      chunks.push(chunk);
    }
    const text = Buffer.concat(chunks).toString('utf8');
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      throw new HttpError(400, 'JSON tidak valid');
    }
  }

  return { body, corsHeaders, json, sendError };
}
