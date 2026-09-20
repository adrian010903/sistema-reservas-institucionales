import { BACKEND } from '../services/api'
import { CustomReservationSchedule } from '../components/ReservationSchedule'
import { reservationDates } from '../utils/reservations'
import { formatCurrency } from '../utils/formatters'

export default function ReservePage({
  places, spaces, selectedPlaceId, selectedSpace, form, hours, hourlyRate, reservationAvailability, checkingReservation, message,
  onPlaceChange, onSpaceChange, onFormChange, onClearAvailability, onReview,
}) {
  const reservablePlaces = places.filter((place) => place.estado === 'ACTIVO')
  const selectedReservePlace = reservablePlaces.find((place) => String(place.id) === String(selectedPlaceId))
  const placeSpaces = spaces.filter((space) => String(space.lugarId) === String(selectedPlaceId) && space.estado === 'DISPONIBLE')
  const placeCover = (place) => place.imagenUrl || spaces.find((space) => String(space.lugarId) === String(place.id) && space.imagenUrl)?.imagenUrl
  const selectedDays = reservationDates(form.fecha, form.fechaFin).length
  const complete = Boolean(selectedSpace && form.fecha && form.fechaFin && form.fechaFin >= form.fecha && form.horaInicio && form.horaFin && Number(form.cantidadPersonas) > 0)
  const hint = !selectedSpace ? 'Selecciona un espacio para continuar.' : !form.fecha || !form.fechaFin ? 'Completa la fecha de inicio y la fecha de fin.' : form.fechaFin < form.fecha ? 'La fecha final debe ser igual o posterior a la fecha inicial.' : !form.horaInicio || !form.horaFin ? 'Completa el horario para continuar.' : ''
  const updateForm = (changes) => { onFormChange({ ...form, ...changes }); onClearAvailability() }

  return (
    <main className="page-container reserve-page">
      <p className="eyebrow">Nueva reserva</p><h1>Configura tu visita</h1><p>Primero elige el lugar y después el espacio que necesitas. Horario institucional: 08:00 a 17:00.</p>
      <form className="reservation-form polished visual-reservation-form" onSubmit={onReview}>
        {selectedSpace && <CustomReservationSchedule form={form} setForm={(nextForm) => { onFormChange(nextForm); onClearAvailability() }} />}
        <section className="visual-selector"><div className="selector-heading"><span>1</span><div><strong>Selecciona el lugar</strong><small>Sede, campo escuela, hostel u otra instalación</small></div></div>
          <div className="reserve-place-grid">{reservablePlaces.map((place, index) => { const cover = placeCover(place); return <button type="button" className={`reserve-place-card tone-${index % 3} ${String(selectedPlaceId) === String(place.id) ? 'selected' : ''}`} key={place.id} onClick={() => onPlaceChange(place.id)}><span className="reserve-card-image" style={cover ? { backgroundImage: `linear-gradient(0deg,rgba(17,23,51,.68),rgba(17,23,51,.08)),url(${BACKEND}${cover})` } : undefined} /><span className="reserve-card-copy"><strong>{place.nombre}</strong><small>{spaces.filter((space) => String(space.lugarId) === String(place.id) && space.estado === 'DISPONIBLE').length} espacios disponibles</small></span>{String(selectedPlaceId) === String(place.id) && <b>✓</b>}</button> })}</div>
        </section>
        <section className={`visual-selector ${selectedReservePlace ? '' : 'disabled-step'}`}><div className="selector-heading"><span>2</span><div><strong>Selecciona el espacio</strong><small>{selectedReservePlace ? `Opciones disponibles en ${selectedReservePlace.nombre}` : 'Primero selecciona un lugar'}</small></div></div>
          {selectedReservePlace && (placeSpaces.length ? <div className="reserve-space-grid">{placeSpaces.map((space) => <button type="button" className={`reserve-space-card ${String(selectedSpace?.id) === String(space.id) ? 'selected' : ''}`} key={space.id} onClick={() => onSpaceChange(space)}><span className="reserve-card-image" style={space.imagenUrl ? { backgroundImage: `linear-gradient(0deg,rgba(17,23,51,.62),rgba(17,23,51,.04)),url(${BACKEND}${space.imagenUrl})` } : undefined} /><span className="reserve-card-copy"><strong>{space.nombre}</strong><small>{space.tipo} · hasta {space.capacidad} personas</small></span>{String(selectedSpace?.id) === String(space.id) && <b>✓</b>}</button>)}</div> : <div className="selector-empty">Este lugar todavía no tiene espacios disponibles.</div>)}
        </section>
        {selectedSpace && <div className="selected-space-summary"><span>✓</span><div><small>ESPACIO SELECCIONADO</small><strong>{selectedSpace.nombre}</strong><p>{selectedReservePlace?.nombre} · {selectedSpace.categoria} · hasta {selectedSpace.capacidad} personas</p></div></div>}
        <div className="selector-heading schedule-heading"><span>3</span><div><strong>Define fechas y horario</strong><small>El mismo horario se reservará en cada día seleccionado</small></div></div>
        <div className="date-range-fields"><label>Fecha de inicio<input type="date" min={new Date().toISOString().slice(0, 10)} required value={form.fecha} onChange={(event) => updateForm({ fecha: event.target.value, fechaFin: form.fechaFin && form.fechaFin < event.target.value ? event.target.value : form.fechaFin })} /></label><label>Fecha de fin<input type="date" min={form.fecha || new Date().toISOString().slice(0, 10)} required value={form.fechaFin} onChange={(event) => updateForm({ fechaFin: event.target.value })} /></label></div>
        <label>Hora inicio<input type="time" min="08:00" max="17:00" required value={form.horaInicio} onChange={(event) => updateForm({ horaInicio: event.target.value })} /></label>
        <label>Hora fin<input type="time" min="08:00" max="17:00" required value={form.horaFin} onChange={(event) => updateForm({ horaFin: event.target.value })} /></label>
        <label>Personas<input type="number" min="1" max={selectedSpace?.capacidad || undefined} required value={form.cantidadPersonas} onChange={(event) => updateForm({ cantidadPersonas: event.target.value })} /></label>
        <div className="live-total reservation-live-total"><div><span>Duración diaria</span><strong>{hours || 0} hora(s)</strong></div><div><span>Días seleccionados</span><strong>{selectedDays || 0}</strong></div><div><span>Total provisional</span><strong>{formatCurrency(hours * hourlyRate * selectedDays)}</strong></div></div>
        {reservationAvailability === 'available' && <div className="availability-result available">✓ Horario disponible en todas las fechas</div>}{reservationAvailability === 'unavailable' && <div className="availability-result unavailable">× Una de las fechas está ocupada</div>}
        <button className="primary-button reserve-review-button" disabled={!complete || checkingReservation}>{checkingReservation ? 'Comprobando fechas…' : 'Comprobar y revisar reserva'}</button>{hint && <p className="reservation-form-hint">{hint}</p>}
      </form>
      {message && <p className="form-error">{message}</p>}
    </main>
  )
}
