export function reservationDates(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) return []
  const fechas = []
  const actual = new Date(`${fechaInicio}T12:00:00`)
  const limite = new Date(`${fechaFin}T12:00:00`)
  while (actual <= limite) {
    fechas.push(actual.toISOString().slice(0, 10))
    actual.setDate(actual.getDate() + 1)
  }
  return fechas
}
