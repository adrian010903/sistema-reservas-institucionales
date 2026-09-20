const ACTIVE_STATES = ['PENDIENTE', 'APROBADA', 'CONFIRMADA']

export default function ReservationsPage({ reservations, payments, spaces, places, message, onNavigateSpaces, onEdit, onCancel }) {
  const activeReservations = reservations.filter((item) => ACTIVE_STATES.includes(item.estado)).length
  const confirmedReservations = reservations.filter((item) => item.estado === 'CONFIRMADA').length
  const pendingReservations = reservations.filter((item) => item.estado === 'PENDIENTE').length

  return (
    <main className="page-container my-reservations-page">
      <div className="reservations-hero">
        <div><p className="eyebrow">Historial personal</p><h1>Mis reservas</h1><p>Consulta el estado de tus solicitudes y administra las que todavía están activas.</p></div>
        <button className="primary-button" onClick={onNavigateSpaces}>+ Nueva reserva</button>
      </div>
      <section className="reservation-mini-stats">
        <div><small>Reservas activas</small><strong>{activeReservations}</strong></div>
        <div><small>Confirmadas</small><strong>{confirmedReservations}</strong></div>
        <div><small>Por revisar</small><strong>{pendingReservations}</strong></div>
      </section>
      {message && <p className="form-message">{message}</p>}
      {reservations.length === 0 ? (
        <div className="reservations-empty"><span>▤</span><h2>Aún no tienes reservas</h2><p>Explora los lugares disponibles y programa tu primera actividad.</p><button className="primary-button" onClick={onNavigateSpaces}>Explorar espacios</button></div>
      ) : (
        <div className="reservation-grid">
          {reservations.map((reservation) => {
            const date = new Date(`${reservation.fecha}T12:00:00`)
            const linkedSpace = spaces.find((space) => String(space.id) === String(reservation.espacioId) || space.nombre === reservation.espacio)
            const linkedPlace = places.find((place) => String(place.id) === String(linkedSpace?.lugarId))
            const canModify = ['PENDIENTE', 'APROBADA'].includes(reservation.estado) && !payments.some((payment) => payment.reservaId === reservation.id && payment.estado !== 'RECHAZADO')
            const canCancel = ACTIVE_STATES.includes(reservation.estado)
            return (
              <article className="reservation-modern-card" key={reservation.id}>
                <div className="reservation-card-top">
                  <div className="reservation-date-tile"><strong>{date.toLocaleDateString('es-CR', { day: '2-digit' })}</strong><span>{date.toLocaleDateString('es-CR', { month: 'short' }).replace('.', '')}</span><small>{date.getFullYear()}</small></div>
                  <div className="reservation-main-info"><small>RESERVA #{reservation.id}</small><h2>{reservation.espacio}</h2><p>⌂ {linkedPlace?.nombre || 'Instalación institucional'}</p></div>
                  <span className={`reservation-status ${reservation.estado.toLowerCase()}`}>{reservation.estado}</span>
                </div>
                <div className="reservation-detail-row">
                  <div><small>HORARIO</small><strong>{String(reservation.horaInicio).slice(0, 5)} – {String(reservation.horaFin).slice(0, 5)}</strong></div>
                  <div><small>PERSONAS</small><strong>{reservation.cantidadPersonas}</strong></div>
                  <div><small>FECHA</small><strong>{date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div>
                </div>
                {(canModify || canCancel) && <div className="reservation-card-actions">{canModify && <button onClick={() => onEdit(reservation)}>Modificar reserva</button>}{canCancel && <button className="danger" onClick={() => onCancel(reservation)}>Cancelar</button>}</div>}
              </article>
            )
          })}
        </div>
      )}
    </main>
  )
}
