import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1'
const BACKEND = API.replace(/\/api\/v1\/?$/, '')
const INITIAL_RESET_TOKEN = new URLSearchParams(window.location.search).get('resetToken') || ''
const PASSWORD_MESSAGE = 'La contraseña debe tener entre 8 y 72 caracteres e incluir mayúscula, minúscula y número'

function isStrongPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/.test(password)
}

async function readJson(response) {
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.detail || body.message || `Error ${response.status}`)
  return body
}

async function readJsonArray(response) {
  const body = await readJson(response)
  if (!Array.isArray(body)) throw new Error('El servidor devolvió una respuesta inesperada')
  return body
}

function Header({ user, page, navigate, logout, unreadCount }) {
  const items = user
    ? [['dashboard', 'Dashboard'], ['spaces', 'Espacios'], ['reserve', 'Reservar'], ['reservations', 'Mis reservas'], ['payments', 'Pagos'], ['notifications', `Avisos${unreadCount ? ` (${unreadCount})` : ''}`], ['profile', 'Mi perfil']]
    : [['home', 'Inicio'], ['spaces', 'Espacios']]
  if (user && ['ADMIN', 'SUPERADMIN'].includes(user.rol)) items.push(['admin', 'Administración'])
  return <header className="app-nav"><button className="app-brand" onClick={() => navigate(user ? 'dashboard' : 'home')}><span>GS</span><div>SpaceFlow<small>Reservas institucionales</small></div></button><nav>{items.map(([key, label]) => <button className={page === key ? 'active' : ''} key={key} onClick={() => navigate(key)}>{label}</button>)}</nav>{user ? <button className="nav-session" onClick={logout}>Cerrar sesión</button> : <button className="nav-session" onClick={() => navigate('login', page)}>Iniciar sesión</button>}</header>
}

