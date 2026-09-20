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

export function CustomReservationSchedule({ form, setForm }) {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectingEnd, setSelectingEnd] = useState(false)
  const [timeOpen, setTimeOpen] = useState(null)
  const [month, setMonth] = useState(() => new Date(`${form.fecha || today.toISOString().slice(0, 10)}T12:00:00`))
  const iso = (date) => date.toISOString().slice(0, 10)
  const formatDate = (value) => (value ? DATE_LABEL.format(new Date(`${value}T12:00:00`)).replace('.', '') : 'Seleccionar fecha')
  const first = new Date(month.getFullYear(), month.getMonth(), 1, 12)
  const offset = (first.getDay() + 6) % 7
  const calendarDays = Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - offset + 1, 12))
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
  const adjustTime = (field, amount) => {
    const [hours, minutes] = String(form[field] || (field === 'horaInicio' ? '08:00' : '09:00')).split(':').map(Number)
    const total = Math.min(17 * 60, Math.max(8 * 60, hours * 60 + minutes + amount))
    setForm({ ...form, [field]: `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}` })
  }
  const dateRangeLabel = form.fechaFin && form.fechaFin !== form.fecha ? `${formatDate(form.fecha)} → ${formatDate(form.fechaFin)}` : formatDate(form.fecha)
  return (
    <section className="custom-schedule" aria-label="Fechas y horario de la reserva">
      <label>Fechas</label>
      <button type="button" className="custom-picker-trigger" aria-expanded={calendarOpen} onClick={() => { setCalendarOpen((value) => !value); setTimeOpen(null) }}>
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
      {['horaInicio', 'horaFin'].map((field, index) => (
        <div className="custom-time-field" key={field}>
          <label>{index ? 'Hora de fin' : 'Hora de inicio'}</label>
          <button type="button" className="custom-picker-trigger" aria-expanded={timeOpen === field} onClick={() => { setTimeOpen(timeOpen === field ? null : field); setCalendarOpen(false) }}>
            <span className="picker-icon">◷</span><strong>{form[field] || (index ? '09:00' : '08:00')}</strong><span className="picker-chevron">⌄</span>
          </button>
          {timeOpen === field && (
            <div className="custom-time-picker">
              <button type="button" aria-label="Aumentar una hora" onClick={() => adjustTime(field, 60)}>+</button>
              <button type="button" aria-label="Aumentar treinta minutos" onClick={() => adjustTime(field, 30)}>+</button>
              <strong>{String(form[field] || (index ? '09:00' : '08:00')).slice(0, 2)}<span>:</span>{String(form[field] || (index ? '09:00' : '08:00')).slice(3, 5)}</strong>
              <button type="button" aria-label="Reducir una hora" onClick={() => adjustTime(field, -60)}>−</button>
              <button type="button" aria-label="Reducir treinta minutos" onClick={() => adjustTime(field, -30)}>−</button>
              <small>Horario permitido: 08:00–17:00</small>
            </div>
          )}
        </div>
      ))}
    </section>
  )
}
