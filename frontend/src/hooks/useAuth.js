import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchCurrentUser, loginUser } from '../services/authService'

const TOKEN_KEY = 'reservas_token'

export default function useAuth() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const authHeaders = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token])

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const authenticate = useCallback(async (credentials) => {
    const result = await loginUser(credentials)
    localStorage.setItem(TOKEN_KEY, result.token)
    setToken(result.token)
    setUser(result.usuario)
    return result.usuario
  }, [])

  useEffect(() => {
    if (!token) return
    fetchCurrentUser(authHeaders).then(setUser).catch(clearSession)
  }, [token, authHeaders, clearSession])

  return {
    user,
    token,
    authHeaders,
    authenticate,
    clearSession,
    updateSessionUser: setUser,
  }
}
