import { API, readJson, readJsonArray } from './api'

// Llamadas al backend del módulo de administración.
// Las funciones "fetch..." devuelven los datos ya leídos (o lanzan un error).
// Las funciones "request..." devuelven { ok, status, body } para que la pantalla
// decida qué mensaje mostrar, igual que antes de mover este código.

async function sendAdminRequest(url, options) {
  const response = await fetch(url, options)
  const body = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, body }
}

function jsonHeaders(auth) {
  return { ...auth, 'Content-Type': 'application/json' }
}

export function fetchAdminUsers(auth) {
  return fetch(`${API}/admin/usuarios`, { headers: auth }).then(readJsonArray)
}

export function fetchAdminReservations(auth) {
  return fetch(`${API}/admin/reservas`, { headers: auth }).then(readJsonArray)
}

export function fetchAdminPayments(auth) {
  return fetch(`${API}/admin/pagos`, { headers: auth }).then(readJsonArray)
}

export function fetchAuditEntries(auth) {
  return fetch(`${API}/admin/auditoria?limite=200`, { headers: auth }).then(readJsonArray)
}

export function fetchReportSummary(auth, query = '', signal) {
  return fetch(`${API}/admin/reportes/resumen${query ? `?${query}` : ''}`, { headers: auth, signal }).then(readJson)
}

export function requestHourlyRateUpdate(auth, tarifaHora) {
  return sendAdminRequest(`${API}/admin/configuracion/tarifa-hora`, {
    method: 'PUT',
    headers: jsonHeaders(auth),
    body: JSON.stringify({ tarifaHora }),
  })
}

export function requestReservationReview(auth, reservationId, action) {
  return sendAdminRequest(`${API}/admin/reservas/${reservationId}/${action}`, { method: 'PATCH', headers: auth })
}

export function requestPaymentReview(auth, paymentId, action) {
  return sendAdminRequest(`${API}/admin/pagos/${paymentId}/${action}`, { method: 'PATCH', headers: auth })
}

export function requestUserUpdate(auth, userId, data) {
  return sendAdminRequest(`${API}/admin/usuarios/${userId}`, {
    method: 'PATCH',
    headers: jsonHeaders(auth),
    body: JSON.stringify(data),
  })
}

export function requestUserCreation(auth, data) {
  return sendAdminRequest(`${API}/admin/usuarios`, {
    method: 'POST',
    headers: jsonHeaders(auth),
    body: JSON.stringify(data),
  })
}

export function requestUserDeletion(auth, userId) {
  return sendAdminRequest(`${API}/admin/usuarios/${userId}`, { method: 'DELETE', headers: auth })
}

// El reporte se descarga como archivo, así que se devuelve la respuesta completa.
export function requestReservationsReport(auth, format, params) {
  return fetch(`${API}/admin/reportes/reservas.${format}?${params}`, { headers: auth })
}
