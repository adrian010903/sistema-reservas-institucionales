import { API, readJsonArray } from './api'

// Llamadas al backend del catálogo: configuración pública, lugares y espacios.
// Las funciones que guardan devuelven { ok, status, body } para que la pantalla
// decida qué mensaje mostrar.

async function readResult(response) {
  const body = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, body }
}

export function fetchPublicConfig() {
  return fetch(`${API}/configuracion-publica`).then((response) => (response.ok ? response.json() : Promise.reject()))
}

export function fetchPublicSpaces() {
  return fetch(`${API}/espacios`).then(readJsonArray)
}

export function fetchPublicPlaces() {
  return fetch(`${API}/lugares`).then(readJsonArray)
}

// Devuelve [tipos, categorias, espacios, lugares] del catálogo administrativo.
export function fetchAdminCatalog(auth) {
  const load = (path) => fetch(`${API}/admin/catalogo/${path}`, { headers: auth }).then(readJsonArray)
  return Promise.all([load('tipos'), load('categorias'), load('espacios'), load('lugares')])
}

// Crea o actualiza un lugar o espacio y, si se eligió una imagen, la sube después.
async function saveCatalogItem(auth, resource, id, payload, image) {
  const creating = !id
  let result = await readResult(
    await fetch(creating ? `${API}/admin/catalogo/${resource}` : `${API}/admin/catalogo/${resource}/${id}`, {
      method: creating ? 'POST' : 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  )
  if (result.ok && image) {
    const imageData = new FormData()
    imageData.append('imagen', image)
    result = await readResult(await fetch(`${API}/admin/catalogo/${resource}/${result.body.id}/imagen`, { method: 'POST', headers: auth, body: imageData }))
  }
  return result
}

export function saveSpaceRequest(auth, id, payload, image) {
  return saveCatalogItem(auth, 'espacios', id, payload, image)
}

export function savePlaceRequest(auth, id, payload, image) {
  return saveCatalogItem(auth, 'lugares', id, payload, image)
}

export async function deactivateCatalogItem(auth, type, id) {
  const response = await fetch(`${API}/admin/catalogo/${type === 'place' ? 'lugares' : 'espacios'}/${id}`, { method: 'DELETE', headers: auth })
  return { ok: response.ok, status: response.status }
}
