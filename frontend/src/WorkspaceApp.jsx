import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API = 'http://localhost:8080/api/v1'
const RATE = 25000

function Header({ user, page, navigate, logout }) {
  const items = user
    ? [['dashboard', 'Dashboard'], ['spaces', 'Espacios'], ['reserve', 'Reservar'], ['reservations', 'Mis reservas'], ['payments', 'Pagos']]
    : [['home', 'Inicio'], ['spaces', 'Espacios']]
  if (user && ['ADMIN', 'SUPERADMIN'].includes(user.rol)) items.push(['admin', 'Administración'])
  return <header className="app-nav"><button className="app-brand" onClick={() => navigate(user ? 'dashboard' : 'home')}><span>GS</span><div>SpaceFlow<small>Reservas institucionales</small></div></button><nav>{items.map(([key, label]) => <button className={page === key ? 'active' : ''} key={key} onClick={() => navigate(key)}>{label}</button>)}</nav>{user ? <button className="nav-session" onClick={logout}>Cerrar sesión</button> : <button className="nav-session" onClick={() => navigate('login', page)}>Iniciar sesión</button>}</header>
}

function WorkspaceApp() {
  const [page, setPage] = useState('home')
  const [returnPage, setReturnPage] = useState('home')
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('reservas_token'))
  const [spaces, setSpaces] = useState([])
  const [reservations, setReservations] = useState([])
  const [payments, setPayments] = useState([])
  const [paymentReservationId, setPaymentReservationId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('TARJETA_MOCK')
  const [paymentResult, setPaymentResult] = useState(null)
  const [paying, setPaying] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState(null)
  const [form, setForm] = useState({ fecha: '', horaInicio: '', horaFin: '', cantidadPersonas: 1 })
  const [message, setMessage] = useState('')
  const [showSummary, setShowSummary] = useState(false)

  const auth = token ? { Authorization: `Bearer ${token}` } : {}
  const navigate = (next, origin) => { if (next === 'login') setReturnPage(origin || page); setPage(next); setMessage('') }

  useEffect(() => {
    if (!token) return
    fetch(`${API}/usuarios/me`, { headers: auth }).then(r => r.ok ? r.json() : Promise.reject()).then(setUser).catch(() => { localStorage.removeItem('reservas_token'); setToken(null) })
  }, [token])

  useEffect(() => {
    fetch(`${API}/espacios`).then(r => r.ok ? r.json() : Promise.reject()).then(setSpaces).catch(() => setSpaces([]))
  }, [])

  useEffect(() => {
    if (!token) return
    fetch(`${API}/reservas/mias`, { headers: auth }).then(r => r.json()).then(setReservations).catch(() => setReservations([]))
    fetch(`${API}/pagos/mios`, { headers: auth }).then(r => r.ok ? r.json() : []).then(setPayments).catch(() => setPayments([]))
  }, [token, page])

  const hours = useMemo(() => {
    if (!form.horaInicio || !form.horaFin) return 0
    const [sh, sm] = form.horaInicio.split(':').map(Number); const [eh, em] = form.horaFin.split(':').map(Number)
    return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60)
  }, [form.horaInicio, form.horaFin])

  async function login(event) {
    event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget))
    const response = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!response.ok) return setMessage('Correo o contraseña incorrectos')
    const result = await response.json(); localStorage.setItem('reservas_token', result.token); setToken(result.token); setUser(result.usuario); setPage(returnPage)
  }

  function reviewReservation(event) {
    event.preventDefault(); setMessage('')
    if (!selectedSpace) return setMessage('Selecciona un espacio')
    if (form.horaInicio < '08:00' || form.horaFin > '17:00') return setMessage('El horario permitido es de 08:00 a 17:00')
    if (hours <= 0) return setMessage('La hora final debe ser posterior a la inicial')
    setShowSummary(true)
  }

  async function confirmReservation() {
    const response = await fetch(`${API}/reservas`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, espacioId: selectedSpace.id, cantidadPersonas: Number(form.cantidadPersonas) }) })
    if (!response.ok) { const body = await response.json().catch(() => ({})); setShowSummary(false); return setMessage(body.detail || body.message || `Error ${response.status}`) }
    const created = await response.json(); setReservations(current => [created, ...current]); setPaymentReservationId(String(created.id)); setPaymentResult(null); setShowSummary(false); setPage('payments'); setMessage('Reserva creada. Selecciona cómo deseas completar el pago de demostración.')
  }

  async function submitPayment(event) {
    event.preventDefault(); setMessage(''); setPaymentResult(null)
    if (!paymentReservationId) return setMessage('Selecciona una reserva pendiente de pago')
    setPaying(true)
    const response = await fetch(`${API}/pagos/mock`, {
      method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservaId: Number(paymentReservationId), metodo: paymentMethod })
    })
    const body = await response.json().catch(() => ({})); setPaying(false)
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status} al registrar el pago`)
    setPaymentResult(body); setPayments(current => [body, ...current])
    setReservations(current => current.map(r => r.id === body.reservaId && body.estado === 'APROBADO' ? { ...r, estado: 'CONFIRMADA' } : r))
    setPaymentReservationId('')
    setMessage(body.estado === 'APROBADO' ? 'Pago simulado aprobado. La reserva quedó confirmada.' : 'Método registrado. El pago quedó pendiente de verificación.')
  }

  function logout() { localStorage.removeItem('reservas_token'); setToken(null); setUser(null); setPage('home') }

  return <div className="workspace-app"><Header user={user} page={page} navigate={navigate} logout={logout} />
    {page === 'home' && <main className="new-hero"><div><p className="eyebrow">Guías y Scouts de Costa Rica</p><h1>Reserva espacios institucionales con claridad.</h1><p>Consulta disponibilidad, crea solicitudes y da seguimiento desde una sola plataforma.</p><button className="primary-button" onClick={() => navigate('spaces')}>Explorar espacios</button></div></main>}
    {page === 'login' && <main className="auth-shell"><form className="auth-card" onSubmit={login}><p className="eyebrow">Acceso institucional</p><h1>Iniciar sesión</h1><label>Correo<input name="correo" type="email" required /></label><label>Contraseña<input name="password" type="password" required /></label>{message && <p className="form-error">{message}</p>}<button className="primary-button">Entrar</button><button className="link-button" type="button" onClick={() => setPage(returnPage)}>Volver</button></form></main>}
    {page === 'dashboard' && <main className="page-container"><p className="eyebrow">Panel · {user?.rol}</p><h1>Hola, {user?.nombre}</h1><div className="dashboard-cards"><button onClick={() => navigate('spaces')}><strong>{spaces.length}</strong><span>Espacios disponibles</span></button><button onClick={() => navigate('reservations')}><strong>{reservations.length}</strong><span>Mis reservas</span></button><button onClick={() => navigate('payments')}><strong>₡</strong><span>Pagos</span></button></div></main>}
    {page === 'spaces' && <main className="page-container"><p className="eyebrow">Catálogo institucional</p><h1>Espacios disponibles</h1><p>Selecciona un espacio para comenzar una reserva.</p>{spaces.length === 0 ? <div className="catalog-empty"><strong>No pudimos cargar los espacios</strong><span>Comprueba que el backend esté encendido y vuelve a actualizar.</span></div> : <div className="space-list">{spaces.map((space, index) => <article className={`space-card space-tone-${index % 3}`} key={space.id}><div className="space-image"><span>{space.tipo}</span></div><div className="space-info"><h3>{space.nombre}</h3><p>{space.descripcion}</p><small>Capacidad: {space.capacidad} · {space.categoria}</small><button className="primary-button" onClick={() => { setSelectedSpace(space); user ? navigate('reserve') : navigate('login', 'reserve') }}>Reservar</button></div></article>)}</div>}</main>}
    {page === 'reserve' && <main className="page-container reserve-page"><p className="eyebrow">Nueva reserva</p><h1>Configura tu visita</h1><p>Horario institucional: 08:00 a 17:00.</p><form className="reservation-form polished" onSubmit={reviewReservation}><div className="space-picker"><div className="space-picker-icon">⌂</div><div className="space-picker-copy"><small>ESPACIO SELECCIONADO</small><strong>{selectedSpace?.nombre || 'Selecciona un espacio'}</strong><span>{selectedSpace ? `${selectedSpace.tipo} · ${selectedSpace.categoria} · hasta ${selectedSpace.capacidad} personas` : 'Elige el lugar donde deseas realizar la actividad'}</span></div><label>Cambiar espacio<select required value={selectedSpace?.id || ''} onChange={e => setSelectedSpace(spaces.find(s => String(s.id) === e.target.value))}><option value="">Seleccionar espacio</option>{spaces.map(s => <option value={s.id} key={s.id}>{s.nombre}</option>)}</select></label></div><label>Fecha<input type="date" required value={form.fecha} onChange={e => setForm({...form, fecha:e.target.value})}/></label><label>Hora inicio<input type="time" min="08:00" max="17:00" required value={form.horaInicio} onChange={e => setForm({...form, horaInicio:e.target.value})}/></label><label>Hora fin<input type="time" min="08:00" max="17:00" required value={form.horaFin} onChange={e => setForm({...form, horaFin:e.target.value})}/></label><label>Personas<input type="number" min="1" max={selectedSpace?.capacidad || undefined} required value={form.cantidadPersonas} onChange={e => setForm({...form, cantidadPersonas:e.target.value})}/></label><div className="live-total"><span>Total provisional</span><strong>₡{(hours * RATE).toLocaleString('es-CR')}</strong></div><button className="primary-button">Revisar reserva</button></form>{message && <p className="form-error">{message}</p>}</main>}
    {page === 'reservations' && <main className="page-container"><p className="eyebrow">Historial personal</p><h1>Mis reservas</h1>{message && <p className="form-message">{message}</p>}<div className="reservation-card">{reservations.length === 0 ? <p>No tienes reservas.</p> : reservations.map(r => <article className="reservation-item" key={r.id}><div><strong>{r.espacio}</strong><p>{r.fecha} · {r.horaInicio} - {r.horaFin}</p></div><span className={`reservation-status ${r.estado.toLowerCase()}`}>{r.estado}</span></article>)}</div></main>}
    {page === 'payments' && <main className="page-container payment-page"><p className="eyebrow">Demostración segura</p><h1>Pagos</h1><p>Prueba el flujo en colones costarricenses. No se solicitan ni almacenan datos bancarios reales.</p>
      <div className="payment-layout"><form className="payment-panel" onSubmit={submitPayment}><div className="payment-steps"><span className="active">1</span><i></i><span className="active">2</span><i></i><span>3</span></div><h2>Completar reserva</h2>
        <label>Reserva pendiente<select value={paymentReservationId} onChange={e => { setPaymentReservationId(e.target.value); setPaymentResult(null) }} required><option value="">Seleccionar reserva</option>{reservations.filter(r => !payments.some(p => p.reservaId === r.id) && !['CANCELADA','RECHAZADA'].includes(r.estado)).map(r => <option key={r.id} value={r.id}>#{r.id} · {r.espacio} · {r.fecha}</option>)}</select></label>
        {paymentReservationId && (() => { const r = reservations.find(item => String(item.id) === paymentReservationId); if (!r) return null; const start = r.horaInicio.split(':').map(Number); const end = r.horaFin.split(':').map(Number); const duration = Math.max(0, ((end[0]*60+end[1])-(start[0]*60+start[1]))/60); return <div className="payment-summary"><strong>{r.espacio}</strong><span>{r.fecha} · {r.horaInicio} - {r.horaFin}</span><div><span>Total demostrativo</span><strong>₡{(duration * RATE).toLocaleString('es-CR')}</strong></div></div> })()}
        <fieldset className="payment-methods"><legend>Método de pago</legend>{[['TARJETA_MOCK','Tarjeta simulada','Aprobación inmediata, sin ingresar números reales.'],['TRANSFERENCIA','Transferencia bancaria','Quedará pendiente de verificación institucional.'],['EFECTIVO','Efectivo en sede','Paga posteriormente en la sede seleccionada.']].map(([value,title,help]) => <label className={paymentMethod === value ? 'selected' : ''} key={value}><input type="radio" name="metodo" value={value} checked={paymentMethod === value} onChange={e => setPaymentMethod(e.target.value)}/><span><strong>{title}</strong><small>{help}</small></span></label>)}</fieldset>
        <button className="primary-button payment-submit" disabled={paying}>{paying ? 'Procesando…' : paymentMethod === 'TARJETA_MOCK' ? 'Simular pago y confirmar' : 'Registrar método de pago'}</button>{message && <p className={paymentResult ? 'form-message' : 'form-error'}>{message}</p>}
      </form><aside className="payment-panel payment-history"><h2>Pagos registrados</h2>{payments.length === 0 ? <p>Aún no hay pagos.</p> : payments.map(p => <article key={p.id}><div><strong>{p.referencia}</strong><small>Reserva #{p.reservaId} · {p.metodo.replace('_MOCK','')}</small></div><div><strong>₡{Number(p.monto).toLocaleString('es-CR')}</strong><span className={`payment-status ${p.estado.toLowerCase()}`}>{p.estado.replaceAll('_',' ')}</span></div></article>)}</aside></div>
      {paymentResult && <div className="custom-modal-overlay"><section className="custom-modal payment-success"><button className="custom-modal-close" onClick={() => setPaymentResult(null)}>×</button><div className="success-check">✓</div><p className="eyebrow">Operación registrada</p><h2>{paymentResult.estado === 'APROBADO' ? 'Reserva confirmada' : 'Pendiente de verificación'}</h2><p>Referencia: <strong>{paymentResult.referencia}</strong></p><div className="modal-total"><span>Total</span><strong>₡{Number(paymentResult.monto).toLocaleString('es-CR')}</strong><small>Moneda: colón costarricense (CRC)</small></div><div className="custom-modal-actions"><button className="secondary-button" onClick={() => setPaymentResult(null)}>Cerrar</button><button className="primary-button" onClick={() => { setPaymentResult(null); navigate('reservations') }}>Ver mis reservas</button></div></section></div>}
    </main>}
    {page === 'admin' && <main className="page-container"><p className="eyebrow">Acceso administrativo</p><h1>Administración</h1><div className="reservation-card"><p>Gestión de espacios, usuarios, reservas, pagos y reportes.</p></div></main>}
    {showSummary && <div className="custom-modal-overlay"><section className="custom-modal"><button className="custom-modal-close" onClick={() => setShowSummary(false)}>×</button><p className="eyebrow">Resumen de reserva</p><h2>{selectedSpace?.nombre}</h2><div className="modal-summary-grid"><div><small>Fecha</small><strong>{form.fecha}</strong></div><div><small>Horario</small><strong>{form.horaInicio} - {form.horaFin}</strong></div><div><small>Duración</small><strong>{hours} hora(s)</strong></div></div><div className="modal-total"><span>Total provisional</span><strong>₡{(hours * RATE).toLocaleString('es-CR')}</strong><small>Tarifa demostrativa: ₡25 000 por hora</small></div><div className="custom-modal-actions"><button className="secondary-button" onClick={() => setShowSummary(false)}>Volver</button><button className="primary-button" onClick={confirmReservation}>Confirmar</button></div></section></div>}
  </div>
}

export default WorkspaceApp
