import { API, readJson, readJsonArray } from './api'

function availabilityUrl(filters) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value)
  })
  return `${API}/reservas/disponibilidad?${params}`
}

export async function fetchMyReservations(authHeaders) {
  return readJsonArray(await fetch(`${API}/reservas/mias`, { headers: authHeaders }))
}

export async function fetchAvailability(filters) {
  return readJsonArray(await fetch(availabilityUrl(filters)))
}

export async function createReservationRange(authHeaders, data) {
  return readJsonArray(await fetch(`${API}/reservas/rango`, {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }))
}

export async function updateReservation(authHeaders, id, data) {
  return readJson(await fetch(`${API}/reservas/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }))
}

export async function cancelReservationRequest(authHeaders, id) {
  return readJson(await fetch(`${API}/reservas/${id}/cancelar`, {
    method: 'PATCH',
    headers: authHeaders,
  }))
}
