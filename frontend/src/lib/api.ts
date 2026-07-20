export const API_BASE_URL = 'http://127.0.0.1:8787'

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let showToastFn: ((type: 'success' | 'error' | 'warning' | 'info', message: string) => void) | null = null;

export function setToastHandler(fn: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void) {
  showToastFn = fn;
}

export async function api<T = any>(path: string, options?: RequestInit): Promise<T> {
  const headers = new Headers(options?.headers)
  if (!headers.has('content-type')) headers.set('content-type', 'application/json')

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { error?: string }
      const errorMsg = payload.error || response.statusText;
      const error = new ApiError(errorMsg, response.status);
      
      // Show error toast
      if (showToastFn) {
        showToastFn('error', `API Error: ${errorMsg}`);
      }
      
      throw error;
    }

    return response.json() as Promise<T>
  } catch (error) {
    // Handle network errors
    if (error instanceof ApiError) {
      throw error;
    }
    
    const networkError = error as Error;
    if (showToastFn) {
      showToastFn('error', `Network Error: ${networkError.message || 'Failed to connect to server'}`);
    }
    
    throw new ApiError(networkError.message || 'Network error', 0);
  }
}
