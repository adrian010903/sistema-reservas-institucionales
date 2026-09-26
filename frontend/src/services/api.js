export const API = import.meta.env.VITE_API_URL || '/api/v1'
export const BACKEND = API.replace(/\/api\/v1\/?$/, '')

const MOJIBAKE_REPLACEMENTS = new Map([
  ['├í', 'á'], ['├⌐', 'é'], ['├¡', 'í'], ['├│', 'ó'], ['├║', 'ú'], ['├▒', 'ñ'],
  ['├ü', 'Á'], ['├ë', 'É'], ['├ì', 'Í'], ['├ô', 'Ó'], ['├Ü', 'Ú'], ['├╝', 'ü'],
  ['┬┐', '¿'], ['┬í', '¡'],
])

function normalizeText(value) {
  let normalized = value
  MOJIBAKE_REPLACEMENTS.forEach((replacement, damaged) => {
    normalized = normalized.replaceAll(damaged, replacement)
  })
  return normalized
}

function normalizePayload(value) {
  if (typeof value === 'string') return normalizeText(value)
  if (Array.isArray(value)) return value.map(normalizePayload)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizePayload(item)]))
  }
  return value
}

export async function readJson(response) {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.detail || body.message || `Error ${response.status}`)
  return normalizePayload(body)
}

export async function readJsonArray(response) {
  const body = await readJson(response)
  if (!Array.isArray(body)) throw new Error('El servidor devolvió una respuesta inesperada')
  return body
}
