export const API = import.meta.env.VITE_API_URL || '/api/v1'
export const BACKEND = API.replace(/\/api\/v1\/?$/, '')

export async function readJson(response) {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.detail || body.message || `Error ${response.status}`)
  return body
}

export async function readJsonArray(response) {
  const body = await readJson(response)
  if (!Array.isArray(body)) throw new Error('El servidor devolvió una respuesta inesperada')
  return body
}
