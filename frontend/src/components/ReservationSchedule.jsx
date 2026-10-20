import { useState } from 'react'

const DATE_LABEL = new Intl.DateTimeFormat('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
const MONTH_LABEL = new Intl.DateTimeFormat('es-CR', { month: 'long', year: 'numeric' })

export function AvailabilityDateStrip({ value, onChange }) {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const toIso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)
    return date
  })
  return (
    <div className="availability-date-strip" aria-label="Elegir fecha para consultar disponibilidad">
      <div className="availability-date-strip-heading">
        <div><span>Calendario de disponibilidad</span><strong>Elige un día para consultar espacios</strong></div>
        {value && <small>{DATE_LABEL.format(new Date(`${value}T12:00:00`)).replace('.', '')}</small>}
      </div>
      <div className="availability-date-options">
        {days.map((date, index) => {
          const dateValue = toIso(date)
          const active = dateValue === value
          return (
            <button type="button" className={active ? 'active' : ''} aria-pressed={active} key={dateValue} onClick={() => onChange(dateValue)}>
              <small>{index === 0 ? 'Hoy' : date.toLocaleDateString('es-CR', { weekday: 'short' }).replace('.', '')}</small>
              <strong>{date.getDate()}</strong>
              <span>{date.toLocaleDateString('es-CR', { month: 'short' }).replace('.', '')}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CustomReservationSchedule({ form, setForm, hourlyRate = 0, availability = null }) {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectingEnd, setSelectingEnd] = useState(false)
  const [month, setMonth] = useState(() => new Date(`${form.fecha || today.toISOString().slice(0, 10)}T12:00:00`))
  const iso = (date) => date.toISOString().slice(0, 10)
  const formatDate = (value) => (value ? DATE_LABEL.format(new Date(`${value}T12:00:00`)).replace('.', '') : 'Seleccionar fecha')
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12)
  const offset = (first.getDay() + 6) % 7
  const calendarDays = Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - offset + 1, 12))
  const startMinutes = (Number(form.horaInicio?.slice(0, 2)) || 8) * 60 + (Number(form.horaInicio?.slice(3, 5)) || 0)
  const endMinutes = (Number(form.horaFin?.slice(0, 2)) || 9) * 60 + (Number(form.horaFin?.slice(3, 5)) || 0)
  const durationMinutes = Math.max(30, endMinutes - startMinutes)
  const remainingMinutes = 17 * 60 - startMinutes
  const startTimes = Array.from({ length: 17 }, (_, index) => 8 * 60 + index * 30)
  const untilCloseIsDifferent = remainingMinutes % 60 !== 0 || remainingMinutes > 8 * 60
  const endTimes = Array.from({ length: Math.floor(remainingMinutes / 30) }, (_, index) => startMinutes + (index + 1) * 30)
  if (endMinutes > startMinutes && !endTimes.includes(endMinutes)) endTimes.push(endMinutes)
  endTimes.sort((firstTime, secondTime) => firstTime - secondTime)
  const formatTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  const formatDuration = (minutes) => minutes % 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes / 60} ${minutes === 60 ? 'hora' : 'horas'}`
  const selectedDays = form.fecha && form.fechaFin && form.fechaFin >= form.fecha
    ? Math.floor((new Date(`${form.fechaFin}T12:00:00`).getTime() - new Date(`${form.fecha}T12:00:00`).getTime()) / 86400000) + 1
    : 0
  const estimatedTotal = Math.round(hourlyRate * durationMinutes / 60 * selectedDays)
  const rangeLabel = form.fechaFin && form.fechaFin !== form.fecha
    ? `${formatDate(form.fecha)} → ${formatDate(form.fechaFin)}`
    : formatDate(form.fecha)
  const timelineStart = Math.max(0, Math.min(100, ((startMinutes - 8 * 60) / (9 * 60)) * 100))
  const timelineWidth = Math.max(0, Math.min(100 - timelineStart, (durationMinutes / (9 * 60)) * 100))
  const chooseDate = (date) => {
    const value = iso(date)
    if (!selectingEnd || !form.fecha || value < form.fecha) {
      setForm({ ...form, fecha: value, fechaFin: value })
      setSelectingEnd(true)
    } else {
      setForm({ ...form, fechaFin: value })
      setSelectingEnd(false)
      setCalendarOpen(false)
    }
  }
  const dateRangeLabel = form.fechaFin && form.fechaFin !== form.fecha ? `${formatDate(form.fecha)} → ${formatDate(form.fechaFin)}` : formatDate(form.fecha)
  return (
    <section className="custom-schedule" aria-label="Fechas y horario de la reserva">
      <label>Fechas</label>
      <button type="button" className="custom-picker-trigger" aria-expanded={calendarOpen} onClick={() => setCalendarOpen((value) => !value)}>
        <span className="picker-icon">▣</span><strong>{dateRangeLabel}</strong><span className="picker-chevron">⌄</span>
      </button>
      {calendarOpen && (
        <div className="custom-calendar">
          <header>
            <button type="button" aria-label="Mes anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1, 12))}>‹</button>
            <strong>{MONTH_LABEL.format(month)}</strong>
            <button type="button" aria-label="Mes siguiente" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1, 12))}>›</button>
          </header>
          <p>{selectingEnd ? 'Selecciona la fecha final' : 'Selecciona la fecha inicial'}</p>
          <div className="calendar-week">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="custom-calendar-grid">
            {calendarDays.map((date) => {
              const value = iso(date)
              const outside = date.getMonth() !== month.getMonth()
              const disabled = date < today
              const inRange = form.fecha && form.fechaFin && value >= form.fecha && value <= form.fechaFin
              return <button type="button" key={value} disabled={disabled} className={`${outside ? 'outside' : ''} ${value === form.fecha || value === form.fechaFin ? 'selected' : ''} ${inRange ? 'in-range' : ''}`} onClick={() => chooseDate(date)}>{date.getDate()}</button>
            })}
          </div>
          <footer>
            <button type="button" onClick={() => { const value = iso(today); setForm({ ...form, fecha: value, fechaFin: value }); setMonth(today); setSelectingEnd(true) }}>Hoy</button>
            <button type="button" onClick={() => setCalendarOpen(false)}>Cerrar</button>
          </footer>
        </div>
      )}
      <div className="reservation-time-layout">
        <section className="reservation-time-panel" aria-label="Selecciona la hora de inicio">
          <div className="reservation-time-heading"><label>Hora de inicio</label><small>08:00–17:00</small></div>
          <div className="reservation-time-grid">
            {startTimes.map((minutes) => {
              const value = formatTime(minutes)
              return <button type="button" key={value} className={`reservation-time-choice ${form.horaInicio === value ? 'active' : ''}`} aria-pressed={form.horaInicio === value} onClick={() => {
                const nextDuration = Math.min(durationMinutes, 17 * 60 - minutes)
                setForm({ ...form, horaInicio: value, horaFin: formatTime(minutes + nextDuration) })
              }}>{value}</button>
            })}
          </div>
          <div className="reservation-time-overview">
            <div className="reservation-day-timeline">
              <div className="reservation-day-timeline-labels"><span>08:00</span><span>17:00</span></div>
              <div className="reservation-day-timeline-track"><i style={{ left: `${timelineStart}%`, width: `${timelineWidth}%` }} /></div>
              <p><strong>{form.horaInicio || '08:00'}–{form.horaFin || '09:00'}</strong><span>Horario elegido dentro de la jornada</span></p>
            </div>
            <div className="reservation-request-facts">
              <div><small>Fechas</small><strong>{rangeLabel}</strong></div>
              <div><small>Días</small><strong>{selectedDays || '—'}</strong></div>
              <div><small>Personas</small><strong>{form.cantidadPersonas || 1}</strong></div>
            </div>
          </div>
        </section>
        <aside className="reservation-time-details" aria-label="Resumen del horario seleccionado">
          <div className="reservation-time-details-heading"><span>HORARIO SELECCIONADO</span><small>{formatDuration(durationMinutes)}</small></div>
          <div className="reservation-time-range" aria-live="polite">
            <div><small>Inicio</small><strong>{form.horaInicio || '08:00'}</strong></div>
            <span aria-hidden="true">→</span>
            <label className="reservation-end-field"><small htmlFor="reservation-end-time">Hora fin</small><select id="reservation-end-time" className="reservation-end-select" value={form.horaFin} onChange={(event) => setForm({ ...form, horaFin: event.target.value })} aria-label="Selecciona la hora de fin">
              {endTimes.map((minutes) => <option key={minutes} value={formatTime(minutes)}>{formatTime(minutes)}</option>)}
            </select></label>
          </div>
          <div className="reservation-duration-heading"><strong>Duración</strong><small>La hora final se ajusta sola</small></div>
          <div className="reservation-duration-options" aria-label="Selecciona la duración">
            {Array.from({ length: 8 }, (_, index) => (index + 1) * 60).map((minutes) => {
              const untilClose = minutes === remainingMinutes && (minutes > 480 || minutes % 60 !== 0)
              const unavailable = minutes > remainingMinutes
              return <button type="button" key={minutes} disabled={unavailable} className={`reservation-duration-choice ${durationMinutes === minutes ? 'active' : ''}`} aria-pressed={durationMinutes === minutes} onClick={() => setForm({ ...form, horaFin: formatTime(startMinutes + minutes) })}>{formatDuration(minutes)}</button>
            })}
            <button type="button" disabled={!untilCloseIsDifferent} className={`reservation-duration-choice until-close ${durationMinutes === remainingMinutes ? 'active' : ''}`} aria-pressed={durationMinutes === remainingMinutes} onClick={() => setForm({ ...form, horaFin: '17:00' })}>Hasta 17:00 · {formatDuration(remainingMinutes)}</button>
          </div>
          <div className="reservation-time-cost">
            <div><small>Total provisional</small><strong>₡{estimatedTotal.toLocaleString('es-CR')}</strong></div>
            <span className={`reservation-availability-state ${availability || 'pending'}`}>
              {availability === 'available' ? 'Disponible' : availability === 'unavailable' ? 'No disponible' : 'Por verificar'}
            </span>
          </div>
          <p className="reservation-time-footnote">Este horario se repetirá en cada fecha seleccionada.</p>
        </aside>
      </div>
    </section>
  )
}
