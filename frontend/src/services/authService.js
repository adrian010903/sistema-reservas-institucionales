import { API, readJson } from './api'

const jsonRequest = (method, body, headers = {}) => ({
  method,
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export async function fetchCurrentUser(authHeaders) {
  return readJson(await fetch(`${API}/usuarios/me`, { headers: authHeaders }))
}

export async function loginUser(credentials) {
  return readJson(await fetch(`${API}/auth/login`, jsonRequest('POST', credentials)))
}

export async function registerUser(data) {
  return readJson(await fetch(`${API}/auth/registro`, jsonRequest('POST', data)))
}

export async function requestPasswordRecovery(data) {
  return readJson(await fetch(`${API}/auth/recuperacion/solicitar`, jsonRequest('POST', data)))
}

export async function confirmPasswordRecovery(data) {
  const response = await fetch(`${API}/auth/recuperacion/confirmar`, jsonRequest('POST', data))
  if (!response.ok) await readJson(response)
}

export async function updateCurrentUser(authHeaders, data) {
  return readJson(await fetch(`${API}/usuarios/me`, jsonRequest('PUT', data, authHeaders)))
}

export async function updateCurrentPassword(authHeaders, data) {
  const response = await fetch(`${API}/usuarios/me/password`, jsonRequest('PATCH', data, authHeaders))
  if (!response.ok) await readJson(response)
}
