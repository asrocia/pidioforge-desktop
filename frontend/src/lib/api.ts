export const API_BASE_URL = 'http://127.0.0.1:8787'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function api<T = any>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers)
  if (!headers.has('content-type')) headers.set('content-type', 'application/json')

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string }
    throw new ApiError(payload.error || response.statusText, response.status)
  }

  return response.json() as Promise<T>
}
