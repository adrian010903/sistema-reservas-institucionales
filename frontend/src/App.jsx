import { useEffect, useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1'

function confirmarConModal({ espacio, fecha, inicio, fin, horas, total }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div')
    overlay.className = 'custom-modal-overlay'
    overlay.innerHTML = `<section class="custom-modal" role="dialog" aria-modal="true"><button class="custom-modal-close" aria-label="Cerrar">×</button><p class="eyebrow">Resumen de reserva</p><h2>Revisa tu solicitud</h2><div class="modal-summary-space"><strong>${espacio || 'Espacio seleccionado'}</strong><span>Reserva institucional</span></div><div class="modal-summary-grid"><div><small>Fecha</small><strong>${fecha}</strong></div><div><small>Horario</small><strong>${inicio} - ${fin}</strong></div><div><small>Duración</small><strong>${horas} hora(s)</strong></div></div><div class="modal-total"><span>Total provisional</span><strong>₡${total.toLocaleString('es-CR')}</strong><small>Tarifa demostrativa: ₡25 000 por hora</small></div><div class="custom-modal-actions"><button class="secondary-button modal-cancel">Cancelar</button><button class="primary-button modal-confirm">Confirmar reserva</button></div></section>`
    document.body.appendChild(overlay)
    const close = (value) => { overlay.remove(); resolve(value) }
    overlay.querySelector('.modal-cancel').addEventListener('click', () => close(false))
    overlay.querySelector('.custom-modal-close').addEventListener('click', () => close(false))
    overlay.querySelector('.modal-confirm').addEventListener('click', () => close(true))
  })
}

