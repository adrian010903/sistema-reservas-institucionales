import { API, readJsonArray } from './api'

export function fetchNotifications(auth) {
  return fetch(`${API}/notificaciones`, { headers: auth }).then(readJsonArray)
}

// Devuelve la notificación actualizada, o null si el servidor no la pudo marcar.
export async function markNotificationRead(auth, notificationId) {
  const response = await fetch(`${API}/notificaciones/${notificationId}/leer`, { method: 'PATCH', headers: auth })
  if (!response.ok) return null
  return response.json()
}
