import { BACKEND } from '../services/api'
import { reservationDates } from '../utils/reservations'

// Ventanas emergentes de reservas: resumen antes de confirmar y edición de una reserva existente.

export function ReservationSummaryModal({
  user,
  selectedSpace,
  places,
  form,
  hours,
  hourlyRate,
  editingRate,
  rateForm,
  savingRate,
  onRateFormChange,
  onToggleRateEditor,
  onSaveRate,
  onClose,
  onModify,
  onConfirm,
}) {
  const isAdmin = user && ['ADMIN', 'SUPERADMIN'].includes(user.rol)
  const days = reservationDates(form.fecha, form.fechaFin).length
  return (
    <div
      className="custom-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section className="custom-modal reservation-review-modal" role="dialog" aria-modal="true" aria-labelledby="reservation-summary-title">
        <button type="button" className="custom-modal-close" aria-label="Cerrar resumen de reserva" onClick={onClose}>
          ×
        </button>
        <div
          className="review-cover"
          style={
            selectedSpace?.imagenUrl
              ? {
                  backgroundImage: `linear-gradient(0deg,rgba(33,11,77,.72),transparent),url(${BACKEND}${selectedSpace.imagenUrl})`,
                }
              : undefined
          }
        >
          <span>Horario disponible</span>
          <h2 id="reservation-summary-title">{selectedSpace?.nombre}</h2>
        </div>
        <p className="eyebrow">Resumen de reserva</p>
        <div className="review-location">
          <strong>{places.find((place) => String(place.id) === String(selectedSpace?.lugarId))?.nombre}</strong>
          <small>
            {selectedSpace?.tipo} · {selectedSpace?.categoria}
          </small>
        </div>
        <div className="modal-summary-grid">
          <div>
            <small>Fechas</small>
            <strong>
              {form.fecha} → {form.fechaFin}
            </strong>
          </div>
          <div>
            <small>Días</small>
            <strong>{days}</strong>
          </div>
          <div>
            <small>Horario diario</small>
            <strong>
              {form.horaInicio} - {form.horaFin}
            </strong>
          </div>
          <div>
            <small>Personas</small>
            <strong>{form.cantidadPersonas}</strong>
          </div>
        </div>
        <div className="modal-total">
          {isAdmin && (
            <div className="modal-rate-heading">
              <span>Tarifa por hora</span>
              <button type="button" className="modal-rate-edit" onClick={onToggleRateEditor}>
                {editingRate ? 'Cancelar' : 'Editar precio'}
              </button>
            </div>
          )}
          {editingRate && isAdmin && (
            <form className="modal-rate-form" onSubmit={onSaveRate}>
              <label>
                Nuevo precio por hora (CRC)
                <input type="number" min="0.01" step="0.01" required value={rateForm} onChange={(event) => onRateFormChange(event.target.value)} />
              </label>
              <button className="primary-button" disabled={savingRate}>
                {savingRate ? 'Guardando…' : 'Actualizar precio'}
              </button>
            </form>
          )}
          <span className="modal-rate-breakdown">
            ₡{hourlyRate.toLocaleString('es-CR')} × {hours} hora(s) × {days} día(s)
          </span>
          <strong>₡{(hours * hourlyRate * days).toLocaleString('es-CR')}</strong>
          <small>Se creará una reserva diaria por cada fecha seleccionada.</small>
        </div>
        <div className="custom-modal-actions">
          <button className="secondary-button" onClick={onModify}>
            Modificar
          </button>
          <button className="primary-button" onClick={onConfirm}>
            Confirmar y continuar al pago
          </button>
        </div>
      </section>
    </div>
  )
}

export function ReservationEditorModal({ reservation, spaces, message, saving, onChange, onClose, onSubmit }) {
  return (
    <div className="custom-modal-overlay">
      <form className="custom-modal" onSubmit={onSubmit}>
        <button type="button" className="custom-modal-close" onClick={onClose}>
          ×
        </button>
        <p className="eyebrow">Gestión de reserva</p>
        <h2>Modificar reserva #{reservation.id}</h2>
        <div className="space-editor-grid">
          <label className="full-field">
            Espacio
            <select
              required
              value={reservation.espacioId}
              onChange={(e) =>
                onChange({
                  ...reservation,
                  espacioId: e.target.value,
                })
              }
            >
              {spaces
                .filter((space) => space.estado === 'DISPONIBLE')
                .map((space) => (
                  <option key={space.id} value={space.id}>
                    {space.lugar} · {space.nombre}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Fecha
            <input
              type="date"
              required
              value={reservation.fecha}
              onChange={(e) =>
                onChange({
                  ...reservation,
                  fecha: e.target.value,
                })
              }
            />
          </label>
          <label>
            Personas
            <input
              type="number"
              min="1"
              required
              value={reservation.cantidadPersonas}
              onChange={(e) =>
                onChange({
                  ...reservation,
                  cantidadPersonas: e.target.value,
                })
              }
            />
          </label>
          <label>
            Hora inicio
            <input
              type="time"
              min="08:00"
              max="17:00"
              required
              value={reservation.horaInicio}
              onChange={(e) =>
                onChange({
                  ...reservation,
                  horaInicio: e.target.value,
                })
              }
            />
          </label>
          <label>
            Hora fin
            <input
              type="time"
              min="08:00"
              max="17:00"
              required
              value={reservation.horaFin}
              onChange={(e) =>
                onChange({
                  ...reservation,
                  horaFin: e.target.value,
                })
              }
            />
          </label>
        </div>
        {message && <p className="form-error">{message}</p>}
        <div className="custom-modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Volver
          </button>
          <button className="primary-button" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
