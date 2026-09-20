const COSTA_RICA_LOCALE = 'es-CR'

export function formatCurrency(value) {
  return `₡${Number(value || 0).toLocaleString(COSTA_RICA_LOCALE)}`
}

export function formatStatus(value) {
  return String(value || '').replaceAll('_', ' ')
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString(COSTA_RICA_LOCALE)
}
