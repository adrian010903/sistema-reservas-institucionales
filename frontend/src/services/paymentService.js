import { API, readJson, readJsonArray } from './api'

// Llamadas al backend del módulo de pagos (Stripe, pago simulado y comprobantes).

function jsonHeaders(auth) {
  return { ...auth, 'Content-Type': 'application/json' }
}

async function readResult(response) {
  const body = await response.json().catch(() => ({}))
  return { ok: response.ok, status: response.status, body }
}

export function fetchMyPayments(auth) {
  return fetch(`${API}/pagos/mios`, { headers: auth }).then(readJsonArray)
}

export async function startStripeCheckout(auth, reservaId) {
  return readResult(
    await fetch(`${API}/pagos/stripe/checkout`, {
      method: 'POST',
      headers: jsonHeaders(auth),
      body: JSON.stringify({ reservaId }),
    }),
  )
}

export function confirmStripeSession(auth, sessionId) {
  return fetch(`${API}/pagos/stripe/confirmar?session_id=${encodeURIComponent(sessionId)}`, { headers: auth }).then(readJson)
}

export function cancelStripeSession(auth, sessionId) {
  return fetch(`${API}/pagos/stripe/cancelar`, {
    method: 'POST',
    headers: jsonHeaders(auth),
    body: JSON.stringify({ sessionId }),
  }).then(readJson)
}

export async function createMockPayment(auth, reservaId, metodo) {
  return readResult(
    await fetch(`${API}/pagos/mock`, {
      method: 'POST',
      headers: jsonHeaders(auth),
      body: JSON.stringify({ reservaId, metodo }),
    }),
  )
}

// El comprobante se descarga como archivo, así que se devuelve la respuesta completa.
export function requestReceipt(auth, paymentId) {
  return fetch(`${API}/pagos/${paymentId}/comprobante`, { headers: auth })
}