function App() {
  const [status, setStatus] = useState('sin consultar')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('home')
  const [returnView, setReturnView] = useState('home')
  const [login, setLogin] = useState({ correo: '', password: '' })
  const [user, setUser] = useState(null)
  const [loginError, setLoginError] = useState('')
  const [reservas, setReservas] = useState([])
  const [reservasError, setReservasError] = useState('')
  const [reservaForm, setReservaForm] = useState({ fecha: '', horaInicio: '', horaFin: '', cantidadPersonas: 1, espacioId: 1 })
  const [reservaMessage, setReservaMessage] = useState('')
  const [espacios, setEspacios] = useState([])

  async function verificarBackend() {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/status`)
      if (!response.ok) throw new Error('Respuesta no valida')
      setStatus('conectado')
    } catch {
      setStatus('sin conexión')
    } finally {
      setLoading(false)
    }
  }

  async function iniciarSesion(event) {
    event.preventDefault(); setLoginError('')
    try {
      const response = await fetch(`${API_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(login) })
      if (!response.ok) throw new Error('Correo o contraseña incorrectos')
      const data = await response.json(); localStorage.setItem('reservas_token', data.token); setUser(data.usuario); setView(returnView)
    } catch (error) { setLoginError(error.message) }
  }

  useEffect(() => {
    if (view !== 'dashboard' && view !== 'spaces') return
    const token = localStorage.getItem('reservas_token')
    fetch(`${API_URL}/espacios`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => { if (!response.ok) throw new Error('No se pudieron cargar los espacios'); return response.json() })
      .then(setEspacios).catch(() => setEspacios([]))
    fetch(`${API_URL}/reservas/mias`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => { if (!response.ok) throw new Error('No se pudieron cargar las reservas'); return response.json() })
      .then(setReservas).catch((error) => setReservasError(error.message))
  }, [view])

  async function crearReserva(event) {
    event.preventDefault(); setReservaMessage('')
    if (reservaForm.horaInicio < '08:00' || reservaForm.horaFin > '17:00') {
      setReservaMessage('El horario permitido es de 08:00 a 17:00')
      return
    }
    if (reservaForm.horaFin <= reservaForm.horaInicio) {
      setReservaMessage('La hora final debe ser posterior a la inicial')
      return
    }
    const espacioSeleccionado = espacios.find((espacio) => String(espacio.id) === String(reservaForm.espacioId))
    const horasSeleccionadas = Number(reservaForm.horaFin.split(':')[0]) - Number(reservaForm.horaInicio.split(':')[0])
    const totalSeleccionado = horasSeleccionadas * 25000
    const confirmar = await confirmarConModal({ espacio: espacioSeleccionado?.nombre, fecha: reservaForm.fecha, inicio: reservaForm.horaInicio, fin: reservaForm.horaFin, horas: horasSeleccionadas, total: totalSeleccionado })
    if (!confirmar) return
    try {
      const response = await fetch(`${API_URL}/reservas`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('reservas_token')}` }, body: JSON.stringify({ ...reservaForm, cantidadPersonas: Number(reservaForm.cantidadPersonas), espacioId: Number(reservaForm.espacioId) }) })
      if (!response.ok) {
        const rawBody = await response.text()
        let message = ''
        try {
          const errorData = rawBody ? JSON.parse(rawBody) : {}
          message = errorData.detail || errorData.message || errorData.error || ''
        } catch { message = rawBody }
        throw new Error(message || `Error ${response.status} al crear la reserva`)
      }
      const nueva = await response.json(); setReservas((actuales) => [nueva, ...actuales])
      const inicio = Number(reservaForm.horaInicio.split(':')[0])
      const fin = Number(reservaForm.horaFin.split(':')[0])
      const totalProvisional = (fin - inicio) * 25000
      setReservaMessage(`Solicitud enviada correctamente · Total provisional: ₡${totalProvisional.toLocaleString('es-CR')}`)
    } catch (error) { setReservaMessage(error.message) }
  }

  if (view === 'login') return <main className="auth-shell"><form className="auth-card" onSubmit={iniciarSesion}><p className="eyebrow">Acceso institucional</p><h1>Iniciar sesión</h1><p className="hero-description">Ingresa para consultar tus reservas y solicitar espacios.</p><label>Correo<input type="email" required value={login.correo} onChange={(event) => setLogin({ ...login, correo: event.target.value })} /></label><label>Contraseña<input type="password" required value={login.password} onChange={(event) => setLogin({ ...login, password: event.target.value })} /></label>{loginError && <p className="form-error">{loginError}</p>}<button className="primary-button" type="submit">Entrar</button><button className="link-button" type="button" onClick={() => setView('home')}>Volver al inicio</button></form></main>
  if (view === 'spaces') return <main className="spaces-shell"><nav className="topbar"><div className="brand-mark">GS</div><div><p className="brand-title">Reservas Institucionales</p><p className="brand-subtitle">Guías y Scouts de Costa Rica</p></div><button className="login-button" type="button" onClick={() => setView(user ? 'dashboard' : 'login')}>{user ? 'Mi panel' : 'Iniciar sesión'}</button></nav><section className="spaces-content"><p className="eyebrow">Catálogo institucional</p><h1>Espacios disponibles</h1><p className="hero-description">Selecciona un edificio y elige el espacio perfecto para tu evento.</p><div className="building-grid"><button className="building-card building-blue" type="button"><strong>▥ Sede Nacional</strong><span>Conferencias, eventos y reuniones institucionales</span><small>Espacios disponibles</small></button><button className="building-card building-green" type="button"><strong>♧ Campo Escuela</strong><span>Formación, innovación y trabajo colaborativo</span><small>Espacios disponibles</small></button><button className="building-card building-purple" type="button"><strong>⌂ Hostel</strong><span>Alojamiento y espacios comunitarios</span><small>Espacios disponibles</small></button></div><div className="spaces-heading"><h2>Todos los espacios</h2><span>{espacios.length} disponibles</span></div><div className="space-list">{espacios.map((espacio, index) => <article className={`space-card space-tone-${index % 3}`} key={espacio.id}><div className="space-image"><span>{espacio.tipo}</span></div><div className="space-info"><h3>{espacio.nombre}</h3><p>{espacio.descripcion || 'Espacio institucional disponible para reservas.'}</p><small>Capacidad: {espacio.capacidad} personas · {espacio.categoria}</small><button className="primary-button" type="button" onClick={() => { setReservaForm({ ...reservaForm, espacioId: espacio.id }); setView(user ? 'dashboard' : 'login') }}>Seleccionar espacio</button></div></article>)}</div></section></main>
  if (view === 'dashboard') return <main className="dashboard-shell"><nav className="topbar"><div className="brand-mark">GS</div><div><p className="brand-title">Reservas Institucionales</p><p className="brand-subtitle">Panel de usuario</p></div><button className="login-button" type="button" onClick={() => { localStorage.removeItem('reservas_token'); setUser(null); setView('home') }}>Cerrar sesión</button></nav><section className="dashboard-content"><p className="eyebrow">Sesión activa · {user?.rol}</p><h1>Hola, {user?.nombre}</h1><p className="hero-description">Consulta el estado de tus solicitudes y reservas institucionales.</p><div className="reservation-card"><div className="card-heading"><h2>Nueva reserva</h2><span>Solicitud institucional</span></div><form className="reservation-form" onSubmit={crearReserva}><label>Espacio<select required value={reservaForm.espacioId} onChange={(event) => setReservaForm({ ...reservaForm, espacioId: event.target.value })}><option value="">Selecciona un espacio</option>{espacios.map((espacio) => <option value={espacio.id} key={espacio.id}>{espacio.nombre} · capacidad {espacio.capacidad}</option>)}</select></label><label>Fecha<input type="date" required value={reservaForm.fecha} onChange={(event) => setReservaForm({ ...reservaForm, fecha: event.target.value })} /></label><label>Hora inicio<input type="time" min="08:00" max="17:00" required value={reservaForm.horaInicio} onChange={(event) => setReservaForm({ ...reservaForm, horaInicio: event.target.value })} /></label><label>Hora fin<input type="time" min="08:00" max="17:00" required value={reservaForm.horaFin} onChange={(event) => setReservaForm({ ...reservaForm, horaFin: event.target.value })} /></label><label>Personas<input type="number" min="1" required value={reservaForm.cantidadPersonas} onChange={(event) => setReservaForm({ ...reservaForm, cantidadPersonas: event.target.value })} /></label><button className="primary-button" type="submit">Solicitar reserva</button></form>{reservaMessage && <p className="form-message">{reservaMessage}</p>}</div><div className="reservation-card"><div className="card-heading"><h2>Mis reservas</h2><span>{reservas.length} registro(s)</span></div>{reservasError && <p className="form-error">{reservasError}</p>}{reservas.length === 0 && !reservasError ? <p className="empty-state">Aún no tienes reservas registradas.</p> : <div className="reservation-list">{reservas.map((reserva) => <article className="reservation-item" key={reserva.id}><div><strong>{reserva.espacio}</strong><p>{reserva.fecha} · {reserva.horaInicio} - {reserva.horaFin}</p></div><span className={`reservation-status ${reserva.estado.toLowerCase()}`}>{reserva.estado}</span></article>)}</div>}</div></section></main>

  return (
    <main className="app-shell">
      <nav className="topbar">
        <div className="brand-mark">GS</div>
        <div>
          <p className="brand-title">Reservas Institucionales</p>
          <p className="brand-subtitle">Guías y Scouts de Costa Rica</p>
        </div>
        <button className="login-button" type="button" onClick={() => { if (user) setView('dashboard'); else { setReturnView('home'); setView('login') } }}>{user ? 'Mi panel' : 'Iniciar sesión'}</button>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Plataforma institucional</p>
          <h1>Organiza tus espacios. Planifica mejores experiencias.</h1>
          <p className="hero-description">
            Consulta disponibilidad y gestiona reservas de salas, auditorios,
            hosteles, cabañas y campos escuela desde un solo lugar.
          </p>
          <div className="hero-actions">
          <button className="primary-button" type="button" onClick={() => setView('spaces')}>Explorar espacios</button>
            <button className="secondary-button" type="button">Conocer el sistema</button>
          </div>
        </div>
        <div className="hero-panel">
          <div className="panel-glow" />
          <p className="panel-label">Disponibilidad centralizada</p>
          <div className="calendar-card">
            <div className="calendar-head"><span>Septiembre 2026</span><span>•••</span></div>
            <div className="calendar-row"><span>L</span><span>K</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
            <div className="calendar-grid">{['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28'].map((day) => <span className={day === '15' ? 'selected-day' : ''} key={day}>{day}</span>)}</div>
            <div className="availability-tag"><span className="status-dot" /> 12 espacios disponibles</div>
          </div>
        </div>
      </section>

      <section className="connection-section">
        <div><p className="section-kicker">Estado del entorno local</p><h2>Backend listo para integrarse</h2></div>
        <div className={`connection-status ${status}`}><span className="status-dot" /> {status}</div>
        <button className="check-button" type="button" onClick={verificarBackend} disabled={loading}>{loading ? 'Consultando...' : 'Verificar conexión'}</button>
      </section>
    </main>
  )
}

export default App
