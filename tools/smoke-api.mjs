const API_BASE_URL = process.env.PIDIOFORGE_API_URL || 'http://127.0.0.1:8787'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const text = await response.text()
  const body = text ? JSON.parse(text) : {}
  return { response, body }
}

async function main() {
  const health = await request('/api/health')
  if (!health.response.ok || !health.body.ok) {
    throw new Error(`health check failed: ${health.response.status}`)
  }

  const invalidJson = await request('/api/path/info', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{invalid-json',
  })
  if (invalidJson.response.status !== 400) {
    throw new Error(`invalid JSON expected 400, got ${invalidJson.response.status}`)
  }
  if (!invalidJson.body.error) {
    throw new Error('invalid JSON response missing error')
  }
  if ('stack' in invalidJson.body) {
    throw new Error('invalid JSON response leaked stack')
  }

  console.log('smoke:api ok')
}

main().catch(error => {
  console.error(error.message)
  process.exit(1)
})
