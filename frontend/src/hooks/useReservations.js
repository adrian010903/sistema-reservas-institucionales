import { useCallback, useEffect, useState } from 'react'
import { fetchMyReservations } from '../services/reservationService'

export default function useReservations({ token, authHeaders, refreshKey }) {
  const [reservations, setReservations] = useState([])

  useEffect(() => {
    if (!token) return
    fetchMyReservations(authHeaders).then(setReservations).catch(() => setReservations([]))
  }, [token, authHeaders, refreshKey])

  const prependReservations = useCallback((created) => {
    setReservations((current) => [...created.slice().reverse(), ...current])
  }, [])

  const mergeReservation = useCallback((updated) => {
    setReservations((current) => current.map((item) => (item.id === updated.id ? updated : item)))
  }, [])

  const confirmReservationPayment = useCallback((reservationId) => {
    setReservations((current) => current.map((item) => (
      item.id === reservationId ? { ...item, estado: 'CONFIRMADA' } : item
    )))
  }, [])

  const clearReservations = useCallback(() => setReservations([]), [])

  return {
    reservations,
    prependReservations,
    mergeReservation,
    confirmReservationPayment,
    clearReservations,
  }
}