function WorkspaceApp() {
  const [page, setPage] = useState(INITIAL_RESET_TOKEN ? 'login' : 'home')
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
  const [types, setTypes] = useState([])
  const [categories, setCategories] = useState([])
  const [places, setPlaces] = useState([])
  const [selectedPlaceId, setSelectedPlaceId] = useState(null)
  const [editingSpace, setEditingSpace] = useState(null)
  const [spaceImage, setSpaceImage] = useState(null)
  const [savingSpace, setSavingSpace] = useState(false)
  const [showPlaceEditor, setShowPlaceEditor] = useState(false)
  const [editingPlaceId, setEditingPlaceId] = useState(null)
  const [placeForm, setPlaceForm] = useState({ nombre: '', descripcion: '', direccion: '', estado: 'ACTIVO' })
  const [editingReservation, setEditingReservation] = useState(null)
  const [savingReservation, setSavingReservation] = useState(false)
  const [availabilityForm, setAvailabilityForm] = useState({ fecha: '', horaInicio: '08:00', horaFin: '09:00', cantidadPersonas: 1 })
  const [availabilityTypeId, setAvailabilityTypeId] = useState('')
  const [availableSpaceIds, setAvailableSpaceIds] = useState(null)
  const [adminTab, setAdminTab] = useState('reservas')
  const [adminUsers, setAdminUsers] = useState([])
  const [adminReservations, setAdminReservations] = useState([])
  const [adminPayments, setAdminPayments] = useState([])
  const [auditEntries, setAuditEntries] = useState([])
  const [authMode, setAuthMode] = useState(INITIAL_RESET_TOKEN ? 'reset' : 'login')
  const [recoveryToken, setRecoveryToken] = useState(INITIAL_RESET_TOKEN)
  const [notifications, setNotifications] = useState([])
  const [reportSummary, setReportSummary] = useState({ total: 0, proximas: 0, porEstado: {} })
  const [reportFilters, setReportFilters] = useState({ desde: '', hasta: '', estado: '' })
  const [selectedSpace, setSelectedSpace] = useState(null)
  const [form, setForm] = useState({ fecha: '', horaInicio: '', horaFin: '', cantidadPersonas: 1 })
  const [message, setMessage] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [hourlyRate, setHourlyRate] = useState(25000)

  const auth = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token])
  const navigate = (next, origin) => { if (next === 'login') setReturnPage(origin || page); setPage(next); setMessage('') }

  useEffect(() => {
    if (!INITIAL_RESET_TOKEN) return
    window.history.replaceState({}, document.title, window.location.pathname)
  }, [])

  useEffect(() => {
    if (!token) return
    fetch(`${API}/usuarios/me`, { headers: auth }).then(r => r.ok ? r.json() : Promise.reject()).then(setUser).catch(() => { localStorage.removeItem('reservas_token'); setToken(null) })
  }, [token, auth])

  useEffect(() => {
    fetch(`${API}/configuracion-publica`).then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setHourlyRate(Number(data.tarifaHora)))
      .catch(() => setHourlyRate(25000))
    fetch(`${API}/espacios`).then(readJsonArray).then(data => {
      setSpaces(data)
      setTypes([...new Map(data.map(space => [space.tipoId, { id:space.tipoId, nombre:space.tipo }])).values()])
    }).catch(() => setSpaces([]))
    fetch(`${API}/lugares`).then(readJsonArray).then(data => { setPlaces(data); if (data.length) setSelectedPlaceId(current => current || data[0].id) }).catch(() => setPlaces([]))
  }, [])

  useEffect(() => {
    if (!token) return
    fetch(`${API}/reservas/mias`, { headers: auth }).then(readJsonArray).then(setReservations).catch(() => setReservations([]))
    fetch(`${API}/pagos/mios`, { headers: auth }).then(readJsonArray).then(setPayments).catch(() => setPayments([]))
    fetch(`${API}/notificaciones`, { headers: auth }).then(readJsonArray).then(setNotifications).catch(() => setNotifications([]))
  }, [token, page, auth])

  useEffect(() => {
    if (!user || !['ADMIN', 'SUPERADMIN'].includes(user.rol)) return
    Promise.all([
      fetch(`${API}/admin/catalogo/tipos`, { headers: auth }).then(readJsonArray),
      fetch(`${API}/admin/catalogo/categorias`, { headers: auth }).then(readJsonArray),
      fetch(`${API}/admin/catalogo/espacios`, { headers: auth }).then(readJsonArray),
      fetch(`${API}/admin/catalogo/lugares`, { headers: auth }).then(readJsonArray)
    ]).then(([typeData, categoryData, spaceData, placeData]) => { setTypes(typeData); setCategories(categoryData); setSpaces(spaceData); setPlaces(placeData); if (placeData.length) setSelectedPlaceId(current => current || placeData[0].id) }).catch(error => setMessage(error.message || 'No se pudo cargar el catálogo administrativo'))
  }, [user, token, auth])

  useEffect(() => {
    if (!['admin', 'dashboard'].includes(page) || !user || !['ADMIN', 'SUPERADMIN'].includes(user.rol)) return
    Promise.all([
      fetch(`${API}/admin/usuarios`, { headers: auth }).then(readJsonArray),
      fetch(`${API}/admin/reservas`, { headers: auth }).then(readJsonArray),
      fetch(`${API}/admin/pagos`, { headers: auth }).then(readJsonArray),
      fetch(`${API}/admin/reportes/resumen`, { headers: auth }).then(readJson),
      fetch(`${API}/admin/auditoria?limite=100`, { headers: auth }).then(readJsonArray)
    ]).then(([usersData, reservationsData, paymentsData, summaryData, auditData]) => { setAdminUsers(usersData); setAdminReservations(reservationsData); setAdminPayments(paymentsData); setReportSummary(summaryData); setAuditEntries(auditData) }).catch(error => setMessage(error.message || 'No se pudo cargar la administración'))
  }, [page, user, token, auth])

  useEffect(() => {
    if (page !== 'admin' || adminTab !== 'auditoria' || !user || !['ADMIN', 'SUPERADMIN'].includes(user.rol)) return
    fetch(`${API}/admin/auditoria?limite=100`, { headers: auth })
      .then(readJsonArray)
      .then(setAuditEntries)
      .catch(() => setMessage('No se pudo actualizar la bitácora'))
  }, [page, adminTab, user, auth])

  const hours = useMemo(() => {
    if (!form.horaInicio || !form.horaFin) return 0
    const [sh, sm] = form.horaInicio.split(':').map(Number); const [eh, em] = form.horaFin.split(':').map(Number)
    return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60)
  }, [form.horaInicio, form.horaFin])

  const visibleSpaces = useMemo(() => (selectedPlaceId === 'sin-lugar'
    ? spaces.filter(space => !space.lugarId)
    : spaces.filter(space => String(space.lugarId) === String(selectedPlaceId)))
    .filter(space => availableSpaceIds === null || availableSpaceIds.includes(space.id)), [spaces, selectedPlaceId, availableSpaceIds])

  async function login(event) {
    event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget))
    const response = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!response.ok) return setMessage('Correo o contraseña incorrectos')
    const result = await response.json(); localStorage.setItem('reservas_token', result.token); setToken(result.token); setUser(result.usuario); setPage(returnPage)
  }

  async function register(event) {
    event.preventDefault(); setMessage(''); const data = Object.fromEntries(new FormData(event.currentTarget))
    if (data.password !== data.confirmacion) return setMessage('Las contraseñas no coinciden')
    if (!isStrongPassword(data.password)) return setMessage(PASSWORD_MESSAGE)
    const response = await fetch(`${API}/auth/registro`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ nombre:data.nombre, correo:data.correo, password:data.password }) })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status}`)
    setAuthMode('login'); setMessage('Registro exitoso. Ya puedes iniciar sesión.')
  }

  async function requestRecovery(event) {
    event.preventDefault(); setMessage(''); const data = Object.fromEntries(new FormData(event.currentTarget))
    const response = await fetch(`${API}/auth/recuperacion/solicitar`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status}`)
    setRecoveryToken(body.tokenDesarrollo || ''); setAuthMode('reset'); setMessage(body.tokenDesarrollo ? 'Token local generado. Confirma tu nueva contraseña.' : body.mensaje)
  }

  async function confirmRecovery(event) {
    event.preventDefault(); setMessage(''); const data = Object.fromEntries(new FormData(event.currentTarget))
    if (data.passwordNuevo !== data.confirmacion) return setMessage('Las contraseñas no coinciden')
    if (!isStrongPassword(data.passwordNuevo)) return setMessage(PASSWORD_MESSAGE)
    const response = await fetch(`${API}/auth/recuperacion/confirmar`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({token:data.token,passwordNuevo:data.passwordNuevo}) })
    if (!response.ok) { const body = await response.json().catch(() => ({})); return setMessage(body.detail || body.message || `Error ${response.status}`) }
    setAuthMode('login'); setRecoveryToken(''); setMessage('Contraseña restablecida. Ya puedes iniciar sesión.')
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
    setPaymentResult(body); setPayments(current => current.some(payment => payment.id === body.id) ? current.map(payment => payment.id === body.id ? body : payment) : [body, ...current])
    setReservations(current => current.map(r => r.id === body.reservaId && body.estado === 'APROBADO' ? { ...r, estado: 'CONFIRMADA' } : r))
    setPaymentReservationId('')
    setMessage(body.estado === 'APROBADO' ? 'Pago simulado aprobado. La reserva quedó confirmada.' : 'Método registrado. El pago quedó pendiente de verificación.')
  }

  function openSpaceEditor(space) {
    setEditingSpace({ ...space, tipoId: String(space.tipoId), categoriaId: String(space.categoriaId), lugarId: space.lugarId ? String(space.lugarId) : '' })
    setSpaceImage(null); setMessage('')
  }

  function openSpaceCreator() {
    setEditingSpace({ id: null, nombre: '', descripcion: '', capacidad: 1, imagenUrl: null, tipoId: types[0] ? String(types[0].id) : '', categoriaId: categories[0] ? String(categories[0].id) : '', lugarId: selectedPlaceId && selectedPlaceId !== 'sin-lugar' ? String(selectedPlaceId) : '', estado: 'DISPONIBLE' })
    setSpaceImage(null); setMessage('')
  }

  async function saveSpace(event) {
    event.preventDefault(); setSavingSpace(true); setMessage('')
    const payload = { nombre: editingSpace.nombre, descripcion: editingSpace.descripcion || '', capacidad: Number(editingSpace.capacidad), tipoId: Number(editingSpace.tipoId), categoriaId: Number(editingSpace.categoriaId), lugarId: editingSpace.lugarId ? Number(editingSpace.lugarId) : null, estado: editingSpace.estado }
    const creating = !editingSpace.id
    let response = await fetch(creating ? `${API}/admin/catalogo/espacios` : `${API}/admin/catalogo/espacios/${editingSpace.id}`, { method: creating ? 'POST' : 'PUT', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    let updated = await response.json().catch(() => ({}))
    if (response.ok && spaceImage) {
      const imageData = new FormData(); imageData.append('imagen', spaceImage)
      response = await fetch(`${API}/admin/catalogo/espacios/${updated.id}/imagen`, { method: 'POST', headers: auth, body: imageData })
      updated = await response.json().catch(() => ({}))
    }
    setSavingSpace(false)
    if (!response.ok) return setMessage(updated.detail || updated.message || `Error ${response.status} al guardar el espacio`)
    setSpaces(current => creating ? [...current, updated] : current.map(space => space.id === updated.id ? updated : space)); setSelectedSpace(current => current?.id === updated.id ? updated : current)
    setSelectedPlaceId(updated.lugarId); setEditingSpace(null); setSpaceImage(null); setMessage(creating ? 'Espacio creado correctamente' : 'Espacio actualizado correctamente')
  }

  async function savePlace(event) {
    event.preventDefault(); setSavingSpace(true); setMessage('')
    const response = await fetch(editingPlaceId ? `${API}/admin/catalogo/lugares/${editingPlaceId}` : `${API}/admin/catalogo/lugares`, { method: editingPlaceId ? 'PUT' : 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(placeForm) })
    const body = await response.json().catch(() => ({})); setSavingSpace(false)
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status} al guardar el lugar`)
    setPlaces(current => editingPlaceId ? current.map(place => place.id === body.id ? body : place) : [...current, body]); setSelectedPlaceId(body.id); setShowPlaceEditor(false); setEditingPlaceId(null); setPlaceForm({ nombre: '', descripcion: '', direccion: '', estado: 'ACTIVO' }); setMessage(editingPlaceId ? 'Lugar actualizado correctamente' : 'Lugar creado. Ahora puedes asignarle espacios.')
  }

  function openPlaceCreator() {
    setEditingPlaceId(null); setPlaceForm({ nombre: '', descripcion: '', direccion: '', estado: 'ACTIVO' }); setMessage(''); setShowPlaceEditor(true)
  }

  function openPlaceEditor(place) {
    setEditingPlaceId(place.id); setPlaceForm({ nombre: place.nombre, descripcion: place.descripcion || '', direccion: place.direccion || '', estado: place.estado }); setMessage(''); setShowPlaceEditor(true)
  }

  async function deleteSpace(space) {
    if (!window.confirm(`¿Desactivar el espacio "${space.nombre}"?`)) return
    const response = await fetch(`${API}/admin/catalogo/espacios/${space.id}`, { method: 'DELETE', headers: auth })
    if (!response.ok) return setMessage(`No se pudo eliminar el espacio (error ${response.status})`)
    setSpaces(current => current.map(item => item.id === space.id ? { ...item, estado: 'INACTIVO' } : item)); setMessage('Espacio desactivado correctamente')
  }

  async function deletePlace(place) {
    if (!window.confirm(`¿Desactivar el lugar "${place.nombre}"? Sus espacios dejarán de mostrarse públicamente.`)) return
    const response = await fetch(`${API}/admin/catalogo/lugares/${place.id}`, { method: 'DELETE', headers: auth })
    if (!response.ok) return setMessage(`No se pudo eliminar el lugar (error ${response.status})`)
    setPlaces(current => current.map(item => item.id === place.id ? { ...item, estado: 'INACTIVO' } : item)); setMessage('Lugar desactivado correctamente')
  }

  function openReservationEditor(reservation) {
    setEditingReservation({ ...reservation, espacioId: String(reservation.espacioId), cantidadPersonas: reservation.cantidadPersonas }); setMessage('')
  }

  async function saveReservation(event) {
    event.preventDefault(); setSavingReservation(true); setMessage('')
    const payload = { fecha: editingReservation.fecha, horaInicio: editingReservation.horaInicio, horaFin: editingReservation.horaFin, cantidadPersonas: Number(editingReservation.cantidadPersonas), espacioId: Number(editingReservation.espacioId) }
    const response = await fetch(`${API}/reservas/${editingReservation.id}`, { method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const body = await response.json().catch(() => ({})); setSavingReservation(false)
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status} al modificar la reserva`)
    setReservations(current => current.map(item => item.id === body.id ? body : item)); setEditingReservation(null); setMessage('Reserva modificada y enviada nuevamente a revisión')
  }

  async function cancelReservation(reservation) {
    if (!window.confirm(`¿Cancelar la reserva #${reservation.id} de ${reservation.espacio}?`)) return
    const response = await fetch(`${API}/reservas/${reservation.id}/cancelar`, { method: 'PATCH', headers: auth })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status} al cancelar la reserva`)
    setReservations(current => current.map(item => item.id === body.id ? body : item)); setMessage('Reserva cancelada. El horario quedó disponible nuevamente.')
  }

  async function checkAvailability(event) {
    event.preventDefault(); setMessage('')
    const params = new URLSearchParams({ fecha: availabilityForm.fecha, horaInicio: availabilityForm.horaInicio, horaFin: availabilityForm.horaFin, personas: availabilityForm.cantidadPersonas, lugarId: selectedPlaceId })
    if (availabilityTypeId) params.set('tipoId', availabilityTypeId)
    const response = await fetch(`${API}/reservas/disponibilidad?${params}`)
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status} al consultar disponibilidad`)
    setAvailableSpaceIds(body.map(space => space.id)); setMessage(`${body.length} espacio(s) disponible(s) para el horario indicado`)
  }

  async function reviewAdminReservation(reservation, action) {
    const response = await fetch(`${API}/admin/reservas/${reservation.id}/${action}`, { method: 'PATCH', headers: auth })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status}`)
    setAdminReservations(current => current.map(item => item.id === body.id ? body : item)); setMessage(`Reserva ${action === 'aprobar' ? 'aprobada' : 'rechazada'}`)
  }

  async function reviewAdminPayment(payment, action) {
    const response = await fetch(`${API}/admin/pagos/${payment.id}/${action}`, { method: 'PATCH', headers: auth })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status}`)
    setAdminPayments(current => current.map(item => item.id === body.id ? body : item)); setMessage(`Pago ${action === 'aprobar' ? 'aprobado' : 'rechazado'}`)
  }

  async function updateAdminUser(target, changes) {
    const response = await fetch(`${API}/admin/usuarios/${target.id}`, { method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: changes.estado || target.estado, rol: changes.rol || target.rol }) })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status}`)
    setAdminUsers(current => current.map(item => item.id === body.id ? body : item)); setMessage('Usuario actualizado correctamente')
  }

  async function updateProfile(event) {
    event.preventDefault(); setMessage(''); const data = Object.fromEntries(new FormData(event.currentTarget)); const correoAnterior = user.correo
    const response = await fetch(`${API}/usuarios/me`, { method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status}`)
    setUser(body)
    if (body.correo !== correoAnterior) { setMessage('Perfil actualizado. Inicia sesión nuevamente con tu nuevo correo.'); setTimeout(logout, 1800) }
    else setMessage('Perfil actualizado correctamente')
  }

  async function readNotification(notification) {
    if (notification.leida) return
    const response = await fetch(`${API}/notificaciones/${notification.id}/leer`, { method:'PATCH', headers:auth })
    if (!response.ok) return
    const body = await response.json(); setNotifications(current => current.map(item => item.id === body.id ? body : item))
  }

  async function downloadReservationsReport(event, format = 'csv') {
    event?.preventDefault(); setMessage('')
    if (reportFilters.desde && reportFilters.hasta && reportFilters.desde > reportFilters.hasta)
      return setMessage('La fecha inicial no puede ser posterior a la fecha final')
    const params = new URLSearchParams()
    Object.entries(reportFilters).forEach(([key,value]) => { if (value) params.set(key,value) })
    const response = await fetch(`${API}/admin/reportes/reservas.${format}?${params}`, { headers:auth })
    if (!response.ok) { const body = await response.json().catch(() => ({})); return setMessage(body.detail || `No se pudo generar el reporte (error ${response.status})`) }
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `reservas-${new Date().toISOString().slice(0,10)}.${format}`; link.click(); URL.revokeObjectURL(url); setMessage(`Reporte ${format.toUpperCase()} generado correctamente`)
  }

  async function downloadReceipt(payment) {
    const response = await fetch(`${API}/pagos/${payment.id}/comprobante`, { headers:auth })
    if (!response.ok) return setMessage(`No se pudo generar el comprobante (error ${response.status})`)
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `comprobante-${payment.referencia}.pdf`; link.click(); URL.revokeObjectURL(url)
  }

  async function changePassword(event) {
    event.preventDefault(); setMessage(''); const formElement = event.currentTarget; const data = Object.fromEntries(new FormData(formElement))
    if (data.passwordNuevo !== data.confirmacion) return setMessage('La confirmación de la contraseña no coincide')
    if (!isStrongPassword(data.passwordNuevo)) return setMessage(PASSWORD_MESSAGE)
    const response = await fetch(`${API}/usuarios/me/password`, { method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ passwordActual:data.passwordActual, passwordNuevo:data.passwordNuevo }) })
    if (!response.ok) { const body = await response.json().catch(() => ({})); return setMessage(body.detail || body.message || `Error ${response.status}`) }
    formElement.reset(); localStorage.removeItem('reservas_token'); setToken(null); setUser(null)
    setReservations([]); setPayments([]); setAuthMode('login'); setPage('login')
    setMessage('Contraseña restablecida. Inicia sesión nuevamente con tu nueva contraseña.')
  }

  function renderDashboard() {
    return ['ADMIN', 'SUPERADMIN'].includes(user?.rol) ? renderAdminDashboard() : renderClientDashboard()
  }

  function renderAdminDashboard() {
    const pendingReservations = adminReservations.filter(item => item.estado === 'PENDIENTE').length
    const pendingPayments = adminPayments.filter(item => item.estado === 'PENDIENTE_VERIFICACION').length
    const activeUsers = adminUsers.filter(item => item.estado === 'ACTIVO').length
    const total = Math.max(reportSummary.total || 0, 1)
    const confirmed = reportSummary.porEstado?.CONFIRMADA || 0
    const approved = reportSummary.porEstado?.APROBADA || 0
    const pending = reportSummary.porEstado?.PENDIENTE || 0
    const confirmedEnd = (confirmed / total) * 100
    const approvedEnd = confirmedEnd + (approved / total) * 100
    const pendingEnd = approvedEnd + (pending / total) * 100
    const chartStyle = { background: `conic-gradient(#2f8f66 0 ${confirmedEnd}%, #5368d9 ${confirmedEnd}% ${approvedEnd}%, #e3a938 ${approvedEnd}% ${pendingEnd}%, #e8ebf4 ${pendingEnd}% 100%)` }
    return <main className="page-container role-dashboard admin-dashboard">
      <div className="dashboard-welcome"><div><p className="eyebrow">Panel administrativo · {user?.rol}</p><h1>Resumen institucional</h1><p>Hola, {user?.nombre}. Supervisa reservas, pagos y capacidad desde un solo lugar.</p></div><button className="primary-button" onClick={() => navigate('admin')}>Abrir administración</button></div>
      {message && <p className="form-message">{message}</p>}
      <section className="dashboard-metrics">
        <button onClick={() => navigate('admin')}><span className="metric-icon indigo">▤</span><div><small>Reservas totales</small><strong>{reportSummary.total || 0}</strong><em>{reportSummary.proximas || 0} próximas</em></div></button>
        <button onClick={() => { setAdminTab('reservas'); navigate('admin') }}><span className="metric-icon amber">!</span><div><small>Por revisar</small><strong>{pendingReservations}</strong><em>Solicitudes pendientes</em></div></button>
        <button onClick={() => { setAdminTab('pagos'); navigate('admin') }}><span className="metric-icon green">₡</span><div><small>Pagos pendientes</small><strong>{pendingPayments}</strong><em>Requieren validación</em></div></button>
        <button onClick={() => { setAdminTab('usuarios'); navigate('admin') }}><span className="metric-icon violet">◎</span><div><small>Usuarios activos</small><strong>{activeUsers}</strong><em>{adminUsers.length} cuentas registradas</em></div></button>
      </section>
      <div className="dashboard-grid">
        <section className="dashboard-panel status-overview"><div className="panel-heading"><div><p className="eyebrow">Estado general</p><h2>Distribución de reservas</h2></div><button onClick={() => { setAdminTab('reportes'); navigate('admin') }}>Ver reportes →</button></div><div className="donut-layout"><div className="donut-chart" style={chartStyle}><div><strong>{reportSummary.total || 0}</strong><span>Total</span></div></div><div className="chart-legend">{[['CONFIRMADA','#2f8f66'],['APROBADA','#5368d9'],['PENDIENTE','#e3a938'],['OTRAS','#e8ebf4']].map(([label,color]) => <div key={label}><i style={{background:color}}/><span>{label}</span><strong>{label === 'OTRAS' ? Math.max(0,(reportSummary.total || 0)-confirmed-approved-pending) : reportSummary.porEstado?.[label] || 0}</strong></div>)}</div></div></section>
        <section className="dashboard-panel quick-management"><div className="panel-heading"><div><p className="eyebrow">Operación</p><h2>Gestión rápida</h2></div></div><div className="quick-action-list"><button onClick={() => navigate('spaces')}><span>⌂</span><div><strong>Catálogo institucional</strong><small>{places.filter(place => place.estado === 'ACTIVO').length} lugares · {spaces.length} espacios</small></div><b>→</b></button><button onClick={() => { setAdminTab('reservas'); navigate('admin') }}><span>✓</span><div><strong>Revisar solicitudes</strong><small>{pendingReservations ? `${pendingReservations} esperando decisión` : 'Todo está al día'}</small></div><b>→</b></button><button onClick={() => { setAdminTab('auditoria'); navigate('admin') }}><span>◷</span><div><strong>Bitácora administrativa</strong><small>Consulta los últimos cambios sensibles</small></div><b>→</b></button></div></section>
      </div>
      <section className="dashboard-panel recent-activity"><div className="panel-heading"><div><p className="eyebrow">Actividad</p><h2>Reservas recientes</h2></div><button onClick={() => { setAdminTab('reservas'); navigate('admin') }}>Ver todas →</button></div>{adminReservations.length === 0 ? <div className="dashboard-empty">Aún no hay reservas registradas.</div> : <div className="recent-list">{adminReservations.slice(0,5).map(item => <article key={item.id}><span className={`status-dot ${item.estado.toLowerCase()}`}/><div><strong>{item.espacio}</strong><small>#{item.id} · {item.correoUsuario}</small></div><time>{item.fecha}<small>{item.horaInicio} - {item.horaFin}</small></time><b className={`reservation-status ${item.estado.toLowerCase()}`}>{item.estado}</b></article>)}</div>}</section>
    </main>
  }

  function renderClientDashboard() {
    const activeStates = ['PENDIENTE','APROBADA','CONFIRMADA']
    const upcoming = reservations.filter(item => activeStates.includes(item.estado) && new Date(`${item.fecha}T${item.horaInicio}`) >= new Date()).sort((a,b) => `${a.fecha}T${a.horaInicio}`.localeCompare(`${b.fecha}T${b.horaInicio}`))
    const nextReservation = upcoming[0]
    const pendingCount = reservations.filter(item => item.estado === 'PENDIENTE').length
    const confirmedCount = reservations.filter(item => item.estado === 'CONFIRMADA').length
    const approvedPayments = payments.filter(item => item.estado === 'APROBADO')
    const paidTotal = approvedPayments.reduce((sum,item) => sum + Number(item.monto || 0), 0)
    const unread = notifications.filter(item => !item.leida).length
    return <main className="page-container role-dashboard client-dashboard">
      <div className="dashboard-welcome"><div><p className="eyebrow">Mi panel de reservas</p><h1>Hola, {user?.nombre}</h1><p>Organiza tus próximas actividades y consulta el estado de tus solicitudes.</p></div><button className="primary-button" onClick={() => navigate('spaces')}>Buscar un espacio</button></div>
      <section className="dashboard-metrics client-metrics"><button onClick={() => navigate('reservations')}><span className="metric-icon indigo">▤</span><div><small>Próximas reservas</small><strong>{upcoming.length}</strong><em>{pendingCount} pendientes</em></div></button><button onClick={() => navigate('reservations')}><span className="metric-icon green">✓</span><div><small>Confirmadas</small><strong>{confirmedCount}</strong><em>Listas para tu visita</em></div></button><button onClick={() => navigate('payments')}><span className="metric-icon amber">₡</span><div><small>Pagos aprobados</small><strong>{approvedPayments.length}</strong><em>₡{paidTotal.toLocaleString('es-CR')} registrados</em></div></button><button onClick={() => navigate('notifications')}><span className="metric-icon violet">●</span><div><small>Avisos nuevos</small><strong>{unread}</strong><em>{notifications.length} notificaciones</em></div></button></section>
      <div className="dashboard-grid client-grid">
        <section className="dashboard-panel next-booking"><div className="panel-heading"><div><p className="eyebrow">Agenda</p><h2>Tu próxima reserva</h2></div><button onClick={() => navigate('reservations')}>Ver historial →</button></div>{nextReservation ? <div className="next-booking-card"><div className="calendar-tile"><strong>{new Date(`${nextReservation.fecha}T12:00:00`).toLocaleDateString('es-CR',{day:'2-digit'})}</strong><span>{new Date(`${nextReservation.fecha}T12:00:00`).toLocaleDateString('es-CR',{month:'short'}).replace('.','')}</span></div><div><h3>{nextReservation.espacio}</h3><p>{nextReservation.horaInicio} - {nextReservation.horaFin} · {nextReservation.cantidadPersonas} persona(s)</p><b className={`reservation-status ${nextReservation.estado.toLowerCase()}`}>{nextReservation.estado}</b></div></div> : <div className="dashboard-empty"><strong>No tienes reservas próximas</strong><span>Explora el catálogo y programa tu siguiente actividad.</span><button className="secondary-button" onClick={() => navigate('spaces')}>Explorar espacios</button></div>}</section>
        <section className="dashboard-panel quick-management"><div className="panel-heading"><div><p className="eyebrow">Accesos</p><h2>¿Qué deseas hacer?</h2></div></div><div className="quick-action-list"><button onClick={() => navigate('spaces')}><span>⌕</span><div><strong>Consultar disponibilidad</strong><small>Filtra por fecha, hora y capacidad</small></div><b>→</b></button><button onClick={() => navigate('payments')}><span>₡</span><div><strong>Completar un pago</strong><small>Revisa reservas pendientes de pago</small></div><b>→</b></button><button onClick={() => navigate('profile')}><span>◎</span><div><strong>Actualizar mi perfil</strong><small>Gestiona tus datos y contraseña</small></div><b>→</b></button></div></section>
      </div>
      <section className="dashboard-panel client-notices"><div className="panel-heading"><div><p className="eyebrow">Novedades</p><h2>Avisos recientes</h2></div><button onClick={() => navigate('notifications')}>Ver todos →</button></div>{notifications.length === 0 ? <div className="dashboard-empty">No tienes avisos por el momento.</div> : <div className="notice-preview">{notifications.slice(0,3).map(item => <button key={item.id} onClick={() => navigate('notifications')}><span className={item.leida ? 'read' : 'unread'}>{item.tipo === 'PAGO' ? '₡' : item.tipo === 'RESERVA' ? '⌂' : 'i'}</span><div><strong>{item.titulo}</strong><small>{item.mensaje}</small></div><time>{new Date(item.creadaEn).toLocaleDateString('es-CR')}</time></button>)}</div>}</section>
    </main>
  }

  function renderSpacesPage() {
    const isAdmin = user && ['ADMIN', 'SUPERADMIN'].includes(user.rol)
    const currentPlace = places.find(place => String(place.id) === String(selectedPlaceId))
    return <main className="page-container">
      <p className="eyebrow">Catálogo institucional</p>
      <div className="catalog-title"><div><h1>Lugares y espacios</h1><p>Primero selecciona un lugar para consultar sus espacios reservables.</p></div>{isAdmin && <div className="catalog-admin-actions"><button className="secondary-button" onClick={openPlaceCreator}>+ Crear lugar</button><button className="primary-button" disabled={!places.some(place => place.estado === 'ACTIVO')} onClick={openSpaceCreator}>+ Crear espacio</button></div>}</div>
      {message && <p className="form-message">{message}</p>}
      <div className="place-selector">
        {places.map((place, index) => <article className={`place-card place-tone-${index % 3} ${String(selectedPlaceId) === String(place.id) ? 'selected' : ''} ${place.estado === 'INACTIVO' ? 'inactive' : ''}`} key={place.id}><button className="place-select-button" onClick={() => { setSelectedPlaceId(place.id); setAvailableSpaceIds(null) }}><span>⌂</span><strong>{place.nombre}</strong><small>{place.descripcion || place.direccion || 'Lugar institucional'}</small><b>{spaces.filter(space => space.lugarId === place.id).length} espacios</b></button>{isAdmin && <div className="card-admin-actions"><button onClick={() => openPlaceEditor(place)}>Editar</button><button className="danger" disabled={place.estado === 'INACTIVO'} onClick={() => deletePlace(place)}>Eliminar</button></div>}</article>)}
        {isAdmin && spaces.some(space => !space.lugarId) && <article className={`place-card unassigned ${selectedPlaceId === 'sin-lugar' ? 'selected' : ''}`}><button className="place-select-button" onClick={() => setSelectedPlaceId('sin-lugar')}><span>!</span><strong>Sin lugar asignado</strong><small>Espacios que debes organizar</small><b>{spaces.filter(space => !space.lugarId).length} espacios</b></button></article>}
      </div>
      {places.length === 0 && !(isAdmin && spaces.some(space => !space.lugarId)) ? <div className="catalog-empty"><strong>Aún no hay lugares registrados</strong><span>Un administrador debe crear primero Sede Nacional, Campo Escuela, Hostel u otro lugar.</span></div> : <section className="place-section"><div className="place-heading"><div className="place-symbol">⌂</div><div><h2>{selectedPlaceId === 'sin-lugar' ? 'Sin lugar asignado' : currentPlace?.nombre || 'Selecciona un lugar'}</h2><span>{visibleSpaces.length} espacio(s)</span></div>{isAdmin && currentPlace && <div className="place-heading-actions"><button onClick={() => openPlaceEditor(currentPlace)}>Editar lugar</button><button className="danger" disabled={currentPlace.estado === 'INACTIVO'} onClick={() => deletePlace(currentPlace)}>Eliminar lugar</button></div>}</div>
        {selectedPlaceId !== 'sin-lugar' && <form className="availability-bar" onSubmit={checkAvailability}><label>Fecha<input type="date" required value={availabilityForm.fecha} onChange={e => setAvailabilityForm({...availabilityForm, fecha:e.target.value})}/></label><label>Desde<input type="time" min="08:00" max="17:00" required value={availabilityForm.horaInicio} onChange={e => setAvailabilityForm({...availabilityForm, horaInicio:e.target.value})}/></label><label>Hasta<input type="time" min="08:00" max="17:00" required value={availabilityForm.horaFin} onChange={e => setAvailabilityForm({...availabilityForm, horaFin:e.target.value})}/></label><label>Tipo<select value={availabilityTypeId} onChange={e => setAvailabilityTypeId(e.target.value)}><option value="">Todos</option>{types.map(type => <option key={type.id} value={type.id}>{type.nombre}</option>)}</select></label><label>Personas<input type="number" min="1" required value={availabilityForm.cantidadPersonas} onChange={e => setAvailabilityForm({...availabilityForm, cantidadPersonas:e.target.value})}/></label><button className="primary-button">Consultar disponibilidad</button>{availableSpaceIds !== null && <button type="button" className="secondary-button" onClick={() => { setAvailableSpaceIds(null); setAvailabilityTypeId('') }}>Limpiar</button>}</form>}
        {visibleSpaces.length === 0 ? <div className="catalog-empty"><strong>{availableSpaceIds === null ? 'Este lugar todavía no tiene espacios' : 'No hay espacios disponibles'}</strong><span>{availableSpaceIds === null ? (isAdmin ? 'Usa “Crear espacio” para agregar el primero.' : 'Pronto se agregarán espacios reservables.') : 'Prueba otra fecha, horario o cantidad de personas.'}</span></div> : <div className="space-list">{visibleSpaces.map((space, index) => <article className={`space-card space-tone-${index % 3} ${space.estado === 'INACTIVO' ? 'inactive' : ''}`} key={space.id}><div className="space-image" style={space.imagenUrl ? { backgroundImage: `linear-gradient(0deg, rgba(19,24,43,.5), rgba(19,24,43,.08)), url(${BACKEND}${space.imagenUrl})` } : undefined}><span>{space.tipo}</span>{space.estado !== 'DISPONIBLE' && <b>{space.estado}</b>}</div><div className="space-info"><h3>{space.nombre}</h3><p>{space.descripcion}</p><small>Capacidad: {space.capacidad} · {space.categoria}</small><div className="space-actions"><button className="primary-button" disabled={space.estado !== 'DISPONIBLE'} onClick={() => { setSelectedSpace(space); setForm({...form, ...availabilityForm}); user ? navigate('reserve') : navigate('login', 'reserve') }}>{space.estado === 'DISPONIBLE' ? 'Reservar' : 'No disponible'}</button>{isAdmin && <><button className="edit-space-button" onClick={() => openSpaceEditor(space)}>Editar</button><button className="delete-space-button" disabled={space.estado === 'INACTIVO'} onClick={() => deleteSpace(space)}>Eliminar</button></>}</div></div></article>)}</div>}
      </section>}
    </main>
  }

  function renderAdminPage() {
    return <main className="page-container admin-page"><p className="eyebrow">Acceso administrativo</p><h1>Administración</h1><div className="admin-tabs">{[['reservas','Reservas'],['pagos','Pagos'],['usuarios','Usuarios'],['reportes','Reportes'],['auditoria','Bitácora']].map(([key,label]) => <button className={adminTab === key ? 'active' : ''} key={key} onClick={() => { setAdminTab(key); setMessage('') }}>{label}</button>)}</div>{message && <p className="form-message">{message}</p>}
      {adminTab === 'reservas' && <div className="admin-table"><div className="admin-table-head"><span>Reserva</span><span>Usuario</span><span>Fecha</span><span>Estado / Acciones</span></div>{adminReservations.length === 0 ? <p className="admin-empty">No hay reservas registradas.</p> : adminReservations.map(reservation => <article key={reservation.id}><div><strong>#{reservation.id} · {reservation.espacio}</strong><small>{reservation.cantidadPersonas} persona(s)</small></div><span>{reservation.correoUsuario}</span><span>{reservation.fecha}<small>{reservation.horaInicio} - {reservation.horaFin}</small></span><div className="admin-row-actions"><b className={`reservation-status ${reservation.estado.toLowerCase()}`}>{reservation.estado}</b>{reservation.estado === 'PENDIENTE' && <><button onClick={() => reviewAdminReservation(reservation,'aprobar')}>Aprobar</button><button className="danger" onClick={() => reviewAdminReservation(reservation,'rechazar')}>Rechazar</button></>}</div></article>)}</div>}
      {adminTab === 'pagos' && <div className="admin-table payments-admin"><div className="admin-table-head"><span>Referencia</span><span>Reserva</span><span>Monto</span><span>Estado / Acciones</span></div>{adminPayments.length === 0 ? <p className="admin-empty">No hay pagos registrados.</p> : adminPayments.map(payment => <article key={payment.id}><div><strong>{payment.referencia}</strong><small>{payment.metodo.replaceAll('_',' ')}</small></div><span>Reserva #{payment.reservaId}</span><strong>₡{Number(payment.monto).toLocaleString('es-CR')}</strong><div className="admin-row-actions"><b className={`payment-status ${payment.estado.toLowerCase()}`}>{payment.estado.replaceAll('_',' ')}</b>{payment.estado === 'PENDIENTE_VERIFICACION' && <><button onClick={() => reviewAdminPayment(payment,'aprobar')}>Aprobar</button><button className="danger" onClick={() => reviewAdminPayment(payment,'rechazar')}>Rechazar</button></>}</div></article>)}</div>}
      {adminTab === 'usuarios' && <div className="admin-table users-admin"><div className="admin-table-head"><span>Usuario</span><span>Correo</span><span>Rol</span><span>Estado</span></div>{adminUsers.map(target => <article key={target.id}><strong>{target.nombre}</strong><span>{target.correo}</span><select value={target.rol} disabled={user?.rol !== 'SUPERADMIN' || target.id === user?.id} onChange={e => updateAdminUser(target,{rol:e.target.value})}><option value="USUARIO">Usuario</option><option value="ADMIN">Administrador</option>{user?.rol === 'SUPERADMIN' && <option value="SUPERADMIN">Superadministrador</option>}</select><select value={target.estado} disabled={target.id === user?.id || (user?.rol !== 'SUPERADMIN' && target.rol !== 'USUARIO')} onChange={e => updateAdminUser(target,{estado:e.target.value})}><option value="ACTIVO">Activo</option><option value="BLOQUEADO">Bloqueado</option><option value="INACTIVO">Inactivo</option></select></article>)}</div>}
      {adminTab === 'reportes' && <div className="reports-panel"><div className="report-metrics"><article><span>Total de reservas</span><strong>{reportSummary.total}</strong></article><article><span>Reservas próximas</span><strong>{reportSummary.proximas}</strong></article><article><span>Confirmadas</span><strong>{reportSummary.porEstado?.CONFIRMADA || 0}</strong></article><article><span>Pendientes</span><strong>{reportSummary.porEstado?.PENDIENTE || 0}</strong></article></div><section className="report-chart"><h2>Distribución por estado</h2>{['PENDIENTE','APROBADA','CONFIRMADA','CANCELADA','RECHAZADA'].map(value => { const count = reportSummary.porEstado?.[value] || 0; return <div className="chart-row" key={value}><span>{value}</span><div><i style={{width:`${(count / Math.max(reportSummary.total || 0, 1)) * 100}%`}}/></div><strong>{count}</strong></div> })}</section><form className="report-form" onSubmit={downloadReservationsReport}><h2>Exportar reservas</h2><p>Genera archivos CSV o PDF usando los mismos filtros opcionales.</p><div><label>Desde<input type="date" value={reportFilters.desde} onChange={e => setReportFilters({...reportFilters,desde:e.target.value})}/></label><label>Hasta<input type="date" value={reportFilters.hasta} onChange={e => setReportFilters({...reportFilters,hasta:e.target.value})}/></label><label>Estado<select value={reportFilters.estado} onChange={e => setReportFilters({...reportFilters,estado:e.target.value})}><option value="">Todos</option>{['PENDIENTE','APROBADA','CONFIRMADA','CANCELADA','RECHAZADA'].map(value => <option key={value}>{value}</option>)}</select></label></div><div className="report-actions"><button className="primary-button">Descargar CSV</button><button type="button" className="secondary-button" onClick={() => downloadReservationsReport(null, 'pdf')}>Descargar PDF</button></div></form></div>}
      {adminTab === 'auditoria' && <div className="admin-table audit-table"><div className="admin-table-head"><span>Fecha</span><span>Actor</span><span>Acción</span><span>Recurso / Detalle</span></div>{auditEntries.length === 0 ? <p className="admin-empty">Aún no hay operaciones registradas en la bitácora.</p> : auditEntries.map(entry => <article key={entry.id}><span>{new Date(entry.creadaEn).toLocaleString('es-CR')}</span><span>{entry.actor}</span><b>{entry.accion}</b><div><strong>{entry.recurso}{entry.recursoId ? ` #${entry.recursoId}` : ''}</strong><small>{entry.detalle}</small></div></article>)}</div>}
    </main>
  }

  function logout() { localStorage.removeItem('reservas_token'); setToken(null); setUser(null); setReservations([]); setPayments([]); fetch(`${API}/espacios`).then(readJsonArray).then(setSpaces).catch(() => setSpaces([])); fetch(`${API}/lugares`).then(readJsonArray).then(data => { setPlaces(data); setSelectedPlaceId(data[0]?.id || null) }).catch(() => setPlaces([])); setPage('home') }

  return <div className="workspace-app"><Header user={user} page={page} navigate={navigate} logout={logout} unreadCount={notifications.filter(notification => !notification.leida).length} />
    {page === 'home' && <main className="new-hero"><div><p className="eyebrow">Guías y Scouts de Costa Rica</p><h1>Reserva espacios institucionales con claridad.</h1><p>Consulta disponibilidad, crea solicitudes y da seguimiento desde una sola plataforma.</p><button className="primary-button" onClick={() => navigate('spaces')}>Explorar espacios</button></div></main>}
    {page === 'login' && <main className="auth-shell">{authMode === 'login' && <form className="auth-card" onSubmit={login}><p className="eyebrow">Acceso institucional</p><h1>Iniciar sesión</h1><label>Correo<input name="correo" type="email" required /></label><label>Contraseña<input name="password" type="password" required /></label>{message && <p className={message.includes('exitoso') || message.includes('restablecida') ? 'form-message' : 'form-error'}>{message}</p>}<button className="primary-button">Entrar</button><div className="auth-links"><button type="button" onClick={() => { setAuthMode('register'); setMessage('') }}>Crear cuenta</button><button type="button" onClick={() => { setAuthMode('recover'); setMessage('') }}>Olvidé mi contraseña</button></div><button className="link-button" type="button" onClick={() => setPage(returnPage)}>Volver</button></form>}{authMode === 'register' && <form className="auth-card" onSubmit={register}><p className="eyebrow">Nueva cuenta</p><h1>Registrarse</h1><label>Nombre<input name="nombre" required maxLength="120"/></label><label>Correo<input name="correo" type="email" required/></label><label>Contraseña<input name="password" type="password" minLength="8" maxLength="72" required/></label><label>Confirmar contraseña<input name="confirmacion" type="password" minLength="8" maxLength="72" required/></label>{message && <p className="form-error">{message}</p>}<button className="primary-button">Crear cuenta</button><button className="link-button" type="button" onClick={() => { setAuthMode('login'); setMessage('') }}>Ya tengo una cuenta</button></form>}{authMode === 'recover' && <form className="auth-card" onSubmit={requestRecovery}><p className="eyebrow">Recuperación</p><h1>Recuperar acceso</h1><p>Ingresa el correo asociado a tu cuenta.</p><label>Correo<input name="correo" type="email" required/></label>{message && <p className="form-error">{message}</p>}<button className="primary-button">Generar solicitud</button><button className="link-button" type="button" onClick={() => setAuthMode('login')}>Volver al acceso</button></form>}{authMode === 'reset' && <form className="auth-card" onSubmit={confirmRecovery}><p className="eyebrow">Nueva contraseña</p><h1>Restablecer</h1><label>Token<input name="token" required defaultValue={recoveryToken}/></label><label>Nueva contraseña<input name="passwordNuevo" type="password" minLength="8" maxLength="72" required/></label><label>Confirmar contraseña<input name="confirmacion" type="password" minLength="8" maxLength="72" required/></label>{message && <p className={recoveryToken ? 'form-message' : 'form-error'}>{message}</p>}<button className="primary-button">Guardar contraseña</button><button className="link-button" type="button" onClick={() => setAuthMode('login')}>Cancelar</button></form>}</main>}
    {page === 'dashboard' && renderDashboard()}
    {page === 'spaces' && renderSpacesPage()}
    {page === 'reserve' && <main className="page-container reserve-page"><p className="eyebrow">Nueva reserva</p><h1>Configura tu visita</h1><p>Horario institucional: 08:00 a 17:00.</p><form className="reservation-form polished" onSubmit={reviewReservation}><div className="space-picker"><div className="space-picker-icon">⌂</div><div className="space-picker-copy"><small>ESPACIO SELECCIONADO</small><strong>{selectedSpace?.nombre || 'Selecciona un espacio'}</strong><span>{selectedSpace ? `${selectedSpace.tipo} · ${selectedSpace.categoria} · hasta ${selectedSpace.capacidad} personas` : 'Elige el lugar donde deseas realizar la actividad'}</span></div><label>Cambiar espacio<select required value={selectedSpace?.id || ''} onChange={e => setSelectedSpace(spaces.find(s => String(s.id) === e.target.value))}><option value="">Seleccionar espacio</option>{spaces.map(s => <option value={s.id} key={s.id}>{s.nombre}</option>)}</select></label></div><label>Fecha<input type="date" required value={form.fecha} onChange={e => setForm({...form, fecha:e.target.value})}/></label><label>Hora inicio<input type="time" min="08:00" max="17:00" required value={form.horaInicio} onChange={e => setForm({...form, horaInicio:e.target.value})}/></label><label>Hora fin<input type="time" min="08:00" max="17:00" required value={form.horaFin} onChange={e => setForm({...form, horaFin:e.target.value})}/></label><label>Personas<input type="number" min="1" max={selectedSpace?.capacidad || undefined} required value={form.cantidadPersonas} onChange={e => setForm({...form, cantidadPersonas:e.target.value})}/></label><div className="live-total"><span>Total provisional</span><strong>₡{(hours * hourlyRate).toLocaleString('es-CR')}</strong></div><button className="primary-button">Revisar reserva</button></form>{message && <p className="form-error">{message}</p>}</main>}
    {page === 'reservations' && <main className="page-container"><p className="eyebrow">Historial personal</p><h1>Mis reservas</h1><p>Consulta, modifica o cancela tus solicitudes activas.</p>{message && <p className="form-message">{message}</p>}<div className="reservation-card">{reservations.length === 0 ? <p>No tienes reservas.</p> : reservations.map(r => <article className="reservation-item" key={r.id}><div><strong>{r.espacio}</strong><p>Reserva #{r.id} · {r.fecha} · {r.horaInicio} - {r.horaFin} · {r.cantidadPersonas} persona(s)</p></div><div className="reservation-controls"><span className={`reservation-status ${r.estado.toLowerCase()}`}>{r.estado}</span>{['PENDIENTE','APROBADA'].includes(r.estado) && !payments.some(payment => payment.reservaId === r.id && payment.estado !== 'RECHAZADO') && <button onClick={() => openReservationEditor(r)}>Modificar</button>}{['PENDIENTE','APROBADA','CONFIRMADA'].includes(r.estado) && <button className="danger" onClick={() => cancelReservation(r)}>Cancelar</button>}</div></article>)}</div></main>}
    {page === 'payments' && <main className="page-container payment-page"><p className="eyebrow">Demostración segura</p><h1>Pagos</h1><p>Prueba el flujo en colones costarricenses. No se solicitan ni almacenan datos bancarios reales.</p>
      <div className="payment-layout"><form className="payment-panel" onSubmit={submitPayment}><div className="payment-steps"><span className="active">1</span><i></i><span className="active">2</span><i></i><span>3</span></div><h2>Completar reserva</h2>
        <label>Reserva pendiente<select value={paymentReservationId} onChange={e => { setPaymentReservationId(e.target.value); setPaymentResult(null) }} required><option value="">Seleccionar reserva</option>{reservations.filter(r => !payments.some(p => p.reservaId === r.id && p.estado !== 'RECHAZADO') && !['CANCELADA','RECHAZADA'].includes(r.estado)).map(r => <option key={r.id} value={r.id}>#{r.id} · {r.espacio} · {r.fecha}</option>)}</select></label>
        {paymentReservationId && (() => { const r = reservations.find(item => String(item.id) === paymentReservationId); if (!r) return null; const start = r.horaInicio.split(':').map(Number); const end = r.horaFin.split(':').map(Number); const duration = Math.max(0, ((end[0]*60+end[1])-(start[0]*60+start[1]))/60); return <div className="payment-summary"><strong>{r.espacio}</strong><span>{r.fecha} · {r.horaInicio} - {r.horaFin}</span><div><span>Total demostrativo</span><strong>₡{(duration * hourlyRate).toLocaleString('es-CR')}</strong></div></div> })()}
        <fieldset className="payment-methods"><legend>Método de pago</legend>{[['TARJETA_MOCK','Tarjeta simulada','Aprobación inmediata, sin ingresar números reales.'],['TRANSFERENCIA','Transferencia bancaria','Quedará pendiente de verificación institucional.'],['EFECTIVO','Efectivo en sede','Paga posteriormente en la sede seleccionada.']].map(([value,title,help]) => <label className={paymentMethod === value ? 'selected' : ''} key={value}><input type="radio" name="metodo" value={value} checked={paymentMethod === value} onChange={e => setPaymentMethod(e.target.value)}/><span><strong>{title}</strong><small>{help}</small></span></label>)}</fieldset>
        <button className="primary-button payment-submit" disabled={paying}>{paying ? 'Procesando…' : paymentMethod === 'TARJETA_MOCK' ? 'Simular pago y confirmar' : 'Registrar método de pago'}</button>{message && <p className={paymentResult ? 'form-message' : 'form-error'}>{message}</p>}
      </form><aside className="payment-panel payment-history"><h2>Pagos registrados</h2>{payments.length === 0 ? <p>Aún no hay pagos.</p> : payments.map(p => <article key={p.id}><div><strong>{p.referencia}</strong><small>Reserva #{p.reservaId} · {p.metodo.replace('_MOCK','')}</small>{p.estado === 'APROBADO' && <button className="receipt-button" onClick={() => downloadReceipt(p)}>Descargar comprobante</button>}</div><div><strong>₡{Number(p.monto).toLocaleString('es-CR')}</strong><span className={`payment-status ${p.estado.toLowerCase()}`}>{p.estado.replaceAll('_',' ')}</span></div></article>)}</aside></div>
      {paymentResult && <div className="custom-modal-overlay"><section className="custom-modal payment-success"><button className="custom-modal-close" onClick={() => setPaymentResult(null)}>×</button><div className="success-check">✓</div><p className="eyebrow">Operación registrada</p><h2>{paymentResult.estado === 'APROBADO' ? 'Reserva confirmada' : 'Pendiente de verificación'}</h2><p>Referencia: <strong>{paymentResult.referencia}</strong></p><div className="modal-total"><span>Total</span><strong>₡{Number(paymentResult.monto).toLocaleString('es-CR')}</strong><small>Moneda: colón costarricense (CRC)</small></div><div className="custom-modal-actions"><button className="secondary-button" onClick={() => setPaymentResult(null)}>Cerrar</button><button className="primary-button" onClick={() => { setPaymentResult(null); navigate('reservations') }}>Ver mis reservas</button></div></section></div>}
    </main>}
    {page === 'notifications' && <main className="page-container notifications-page"><p className="eyebrow">Centro de avisos</p><h1>Notificaciones</h1><p>Actualizaciones de tus reservas, pagos y cuenta.</p><div className="notification-list">{notifications.length === 0 ? <div className="catalog-empty"><strong>No tienes notificaciones</strong><span>Los cambios importantes aparecerán aquí.</span></div> : notifications.map(notification => <button className={notification.leida ? 'read' : 'unread'} key={notification.id} onClick={() => readNotification(notification)}><span className={`notification-icon ${notification.tipo.toLowerCase()}`}>{notification.tipo === 'PAGO' ? '₡' : notification.tipo === 'RESERVA' ? '⌂' : 'i'}</span><div><strong>{notification.titulo}</strong><p>{notification.mensaje}</p><small>{new Date(notification.creadaEn).toLocaleString('es-CR')}</small></div>{!notification.leida && <b>NUEVA</b>}</button>)}</div></main>}
    {page === 'profile' && <main className="page-container profile-page"><p className="eyebrow">Cuenta personal</p><h1>Mi perfil</h1><div className="profile-layout"><form className="profile-card" onSubmit={updateProfile}><h2>Información personal</h2><p>Actualiza el nombre y correo asociados a tu cuenta.</p><label>Nombre<input name="nombre" required maxLength="120" defaultValue={user?.nombre}/></label><label>Correo<input name="correo" type="email" required maxLength="160" defaultValue={user?.correo}/></label><div className="profile-meta"><span>Rol</span><strong>{user?.rol}</strong><span>Estado</span><strong>{user?.estado}</strong></div><button className="primary-button">Guardar perfil</button></form><form className="profile-card" onSubmit={changePassword}><h2>Cambiar contraseña</h2><p>Utiliza al menos 8 caracteres y no repitas tu contraseña actual.</p><label>Contraseña actual<input name="passwordActual" type="password" required/></label><label>Nueva contraseña<input name="passwordNuevo" type="password" minLength="8" maxLength="72" required/></label><label>Confirmar contraseña<input name="confirmacion" type="password" minLength="8" maxLength="72" required/></label><button className="primary-button">Actualizar contraseña</button></form></div>{message && <p className={message.includes('correct') || message.includes('actualiz') ? 'form-message' : 'form-error'}>{message}</p>}</main>}
    {page === 'admin' && renderAdminPage()}
    {showSummary && <div className="custom-modal-overlay"><section className="custom-modal"><button className="custom-modal-close" onClick={() => setShowSummary(false)}>×</button><p className="eyebrow">Resumen de reserva</p><h2>{selectedSpace?.nombre}</h2><div className="modal-summary-grid"><div><small>Fecha</small><strong>{form.fecha}</strong></div><div><small>Horario</small><strong>{form.horaInicio} - {form.horaFin}</strong></div><div><small>Duración</small><strong>{hours} hora(s)</strong></div></div><div className="modal-total"><span>Total provisional</span><strong>₡{(hours * hourlyRate).toLocaleString('es-CR')}</strong><small>Tarifa demostrativa: ₡{hourlyRate.toLocaleString('es-CR')} por hora</small></div><div className="custom-modal-actions"><button className="secondary-button" onClick={() => setShowSummary(false)}>Volver</button><button className="primary-button" onClick={confirmReservation}>Confirmar</button></div></section></div>}
    {editingSpace && <div className="custom-modal-overlay"><form className="custom-modal space-editor" onSubmit={saveSpace}><button type="button" className="custom-modal-close" onClick={() => setEditingSpace(null)}>×</button><p className="eyebrow">Administración</p><h2>{editingSpace.id ? 'Editar espacio' : 'Crear espacio'}</h2><div className="space-editor-grid"><label>Nombre<input required maxLength="120" value={editingSpace.nombre} onChange={e => setEditingSpace({...editingSpace, nombre:e.target.value})}/></label><label>Capacidad<input required type="number" min="1" value={editingSpace.capacidad} onChange={e => setEditingSpace({...editingSpace, capacidad:e.target.value})}/></label><label className="full-field">Descripción<textarea maxLength="500" rows="3" value={editingSpace.descripcion || ''} onChange={e => setEditingSpace({...editingSpace, descripcion:e.target.value})}/></label><label>Lugar<select required value={editingSpace.lugarId} onChange={e => setEditingSpace({...editingSpace, lugarId:e.target.value})}><option value="">Seleccionar lugar</option>{places.filter(place => place.estado === 'ACTIVO').map(place => <option key={place.id} value={place.id}>{place.nombre}</option>)}</select></label><label>Tipo<select required value={editingSpace.tipoId} onChange={e => setEditingSpace({...editingSpace, tipoId:e.target.value})}>{types.map(type => <option key={type.id} value={type.id}>{type.nombre}</option>)}</select></label><label>Categoría<select required value={editingSpace.categoriaId} onChange={e => setEditingSpace({...editingSpace, categoriaId:e.target.value})}>{categories.map(category => <option key={category.id} value={category.id}>{category.nombre}</option>)}</select></label><label>Estado<select value={editingSpace.estado} onChange={e => setEditingSpace({...editingSpace, estado:e.target.value})}><option value="DISPONIBLE">Disponible</option><option value="MANTENIMIENTO">Mantenimiento</option><option value="INACTIVO">Inactivo</option></select></label><label>Fotografía<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => setSpaceImage(e.target.files[0] || null)}/><small>JPG, PNG o WEBP · máximo 5 MB</small></label></div>{message && <p className="form-error">{message}</p>}<div className="custom-modal-actions"><button type="button" className="secondary-button" onClick={() => setEditingSpace(null)}>Cancelar</button><button className="primary-button" disabled={savingSpace}>{savingSpace ? 'Guardando…' : editingSpace.id ? 'Guardar cambios' : 'Crear espacio'}</button></div></form></div>}
    {showPlaceEditor && <div className="custom-modal-overlay"><form className="custom-modal" onSubmit={savePlace}><button type="button" className="custom-modal-close" onClick={() => setShowPlaceEditor(false)}>×</button><p className="eyebrow">Administración</p><h2>{editingPlaceId ? 'Editar lugar' : 'Crear lugar'}</h2><div className="space-editor-grid"><label>Nombre<input required maxLength="120" placeholder="Ej. Hostel" value={placeForm.nombre} onChange={e => setPlaceForm({...placeForm, nombre:e.target.value})}/></label><label>Estado<select value={placeForm.estado} onChange={e => setPlaceForm({...placeForm, estado:e.target.value})}><option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo</option></select></label><label className="full-field">Descripción<textarea rows="3" maxLength="500" value={placeForm.descripcion} onChange={e => setPlaceForm({...placeForm, descripcion:e.target.value})}/></label><label className="full-field">Dirección<input maxLength="250" value={placeForm.direccion} onChange={e => setPlaceForm({...placeForm, direccion:e.target.value})}/></label></div>{message && <p className="form-error">{message}</p>}<div className="custom-modal-actions"><button type="button" className="secondary-button" onClick={() => setShowPlaceEditor(false)}>Cancelar</button><button className="primary-button" disabled={savingSpace}>{savingSpace ? 'Guardando…' : editingPlaceId ? 'Guardar cambios' : 'Crear lugar'}</button></div></form></div>}
    {editingReservation && <div className="custom-modal-overlay"><form className="custom-modal" onSubmit={saveReservation}><button type="button" className="custom-modal-close" onClick={() => setEditingReservation(null)}>×</button><p className="eyebrow">Gestión de reserva</p><h2>Modificar reserva #{editingReservation.id}</h2><div className="space-editor-grid"><label className="full-field">Espacio<select required value={editingReservation.espacioId} onChange={e => setEditingReservation({...editingReservation, espacioId:e.target.value})}>{spaces.filter(space => space.estado === 'DISPONIBLE').map(space => <option key={space.id} value={space.id}>{space.lugar} · {space.nombre}</option>)}</select></label><label>Fecha<input type="date" required value={editingReservation.fecha} onChange={e => setEditingReservation({...editingReservation, fecha:e.target.value})}/></label><label>Personas<input type="number" min="1" required value={editingReservation.cantidadPersonas} onChange={e => setEditingReservation({...editingReservation, cantidadPersonas:e.target.value})}/></label><label>Hora inicio<input type="time" min="08:00" max="17:00" required value={editingReservation.horaInicio} onChange={e => setEditingReservation({...editingReservation, horaInicio:e.target.value})}/></label><label>Hora fin<input type="time" min="08:00" max="17:00" required value={editingReservation.horaFin} onChange={e => setEditingReservation({...editingReservation, horaFin:e.target.value})}/></label></div>{message && <p className="form-error">{message}</p>}<div className="custom-modal-actions"><button type="button" className="secondary-button" onClick={() => setEditingReservation(null)}>Volver</button><button className="primary-button" disabled={savingReservation}>{savingReservation ? 'Guardando…' : 'Guardar cambios'}</button></div></form></div>}
  </div>
}

export default WorkspaceApp
