export function cleanUiText(value: unknown): string {
  return String(value ?? '')
    .replaceAll('Ã¢â‚¬Â¢', ' - ')
    .replaceAll('Ã‚Â±', '+/-')
    .replaceAll('Ã¢â€ â€™', '->')
    .replaceAll('â€¢', ' - ')
    .replaceAll('Â±', '+/-')
    .replaceAll('->', '->')
    .replaceAll('Warning:', 'Perhatian:')
    .replaceAll(' OK.', ' siap.')
    .replaceAll('GUI siap.', 'Aplikasi siap.')
}

export function formatDuration(seconds: unknown): string {
  const raw = Number(seconds || 0);
  const total = Math.max(0, Math.round(Number.isFinite(raw) ? raw : 0))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const remainingSeconds = total % 60
  return hours ? `${hours}j ${minutes}m ${remainingSeconds}d` : minutes ? `${minutes}m ${remainingSeconds}d` : `${remainingSeconds}d`
}

export function formatBytes(bytes: unknown): string {
  const value = Number(bytes || 0)
  if (!value) return '-'
  if (value >= 1024 * 1024 * 1024) return `${(value / 1024 / 1024 / 1024).toFixed(2)} GB`
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`
  if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${value} B`
}
