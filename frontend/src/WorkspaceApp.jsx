import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Header from './components/Header'
import { SocialFooter, SiempreListosRibbon } from './components/Branding'
import { AvailabilityDateStrip, CustomReservationSchedule } from './components/ReservationSchedule'
import AdminTabs from './components/AdminTabs'
import ReportFilters from './components/ReportFilters'
import ReportMetrics from './components/ReportMetrics'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import ReservationsPage from './pages/ReservationsPage'
import PaymentsPage from './pages/PaymentsPage'
import ClientDashboard from './pages/ClientDashboard'
import SpacesPage from './pages/SpacesPage'
import ReservePage from './pages/ReservePage'
import { API, BACKEND, readJson, readJsonArray } from './services/api'
import { isStrongPassword, PASSWORD_MESSAGE } from './utils/password'
import { reservationDates } from './utils/reservations'

const INITIAL_RESET_TOKEN = new URLSearchParams(window.location.search).get('resetToken') || ''
const ROUTES = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  spaces: '/espacios',
  reserve: '/reservar',
  reservations: '/reservas',
  payments: '/pagos',
  notifications: '/avisos',
  profile: '/perfil',
  admin: '/admin',
}
const PAGE_BY_PATH = Object.fromEntries(Object.entries(ROUTES).map(([page, path]) => [path, page]))

function pageFromLocation() {
  return PAGE_BY_PATH[window.location.pathname] || 'home'
}

function WorkspaceApp() {
  const [page, setPage] = useState(INITIAL_RESET_TOKEN ? 'login' : pageFromLocation())
  const [returnPage, setReturnPage] = useState('home')
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('reservas_token'))
  const [spaces, setSpaces] = useState([])
  const [reservations, setReservations] = useState([])
  const [payments, setPayments] = useState([])
  const [paymentReservationId, setPaymentReservationId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('TARJETA_MOCK')
  const [paymentStep, setPaymentStep] = useState(1)
  const [paymentResult, setPaymentResult] = useState(null)
  const [paying, setPaying] = useState(false)
  const [types, setTypes] = useState([])
  const [categories, setCategories] = useState([])
  const [places, setPlaces] = useState([])
  const [selectedPlaceId, setSelectedPlaceId] = useState(null)
  const [editingSpace, setEditingSpace] = useState(null)
  const [spaceImage, setSpaceImage] = useState(null)
  const [spaceImagePreview, setSpaceImagePreview] = useState('')
  const [savingSpace, setSavingSpace] = useState(false)
  const [showPlaceEditor, setShowPlaceEditor] = useState(false)
  const [editingPlaceId, setEditingPlaceId] = useState(null)
  const [placeForm, setPlaceForm] = useState({
    nombre: '',
    descripcion: '',
    direccion: '',
    estado: 'ACTIVO',
  })
  const [placeImage, setPlaceImage] = useState(null)
  const [placeImagePreview, setPlaceImagePreview] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editingReservation, setEditingReservation] = useState(null)
  const [savingReservation, setSavingReservation] = useState(false)
  const [availabilityForm, setAvailabilityForm] = useState({
    fecha: '',
    horaInicio: '08:00',
    horaFin: '09:00',
    cantidadPersonas: 1,
  })
  const [availabilityTypeId, setAvailabilityTypeId] = useState('')
  const [availableSpaceIds, setAvailableSpaceIds] = useState(null)
  const [adminTab, setAdminTab] = useState('usuarios')
  const [adminUsers, setAdminUsers] = useState([])
  const [adminReservations, setAdminReservations] = useState([])
  const [adminPayments, setAdminPayments] = useState([])
  const [adminFilters, setAdminFilters] = useState({
    reserva: '',
    pago: '',
    usuario: '',
    bitacora: '',
  })
  const [auditEntries, setAuditEntries] = useState([])
  const [authMode, setAuthMode] = useState(INITIAL_RESET_TOKEN ? 'reset' : 'login')
  const [recoveryToken, setRecoveryToken] = useState(INITIAL_RESET_TOKEN)
  const [notifications, setNotifications] = useState([])
  const [reportSummary, setReportSummary] = useState({
    total: 0,
    proximas: 0,
    porEstado: {},
  })
  const [reportFilters, setReportFilters] = useState({
    desde: '',
    hasta: '',
    estado: '',
    lugarId: '',
    espacioId: '',
  })
  const [reportSections, setReportSections] = useState({
    lugares: true,
    espacios: true,
    detalles: true,
    estados: true,
  })
  const [spaceUsageSlide, setSpaceUsageSlide] = useState(0)
  const [autoRotateCharts, setAutoRotateCharts] = useState(true)
  const [showDemoControls, setShowDemoControls] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('reservas_dark_mode') === 'true')
  const [selectedSpace, setSelectedSpace] = useState(null)
  const [form, setForm] = useState({
    fecha: '',
    fechaFin: '',
    horaInicio: '',
    horaFin: '',
    cantidadPersonas: 1,
  })
  const [message, setMessage] = useState('')
  const [showSummary, setShowSummary] = useState(false)
  const [editingSummaryRate, setEditingSummaryRate] = useState(false)
  const [checkingReservation, setCheckingReservation] = useState(false)
  const [reservationAvailability, setReservationAvailability] = useState(null)
  const [hourlyRate, setHourlyRate] = useState(25000)
  const [rateForm, setRateForm] = useState('25000')
  const [savingRate, setSavingRate] = useState(false)

  const modalOpen = Boolean(showSummary || editingSpace || showPlaceEditor || deleteTarget || editingReservation)

  useEffect(() => {
    if (!modalOpen) return
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement
    document.body.style.overflow = 'hidden'
    const modal = document.querySelector('.custom-modal-overlay .custom-modal')
    const focusable = modal ? Array.from(modal.querySelectorAll('button, input, select, textarea, [href]')).filter((element) => !element.disabled) : []
    focusable[0]?.focus()
    const keepFocusInside = (event) => {
      if (event.key === 'Escape') {
        setShowSummary(false)
        setEditingSummaryRate(false)
        setEditingSpace(null)
        setShowPlaceEditor(false)
        setDeleteTarget(null)
        setEditingReservation(null)
        return
      }
      if (event.key !== 'Tab') return
      const currentFocusable = modal ? Array.from(modal.querySelectorAll('button, input, select, textarea, [href]')).filter((element) => !element.disabled) : []
      if (!currentFocusable.length) return
      const first = currentFocusable[0]
      const last = currentFocusable[currentFocusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', keepFocusInside)
    return () => {
      document.removeEventListener('keydown', keepFocusInside)
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [modalOpen])

  const auth = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token])
  const navigate = (next, origin) => {
    if (next === 'login') setReturnPage(origin && origin !== 'login' ? origin : 'home')
    setPage(next)
    setMessage('')
    const path = ROUTES[next] || ROUTES.home
    if (window.location.pathname !== path) window.history.pushState({}, '', path)
  }

  useEffect(() => {
    const handlePopState = () => {
      setPage(pageFromLocation())
      setMessage('')
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!INITIAL_RESET_TOKEN) return
    window.history.replaceState({}, document.title, window.location.pathname)
  }, [])

  useEffect(() => {
    if (!token) return
    fetch(`${API}/usuarios/me`, { headers: auth })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setUser)
      .catch(() => {
        localStorage.removeItem('reservas_token')
        setToken(null)
      })
  }, [token, auth])

  useEffect(() => {
    document.documentElement.classList.toggle('dark-theme', darkMode)
    localStorage.setItem('reservas_dark_mode', String(darkMode))
  }, [darkMode])

  useEffect(() => {
    if (page !== 'dashboard' || !autoRotateCharts) return
    const interval = window.setInterval(() => setSpaceUsageSlide((current) => current + 1), 4000)
    return () => window.clearInterval(interval)
  }, [page, autoRotateCharts])

  useEffect(() => {
    fetch(`${API}/configuracion-publica`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        setHourlyRate(Number(data.tarifaHora))
        setRateForm(String(data.tarifaHora))
      })
      .catch(() => setHourlyRate(25000))
    fetch(`${API}/espacios`)
      .then(readJsonArray)
      .then((data) => {
        setSpaces(data)
        setTypes([...new Map(data.map((space) => [space.tipoId, { id: space.tipoId, nombre: space.tipo }])).values()])
      })
      .catch(() => setSpaces([]))
    fetch(`${API}/lugares`)
      .then(readJsonArray)
      .then((data) => {
        setPlaces(data)
        if (data.length) setSelectedPlaceId((current) => current || data[0].id)
      })
      .catch(() => setPlaces([]))
  }, [])

  useEffect(() => {
    if (!token) return
    fetch(`${API}/reservas/mias`, { headers: auth })
      .then(readJsonArray)
      .then(setReservations)
      .catch(() => setReservations([]))
    fetch(`${API}/pagos/mios`, { headers: auth })
      .then(readJsonArray)
      .then(setPayments)
      .catch(() => setPayments([]))
    fetch(`${API}/notificaciones`, { headers: auth })
      .then(readJsonArray)
      .then(setNotifications)
      .catch(() => setNotifications([]))
  }, [token, page, auth])

  useEffect(() => {
    if (!user || !['ADMIN', 'SUPERADMIN'].includes(user.rol)) return
    Promise.all([fetch(`${API}/admin/catalogo/tipos`, { headers: auth }).then(readJsonArray), fetch(`${API}/admin/catalogo/categorias`, { headers: auth }).then(readJsonArray), fetch(`${API}/admin/catalogo/espacios`, { headers: auth }).then(readJsonArray), fetch(`${API}/admin/catalogo/lugares`, { headers: auth }).then(readJsonArray)])
      .then(([typeData, categoryData, spaceData, placeData]) => {
        setTypes(typeData)
        setCategories(categoryData)
        setSpaces(spaceData)
        setPlaces(placeData)
        if (placeData.length) setSelectedPlaceId((current) => current || placeData[0].id)
      })
      .catch((error) => setMessage(error.message || 'No se pudo cargar el catálogo administrativo'))
  }, [user, token, auth])

  useEffect(() => {
    if (!['admin', 'dashboard'].includes(page) || !user || !['ADMIN', 'SUPERADMIN'].includes(user.rol)) return
    Promise.all([fetch(`${API}/admin/usuarios`, { headers: auth }).then(readJsonArray), fetch(`${API}/admin/reservas`, { headers: auth }).then(readJsonArray), fetch(`${API}/admin/pagos`, { headers: auth }).then(readJsonArray), fetch(`${API}/admin/reportes/resumen`, { headers: auth }).then(readJson), fetch(`${API}/admin/auditoria?limite=100`, { headers: auth }).then(readJsonArray)])
      .then(([usersData, reservationsData, paymentsData, summaryData, auditData]) => {
        setAdminUsers(usersData)
        setAdminReservations(reservationsData)
        setAdminPayments(paymentsData)
        setReportSummary(summaryData)
        setAuditEntries(auditData)
      })
      .catch((error) => setMessage(error.message || 'No se pudo cargar la administración'))
  }, [page, user, token, auth])

  useEffect(() => {
    if (page !== 'admin' || adminTab !== 'auditoria' || !user || !['ADMIN', 'SUPERADMIN'].includes(user.rol)) return
    fetch(`${API}/admin/auditoria?limite=100`, { headers: auth })
      .then(readJsonArray)
      .then(setAuditEntries)
      .catch(() => setMessage('No se pudo actualizar la bitácora'))
  }, [page, adminTab, user, auth])

  useEffect(() => {
    if (page !== 'admin' || adminTab !== 'reportes' || !user || !['ADMIN', 'SUPERADMIN'].includes(user.rol)) return
    if (reportFilters.desde && reportFilters.hasta && reportFilters.desde > reportFilters.hasta) return
    const controller = new AbortController()
    const params = new URLSearchParams()
    Object.entries(reportFilters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    const timer = window.setTimeout(() => {
      fetch(`${API}/admin/reportes/resumen?${params}`, { headers: auth, signal: controller.signal })
        .then(readJson)
        .then((summary) => {
          setReportSummary(summary)
          setMessage('')
        })
        .catch((error) => {
          if (error.name !== 'AbortError') setMessage(error.message || 'No se pudieron actualizar las estadísticas')
        })
    }, 250)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [page, adminTab, user, auth, reportFilters])

  const hours = useMemo(() => {
    if (!form.horaInicio || !form.horaFin) return 0
    const [sh, sm] = form.horaInicio.split(':').map(Number)
    const [eh, em] = form.horaFin.split(':').map(Number)
    return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60)
  }, [form.horaInicio, form.horaFin])

  const visibleSpaces = useMemo(() => (selectedPlaceId === 'sin-lugar' ? spaces.filter((space) => !space.lugarId) : spaces.filter((space) => String(space.lugarId) === String(selectedPlaceId))).filter((space) => availableSpaceIds === null || availableSpaceIds.includes(space.id)), [spaces, selectedPlaceId, availableSpaceIds])

  async function login(event) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    const response = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) return setMessage('Correo o contraseña incorrectos')
    const result = await response.json()
    localStorage.setItem('reservas_token', result.token)
    setToken(result.token)
    setUser(result.usuario)
    navigate(returnPage === 'home' ? 'dashboard' : returnPage)
  }

  async function register(event) {
    event.preventDefault()
    setMessage('')
    const data = Object.fromEntries(new FormData(event.currentTarget))
    if (data.password !== data.confirmacion) return setMessage('Las contraseñas no coinciden')
    if (!isStrongPassword(data.password)) return setMessage(PASSWORD_MESSAGE)
    const response = await fetch(`${API}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: data.nombre,
        correo: data.correo,
        password: data.password,
      }),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status}`)
    setAuthMode('login')
    setMessage('Registro exitoso. Ya puedes iniciar sesión.')
  }

  async function requestRecovery(event) {
    event.preventDefault()
    setMessage('')
    const data = Object.fromEntries(new FormData(event.currentTarget))
    const response = await fetch(`${API}/auth/recuperacion/solicitar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status}`)
    if (body.tokenDesarrollo) {
      setRecoveryToken(body.tokenDesarrollo)
      setAuthMode('reset')
      setMessage('Solicitud de prueba generada. Confirma tu nueva contraseña.')
      return
    }
    // Con SMTP activo el enlace llega al correo y abre esta misma pantalla con el token incluido.
    setRecoveryToken('')
    setAuthMode('login')
    setMessage(body.mensaje || 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.')
  }

  async function confirmRecovery(event) {
    event.preventDefault()
    setMessage('')
    const data = Object.fromEntries(new FormData(event.currentTarget))
    if (data.passwordNuevo !== data.confirmacion) return setMessage('Las contraseñas no coinciden')
    if (!isStrongPassword(data.passwordNuevo)) return setMessage(PASSWORD_MESSAGE)
    const response = await fetch(`${API}/auth/recuperacion/confirmar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: data.token,
        passwordNuevo: data.passwordNuevo,
      }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      return setMessage(body.detail || body.message || `Error ${response.status}`)
    }
    setAuthMode('login')
    setRecoveryToken('')
    setMessage('Contraseña restablecida. Ya puedes iniciar sesión.')
  }

  async function reviewReservation(event) {
    event.preventDefault()
    setMessage('')
    if (!selectedSpace) return setMessage('Selecciona un espacio')
    if (!form.fecha || !form.fechaFin) return setMessage('Selecciona la fecha de inicio y la fecha final')
    if (form.fechaFin < form.fecha) return setMessage('La fecha final no puede ser anterior a la fecha inicial')
    if (form.horaInicio < '08:00' || form.horaFin > '17:00') return setMessage('El horario permitido es de 08:00 a 17:00')
    if (hours <= 0) return setMessage('La hora final debe ser posterior a la inicial')
    setCheckingReservation(true)
    setReservationAvailability(null)
    const fechas = reservationDates(form.fecha, form.fechaFin)
    try {
      const resultados = await Promise.all(
        fechas.map(async (fecha) => {
          const params = new URLSearchParams({
            fecha,
            horaInicio: form.horaInicio,
            horaFin: form.horaFin,
            personas: form.cantidadPersonas,
            lugarId: selectedSpace.lugarId,
          })
          const response = await fetch(`${API}/reservas/disponibilidad?${params}`)
          return {
            fecha,
            response,
            available: await response.json().catch(() => []),
          }
        }),
      )
      const error = resultados.find((result) => !result.response.ok)
      if (error) return setMessage(error.available.detail || error.available.message || 'No se pudo comprobar la disponibilidad')
      const unavailable = resultados.find((result) => !result.available.some((space) => space.id === selectedSpace.id))
      if (unavailable) {
        setReservationAvailability('unavailable')
        return setMessage(`El espacio no está disponible el ${unavailable.fecha}. Elige otro rango u horario.`)
      }
      setReservationAvailability('available')
      setShowSummary(true)
    } catch {
      setMessage('No se pudo comprobar la disponibilidad')
    } finally {
      setCheckingReservation(false)
    }
  }

  async function confirmReservation() {
    const response = await fetch(`${API}/reservas/rango`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fechaInicio: form.fecha,
        fechaFin: form.fechaFin,
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
        cantidadPersonas: Number(form.cantidadPersonas),
        espacioId: selectedSpace.id,
      }),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) {
      setShowSummary(false)
      return setMessage(body.detail || body.message || `Error ${response.status}`)
    }
    const created = Array.isArray(body) ? body : []
    setReservations((current) => [...created.slice().reverse(), ...current])
    setPaymentReservationId(String(created[0]?.id || ''))
    setPaymentResult(null)
    setShowSummary(false)
    navigate('payments')
    setMessage(`${created.length} reserva(s) diaria(s) creadas. Selecciona cómo deseas completar el pago de demostración.`)
  }

  async function submitPayment(event) {
    event.preventDefault()
    setMessage('')
    setPaymentResult(null)
    if (!paymentReservationId) return setMessage('Selecciona una reserva pendiente de pago')
    setPaying(true)
    const response = await fetch(`${API}/pagos/mock`, {
      method: 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reservaId: Number(paymentReservationId),
        metodo: paymentMethod,
      }),
    })
    const body = await response.json().catch(() => ({}))
    setPaying(false)
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status} al registrar el pago`)
    setPaymentResult(body)
    setPayments((current) => (current.some((payment) => payment.id === body.id) ? current.map((payment) => (payment.id === body.id ? body : payment)) : [body, ...current]))
    setReservations((current) => current.map((r) => (r.id === body.reservaId && body.estado === 'APROBADO' ? { ...r, estado: 'CONFIRMADA' } : r)))
    setPaymentReservationId('')
    setPaymentStep(3)
    setMessage(body.estado === 'APROBADO' ? 'Pago simulado aprobado. La reserva quedó confirmada.' : 'Método registrado. El pago quedó pendiente de verificación.')
  }

  function openSpaceEditor(space) {
    setEditingSpace({
      ...space,
      tipoId: String(space.tipoId),
      categoriaId: String(space.categoriaId),
      lugarId: space.lugarId ? String(space.lugarId) : '',
    })
    setSpaceImage(null)
    setSpaceImagePreview(space.imagenUrl ? `${BACKEND}${space.imagenUrl}` : '')
    setMessage('')
  }

  function openSpaceCreator() {
    setEditingSpace({
      id: null,
      nombre: '',
      descripcion: '',
      capacidad: 1,
      imagenUrl: null,
      tipoId: types[0] ? String(types[0].id) : '',
      categoriaId: categories[0] ? String(categories[0].id) : '',
      lugarId: selectedPlaceId && selectedPlaceId !== 'sin-lugar' ? String(selectedPlaceId) : '',
      estado: 'DISPONIBLE',
    })
    setSpaceImage(null)
    setSpaceImagePreview('')
    setMessage('')
  }

  async function saveRate(event) {
    event.preventDefault()
    const tarifaHora = Number(rateForm)
    if (!Number.isFinite(tarifaHora) || tarifaHora <= 0) {
      setMessage('La tarifa debe ser mayor que cero.')
      return
    }
    setSavingRate(true)
    setMessage('')
    const response = await fetch(`${API}/admin/configuracion/tarifa-hora`, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tarifaHora }),
    })
    const body = await response.json().catch(() => ({}))
    setSavingRate(false)
    if (!response.ok) {
      return setMessage(body.detail || body.message || `Error ${response.status} al actualizar la tarifa`)
    }
    setHourlyRate(Number(body.tarifaHora))
    setRateForm(String(body.tarifaHora))
    setEditingSummaryRate(false)
    setMessage('Tarifa por hora actualizada correctamente')
  }

  async function saveSpace(event) {
    event.preventDefault()
    setSavingSpace(true)
    setMessage('')
    const payload = {
      nombre: editingSpace.nombre,
      descripcion: editingSpace.descripcion || '',
      capacidad: Number(editingSpace.capacidad),
      tipoId: Number(editingSpace.tipoId),
      categoriaId: Number(editingSpace.categoriaId),
      lugarId: editingSpace.lugarId ? Number(editingSpace.lugarId) : null,
      estado: editingSpace.estado,
    }
    const creating = !editingSpace.id
    let response = await fetch(creating ? `${API}/admin/catalogo/espacios` : `${API}/admin/catalogo/espacios/${editingSpace.id}`, {
      method: creating ? 'POST' : 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    let updated = await response.json().catch(() => ({}))
    if (response.ok && spaceImage) {
      const imageData = new FormData()
      imageData.append('imagen', spaceImage)
      response = await fetch(`${API}/admin/catalogo/espacios/${updated.id}/imagen`, { method: 'POST', headers: auth, body: imageData })
      updated = await response.json().catch(() => ({}))
    }
    setSavingSpace(false)
    if (!response.ok) return setMessage(updated.detail || updated.message || `Error ${response.status} al guardar el espacio`)
    setSpaces((current) => (creating ? [...current, updated] : current.map((space) => (space.id === updated.id ? updated : space))))
    setSelectedSpace((current) => (current?.id === updated.id ? updated : current))
    setSelectedPlaceId(updated.lugarId)
    setEditingSpace(null)
    setSpaceImage(null)
    setSpaceImagePreview('')
    setMessage(creating ? 'Espacio creado correctamente' : 'Espacio actualizado correctamente')
  }

  async function savePlace(event) {
    event.preventDefault()
    setSavingSpace(true)
    setMessage('')
    const creating = !editingPlaceId
    let response = await fetch(editingPlaceId ? `${API}/admin/catalogo/lugares/${editingPlaceId}` : `${API}/admin/catalogo/lugares`, {
      method: editingPlaceId ? 'PUT' : 'POST',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(placeForm),
    })
    let body = await response.json().catch(() => ({}))
    if (response.ok && placeImage) {
      const imageData = new FormData()
      imageData.append('imagen', placeImage)
      response = await fetch(`${API}/admin/catalogo/lugares/${body.id}/imagen`, { method: 'POST', headers: auth, body: imageData })
      body = await response.json().catch(() => ({}))
    }
    setSavingSpace(false)
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status} al guardar el lugar`)
    setPlaces((current) => (creating ? [...current, body] : current.map((place) => (place.id === body.id ? body : place))))
    setSelectedPlaceId(body.id)
    setShowPlaceEditor(false)
    setEditingPlaceId(null)
    setPlaceImage(null)
    setPlaceImagePreview('')
    setPlaceForm({
      nombre: '',
      descripcion: '',
      direccion: '',
      estado: 'ACTIVO',
    })
    setMessage(creating ? 'Lugar creado. Ahora puedes asignarle espacios.' : 'Lugar actualizado correctamente')
  }

  function openPlaceCreator() {
    setEditingPlaceId(null)
    setPlaceForm({
      nombre: '',
      descripcion: '',
      direccion: '',
      estado: 'ACTIVO',
    })
    setPlaceImage(null)
    setPlaceImagePreview('')
    setMessage('')
    setShowPlaceEditor(true)
  }

  function openPlaceEditor(place) {
    setEditingPlaceId(place.id)
    setPlaceForm({
      nombre: place.nombre,
      descripcion: place.descripcion || '',
      direccion: place.direccion || '',
      estado: place.estado,
    })
    setPlaceImage(null)
    setPlaceImagePreview(place.imagenUrl ? `${BACKEND}${place.imagenUrl}` : '')
    setMessage('')
    setShowPlaceEditor(true)
  }

  function deleteSpace(space) {
    setDeleteTarget({ type: 'space', item: space })
  }

  function deletePlace(place) {
    setDeleteTarget({ type: 'place', item: place })
  }

  async function confirmCatalogDeletion() {
    const { type, item } = deleteTarget
    const response = await fetch(`${API}/admin/catalogo/${type === 'place' ? 'lugares' : 'espacios'}/${item.id}`, { method: 'DELETE', headers: auth })
    setDeleteTarget(null)
    if (!response.ok) return setMessage(`No se pudo desactivar ${type === 'place' ? 'el lugar' : 'el espacio'} (error ${response.status})`)
    if (type === 'place') setPlaces((current) => current.map((value) => (value.id === item.id ? { ...value, estado: 'INACTIVO' } : value)))
    else setSpaces((current) => current.map((value) => (value.id === item.id ? { ...value, estado: 'INACTIVO' } : value)))
    setMessage(`${type === 'place' ? 'Lugar' : 'Espacio'} desactivado correctamente`)
  }

  function openReservationEditor(reservation) {
    setEditingReservation({
      ...reservation,
      espacioId: String(reservation.espacioId),
      cantidadPersonas: reservation.cantidadPersonas,
    })
    setMessage('')
  }

  async function saveReservation(event) {
    event.preventDefault()
    setSavingReservation(true)
    setMessage('')
    const payload = {
      fecha: editingReservation.fecha,
      horaInicio: editingReservation.horaInicio,
      horaFin: editingReservation.horaFin,
      cantidadPersonas: Number(editingReservation.cantidadPersonas),
      espacioId: Number(editingReservation.espacioId),
    }
    const response = await fetch(`${API}/reservas/${editingReservation.id}`, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const body = await response.json().catch(() => ({}))
    setSavingReservation(false)
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status} al modificar la reserva`)
    setReservations((current) => current.map((item) => (item.id === body.id ? body : item)))
    setEditingReservation(null)
    setMessage('Reserva modificada y enviada nuevamente a revisión')
  }

  async function cancelReservation(reservation) {
    if (!window.confirm(`¿Cancelar la reserva #${reservation.id} de ${reservation.espacio}?`)) return
    const response = await fetch(`${API}/reservas/${reservation.id}/cancelar`, {
      method: 'PATCH',
      headers: auth,
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status} al cancelar la reserva`)
    setReservations((current) => current.map((item) => (item.id === body.id ? body : item)))
    setMessage('Reserva cancelada. El horario quedó disponible nuevamente.')
  }

  async function checkAvailability(event) {
    event.preventDefault()
    setMessage('')
    const params = new URLSearchParams({
      fecha: availabilityForm.fecha,
      horaInicio: availabilityForm.horaInicio,
      horaFin: availabilityForm.horaFin,
      personas: availabilityForm.cantidadPersonas,
      lugarId: selectedPlaceId,
    })
    if (availabilityTypeId) params.set('tipoId', availabilityTypeId)
    const response = await fetch(`${API}/reservas/disponibilidad?${params}`)
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status} al consultar disponibilidad`)
    setAvailableSpaceIds(body.map((space) => space.id))
    setMessage(`${body.length} espacio(s) disponible(s) para el horario indicado`)
  }

  async function reviewAdminReservation(reservation, action) {
    const response = await fetch(`${API}/admin/reservas/${reservation.id}/${action}`, { method: 'PATCH', headers: auth })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status}`)
    setAdminReservations((current) => current.map((item) => (item.id === body.id ? body : item)))
    setMessage(`Reserva ${action === 'aprobar' ? 'aprobada' : 'rechazada'}`)
  }

  async function reviewAdminPayment(payment, action) {
    const response = await fetch(`${API}/admin/pagos/${payment.id}/${action}`, {
      method: 'PATCH',
      headers: auth,
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status}`)
    setAdminPayments((current) => current.map((item) => (item.id === body.id ? body : item)))
    setMessage(`Pago ${action === 'aprobar' ? 'aprobado' : 'rechazado'}`)
  }

  async function updateAdminUser(target, changes) {
    const response = await fetch(`${API}/admin/usuarios/${target.id}`, {
      method: 'PATCH',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        estado: changes.estado || target.estado,
        rol: changes.rol || target.rol,
      }),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status}`)
    setAdminUsers((current) => current.map((item) => (item.id === body.id ? body : item)))
    setMessage('Usuario actualizado correctamente')
  }

  async function deleteAdminUser(target) {
    if (target.id === user?.id) return setMessage('No puedes eliminar tu propia cuenta')
    if (!window.confirm(`¿Eliminar permanentemente la cuenta de ${target.nombre}? Esta acción no se puede deshacer.`)) return
    const response = await fetch(`${API}/admin/usuarios/${target.id}`, { method: 'DELETE', headers: auth })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `No se pudo eliminar la cuenta (error ${response.status})`)
    setAdminUsers((current) => current.filter((item) => item.id !== target.id))
    setMessage('Cuenta eliminada permanentemente')
  }

  async function updateProfile(event) {
    event.preventDefault()
    setMessage('')
    const data = Object.fromEntries(new FormData(event.currentTarget))
    const correoAnterior = user.correo
    const response = await fetch(`${API}/usuarios/me`, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) return setMessage(body.detail || body.message || `Error ${response.status}`)
    setUser(body)
    if (body.correo !== correoAnterior) {
      setMessage('Perfil actualizado. Inicia sesión nuevamente con tu nuevo correo.')
      setTimeout(logout, 1800)
    } else setMessage('Perfil actualizado correctamente')
  }

  async function readNotification(notification) {
    if (notification.leida) return
    const response = await fetch(`${API}/notificaciones/${notification.id}/leer`, { method: 'PATCH', headers: auth })
    if (!response.ok) return
    const body = await response.json()
    setNotifications((current) => current.map((item) => (item.id === body.id ? body : item)))
  }

  async function downloadReservationsReport(event, format = 'csv') {
    event?.preventDefault()
    setMessage('')
    if (reportFilters.desde && reportFilters.hasta && reportFilters.desde > reportFilters.hasta) return setMessage('La fecha inicial no puede ser posterior a la fecha final')
    const isMobileDownload = /Android|iPad|iPhone|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    // Safari y Chrome móvil pueden bloquear una descarga iniciada después del fetch.
    // Reservamos la pestaña durante el toque y conservamos abierta la pantalla de reportes.
    const mobileDownloadTab = isMobileDownload ? window.open('about:blank', '_blank') : null
    if (mobileDownloadTab) {
      mobileDownloadTab.document.title = 'Generando reporte…'
      mobileDownloadTab.document.body.textContent = 'Generando reporte…'
    }
    const params = new URLSearchParams()
    Object.entries(reportFilters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    params.set(
      'secciones',
      Object.entries(reportSections)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key)
        .join(','),
    )
    const response = await fetch(`${API}/admin/reportes/reservas.${format}?${params}`, { headers: auth })
    if (!response.ok) {
      mobileDownloadTab?.close()
      const body = await response.json().catch(() => ({}))
      const detail = body.detail || body.message
      return setMessage(detail && !/bad request/i.test(detail) ? detail : response.status === 400 ? 'Revisa las fechas y los filtros del reporte antes de descargarlo.' : `No se pudo generar el reporte (error ${response.status})`)
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    if (mobileDownloadTab) {
      mobileDownloadTab.location.replace(url)
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
      setMessage(`Reporte ${format.toUpperCase()} generado correctamente. Se abrió en otra pestaña.`)
      return
    }
    const link = document.createElement('a')
    link.href = url
    link.download = `reservas-${new Date().toISOString().slice(0, 10)}.${format}`
    if (isMobileDownload) link.target = '_blank'
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setMessage(`Reporte ${format.toUpperCase()} generado correctamente`)
  }

  async function downloadReceipt(payment) {
    const response = await fetch(`${API}/pagos/${payment.id}/comprobante`, {
      headers: auth,
    })
    if (!response.ok) return setMessage(`No se pudo generar el comprobante (error ${response.status})`)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `comprobante-${payment.referencia}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function changePassword(event) {
    event.preventDefault()
    setMessage('')
    const formElement = event.currentTarget
    const data = Object.fromEntries(new FormData(formElement))
    if (data.passwordNuevo !== data.confirmacion) return setMessage('La confirmación de la contraseña no coincide')
    if (!isStrongPassword(data.passwordNuevo)) return setMessage(PASSWORD_MESSAGE)
    const response = await fetch(`${API}/usuarios/me/password`, {
      method: 'PATCH',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        passwordActual: data.passwordActual,
        passwordNuevo: data.passwordNuevo,
      }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      return setMessage(body.detail || body.message || `Error ${response.status}`)
    }
    formElement.reset()
    localStorage.removeItem('reservas_token')
    setToken(null)
    setUser(null)
    setReservations([])
    setPayments([])
    setAuthMode('login')
    navigate('login')
    setMessage('Contraseña restablecida. Inicia sesión nuevamente con tu nueva contraseña.')
  }

  function renderDashboard() {
    return ['ADMIN', 'SUPERADMIN'].includes(user?.rol)
      ? renderAdminDashboard()
      : <ClientDashboard user={user} reservations={reservations} payments={payments} notifications={notifications} showDemoControls={showDemoControls} onNavigate={navigate} />
  }

  function renderAdminDashboard() {
    const pendingReservations = adminReservations.filter((item) => item.estado === 'PENDIENTE').length
    const pendingPayments = adminPayments.filter((item) => item.estado === 'PENDIENTE_VERIFICACION').length
    const activeUsers = adminUsers.filter((item) => item.estado === 'ACTIVO').length
    if (!showDemoControls) {
      return (
        <main className="page-container role-dashboard admin-dashboard">
          <div className="dashboard-welcome">
            <div><p className="eyebrow">Panel administrativo · {user?.rol}</p><h1>Gestión institucional</h1><p>Administra usuarios, roles, lugares y espacios desde los módulos disponibles.</p></div>
            <button className="primary-button" onClick={() => { setAdminTab('usuarios'); navigate('admin') }}>Gestionar usuarios</button>
          </div>
          <section className="dashboard-metrics">
            <button onClick={() => { setAdminTab('usuarios'); navigate('admin') }}><span className="metric-icon violet">◎</span><div><small>Usuarios activos</small><strong>{activeUsers}</strong><em>{adminUsers.length} cuentas registradas</em></div></button>
            <button onClick={() => navigate('spaces')}><span className="metric-icon indigo">⌂</span><div><small>Espacios registrados</small><strong>{spaces.length}</strong><em>{places.length} lugares</em></div></button>
          </section>
        </main>
      )
    }
    const total = Math.max(reportSummary.total || 0, 1)
    const confirmed = reportSummary.porEstado?.CONFIRMADA || 0
    const approved = reportSummary.porEstado?.APROBADA || 0
    const pending = reportSummary.porEstado?.PENDIENTE || 0
    const spaceUsage = Object.entries(reportSummary.porEspacio || {}).slice(0, 4)
    const spaceUsageTotal = Math.max(
      spaceUsage.reduce((sum, [, count]) => sum + count, 0),
      1,
    )
    const confirmedEnd = (confirmed / total) * 100
    const approvedEnd = confirmedEnd + (approved / total) * 100
    const pendingEnd = approvedEnd + (pending / total) * 100
    const spaceChartStyle = {
      background: spaceUsage.length
        ? `conic-gradient(${spaceUsage
            .map(([, count], index) => {
              const start = (spaceUsage.slice(0, index).reduce((sum, [, value]) => sum + value, 0) / spaceUsageTotal) * 100
              const end = start + (count / spaceUsageTotal) * 100
              return `${['#2c1261', '#00b0c6', '#ed1a39', '#c1c5d3'][index]} ${start}% ${end}%`
            })
            .join(', ')})`
        : `conic-gradient(#c1c5d3 0 100%)`,
    }
    const statusChartStyle = {
      background: `conic-gradient(#00b0c6 0 ${confirmedEnd}%, #2c1261 ${confirmedEnd}% ${approvedEnd}%, #ed1a39 ${approvedEnd}% ${pendingEnd}%, #c1c5d3 ${pendingEnd}% 100%)`,
    }
    const carouselView = spaceUsageSlide % 2
    const occupancyAlerts = (reportSummary.espaciosUso || [])
      .filter((space) => space.nivelUso === 'ALTO' || space.nivelUso === 'BAJO')
      .slice(0, 3)
    return (
      <main className="page-container role-dashboard admin-dashboard">
        <div className="dashboard-welcome">
          <div>
            <p className="eyebrow">Panel administrativo · {user?.rol}</p>
            <h1>Resumen institucional</h1>
            <p>Hola, {user?.nombre}. Supervisa reservas, pagos y capacidad desde un solo lugar.</p>
          </div>
          <button className="primary-button" onClick={() => navigate('admin')}>
            Abrir administración
          </button>
        </div>
        {message && <p className="form-message">{message}</p>}
        <section className="dashboard-metrics">
          <button onClick={() => navigate('admin')}>
            <span className="metric-icon indigo">▤</span>
            <div>
              <small>Reservas totales</small>
              <strong>{reportSummary.total || 0}</strong>
              <em>{reportSummary.proximas || 0} próximas</em>
            </div>
          </button>
          <button
            onClick={() => {
              setAdminTab('reservas')
              navigate('admin')
            }}
          >
            <span className="metric-icon amber">!</span>
            <div>
              <small>Por revisar</small>
              <strong>{pendingReservations}</strong>
              <em>Solicitudes pendientes</em>
            </div>
          </button>
          <button
            onClick={() => {
              setAdminTab('pagos')
              navigate('admin')
            }}
          >
            <span className="metric-icon green">₡</span>
            <div>
              <small>Pagos pendientes</small>
              <strong>{pendingPayments}</strong>
              <em>Requieren validación</em>
            </div>
          </button>
          <button
            onClick={() => {
              setAdminTab('usuarios')
              navigate('admin')
            }}
          >
            <span className="metric-icon violet">◎</span>
            <div>
              <small>Usuarios activos</small>
              <strong>{activeUsers}</strong>
              <em>{adminUsers.length} cuentas registradas</em>
            </div>
          </button>
        </section>
        <section className="dashboard-panel report-section-selector">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Exportación personalizada</p>
              <h2>Secciones del reporte</h2>
            </div>
          </div>
          <div className="report-section-buttons">
            {[
              ['lugares', 'Lugares'],
              ['espacios', 'Espacios'],
              ['detalles', 'Detalles de reserva'],
              ['estados', 'Estados'],
            ].map(([key, label]) => (
              <button
                type="button"
                className={reportSections[key] ? 'selected' : ''}
                key={key}
                onClick={() =>
                  setReportSections((current) => ({
                    ...current,
                    [key]: !current[key],
                  }))
                }
              >
                {reportSections[key] ? '✓ ' : ''}
                {label}
              </button>
            ))}
          </div>
          <button
            className="primary-button"
            onClick={() => {
              setAdminTab('reportes')
              navigate('admin')
            }}
          >
            Abrir reportes y exportar
          </button>
        </section>
        <div className="dashboard-grid">
          <section className="dashboard-panel status-overview space-usage-carousel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">{carouselView === 0 ? 'Estado general' : 'Uso de espacios'}</p>
                <h2>{carouselView === 0 ? 'Distribución de reservas' : 'Espacios más utilizados'}</h2>
              </div>
              <div className="chart-heading-actions">
                <button className="chart-rotate-toggle" onClick={() => setAutoRotateCharts((current) => !current)}>
                  {autoRotateCharts ? 'Pausar' : 'Reanudar'}
                </button>
                <button
                  onClick={() => {
                    setAdminTab('reportes')
                    navigate('admin')
                  }}
                >
                  Ver reportes →
                </button>
              </div>
            </div>
            <div className="donut-layout" key={carouselView}>
              <div className="donut-chart" style={carouselView === 0 ? statusChartStyle : spaceChartStyle}>
                <div>
                  <strong>{carouselView === 0 ? reportSummary.total || 0 : spaceUsage.length ? spaceUsage[0][1] : 0}</strong>
                  <span>{carouselView === 0 ? 'Total' : 'máximo'}</span>
                </div>
              </div>
              <div className="chart-legend usage-carousel-copy" key={carouselView}>
                {carouselView === 0 ? (
                  <>
                    {[
                      ['CONFIRMADA', '#00b0c6'],
                      ['APROBADA', '#2c1261'],
                      ['PENDIENTE', '#ed1a39'],
                      ['OTRAS', '#c1c5d3'],
                    ].map(([label, color]) => (
                      <div key={label}>
                        <i style={{ background: color }} />
                        <span>{label}</span>
                        <strong>{label === 'OTRAS' ? Math.max(0, (reportSummary.total || 0) - confirmed - approved - pending) : reportSummary.porEstado?.[label] || 0}</strong>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {spaceUsage.map(([name, count], index) => (
                      <div key={name}>
                        <i
                          style={{
                            background: ['#2c1261', '#00b0c6', '#ed1a39', '#c1c5d3'][index],
                          }}
                        />
                        <span>{name}</span>
                        <strong>{count}</strong>
                      </div>
                    ))}
                  </>
                )}
                <div className="usage-carousel-dots">
                  <button className={carouselView === 0 ? 'active' : ''} aria-label="Estado general" onClick={() => setSpaceUsageSlide(0)} />
                  <button className={carouselView === 1 ? 'active' : ''} aria-label="Uso de espacios" onClick={() => setSpaceUsageSlide(1)} />
                </div>
              </div>
            </div>
          </section>
          <section className="dashboard-panel quick-management">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Operación</p>
                <h2>Gestión rápida</h2>
              </div>
            </div>
            <div className="quick-action-list">
              <button onClick={() => navigate('spaces')}>
                <span>⌂</span>
                <div>
                  <strong>Catálogo institucional</strong>
                  <small>
                    {places.filter((place) => place.estado === 'ACTIVO').length} lugares · {spaces.length} espacios
                  </small>
                </div>
                <b>→</b>
              </button>
              <button
                onClick={() => {
                  setAdminTab('reservas')
                  navigate('admin')
                }}
              >
                <span>✓</span>
                <div>
                  <strong>Revisar solicitudes</strong>
                  <small>{pendingReservations ? `${pendingReservations} esperando decisión` : 'Todo está al día'}</small>
                </div>
                <b>→</b>
              </button>
              <button
                onClick={() => {
                  setAdminTab('auditoria')
                  navigate('admin')
                }}
              >
                <span>◷</span>
                <div>
                  <strong>Bitácora administrativa</strong>
                  <small>Consulta los últimos cambios sensibles</small>
                </div>
                <b>→</b>
              </button>
            </div>
          </section>
        </div>
        <section className="dashboard-panel recent-activity">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Actividad</p>
              <h2>Reservas recientes</h2>
            </div>
            <button
              onClick={() => {
                setAdminTab('reservas')
                navigate('admin')
              }}
            >
              Ver todas →
            </button>
          </div>
          {adminReservations.length === 0 ? (
            <div className="dashboard-empty">Aún no hay reservas registradas.</div>
          ) : (
            <div className="recent-list">
              {adminReservations.slice(0, 5).map((item) => (
                <article key={item.id}>
                  <span className={`status-dot ${item.estado.toLowerCase()}`} />
                  <div>
                    <strong>{item.espacio}</strong>
                    <small>
                      #{item.id} · {item.correoUsuario}
                    </small>
                  </div>
                  <time>
                    {item.fecha}
                    <small>
                      {item.horaInicio} - {item.horaFin}
                    </small>
                  </time>
                  <b className={`reservation-status ${item.estado.toLowerCase()}`}>{item.estado}</b>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="dashboard-panel decision-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Decisiones basadas en datos</p>
              <h2>Uso semanal por espacio</h2>
            </div>
            <button
              onClick={() => {
                setAdminTab('reportes')
                navigate('admin')
              }}
            >
              Ver análisis →
            </button>
          </div>
          <div className="decision-list">
            {Object.entries(reportSummary.porEspacioSemana || {})
              .slice(0, 4)
              .map(([name, count]) => (
                <div key={name}>
                  <span>{name}</span>
                  <div>
                    <i
                      style={{
                        width: `${(count / Math.max(...Object.values(reportSummary.porEspacioSemana || { total: 1 }))) * 100}%`,
                      }}
                    />
                  </div>
                  <strong>{count} reservas</strong>
                </div>
              ))}
            {!Object.keys(reportSummary.porEspacioSemana || {}).length && <p>Aún no hay reservas en los últimos 7 días.</p>}
          </div>
        </section>
        <section className="dashboard-panel occupancy-alerts">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Seguimiento de capacidad</p>
              <h2>Alertas de ocupación</h2>
            </div>
            <button
              onClick={() => {
                setAdminTab('reportes')
                navigate('admin')
              }}
            >
              Ver análisis →
            </button>
          </div>
          {occupancyAlerts.length ? (
            <div className="occupancy-alert-list">
              {occupancyAlerts.map((space) => (
                <article className={space.nivelUso.toLowerCase()} key={space.id}>
                  <span>{space.nivelUso === 'ALTO' ? '↑' : '↓'}</span>
                  <div>
                    <strong>{space.nombre}</strong>
                    <small>{space.lugar || 'Sin lugar asignado'} · {space.reservas} reservas · {space.horas} h</small>
                    <p>{space.recomendacion || (space.nivelUso === 'ALTO' ? 'Revisa la rotación y el mantenimiento del espacio.' : 'Considera promover este espacio para equilibrar su uso.')}</p>
                  </div>
                  <b>{space.porcentajeOcupacion}%</b>
                </article>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty">Aún no hay datos suficientes para generar alertas de ocupación.</div>
          )}
        </section>
      </main>
    )
  }

  function renderClientDashboard() {
    const activeStates = ['PENDIENTE', 'APROBADA', 'CONFIRMADA']
    const upcoming = reservations.filter((item) => activeStates.includes(item.estado) && new Date(`${item.fecha}T${item.horaInicio}`) >= new Date()).sort((a, b) => `${a.fecha}T${a.horaInicio}`.localeCompare(`${b.fecha}T${b.horaInicio}`))
    const nextReservation = upcoming[0]
    const pendingCount = reservations.filter((item) => item.estado === 'PENDIENTE').length
    const confirmedCount = reservations.filter((item) => item.estado === 'CONFIRMADA').length
    const approvedPayments = payments.filter((item) => item.estado === 'APROBADO')
    const paidTotal = approvedPayments.reduce((sum, item) => sum + Number(item.monto || 0), 0)
    const unread = notifications.filter((item) => !item.leida).length
    return (
      <main className="page-container role-dashboard client-dashboard">
        <div className="dashboard-welcome">
          <div>
            <p className="eyebrow">Mi panel de reservas</p>
            <h1>Hola, {user?.nombre}</h1>
            <p>Organiza tus próximas actividades y consulta el estado de tus solicitudes.</p>
          </div>
          <button className="primary-button" onClick={() => navigate('spaces')}>
            Buscar un espacio
          </button>
        </div>
        <section className="dashboard-metrics client-metrics">
          <button onClick={() => navigate('reservations')}>
            <span className="metric-icon indigo">▤</span>
            <div>
              <small>Próximas reservas</small>
              <strong>{upcoming.length}</strong>
              <em>{pendingCount} pendientes</em>
            </div>
          </button>
          <button onClick={() => navigate('reservations')}>
            <span className="metric-icon green">✓</span>
            <div>
              <small>Confirmadas</small>
              <strong>{confirmedCount}</strong>
              <em>Listas para tu visita</em>
            </div>
          </button>
          <button onClick={() => navigate('payments')}>
            <span className="metric-icon amber">₡</span>
            <div>
              <small>Pagos aprobados</small>
              <strong>{approvedPayments.length}</strong>
              <em>₡{paidTotal.toLocaleString('es-CR')} registrados</em>
            </div>
          </button>
          <button onClick={() => navigate('notifications')}>
            <span className="metric-icon violet">●</span>
            <div>
              <small>Avisos nuevos</small>
              <strong>{unread}</strong>
              <em>{notifications.length} notificaciones</em>
            </div>
          </button>
        </section>
        <div className="dashboard-grid client-grid">
          <section className="dashboard-panel next-booking">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Agenda</p>
                <h2>Tu próxima reserva</h2>
              </div>
              <button onClick={() => navigate('reservations')}>Ver historial →</button>
            </div>
            {nextReservation ? (
              <div className="next-booking-card">
                <div className="calendar-tile">
                  <strong>{new Date(`${nextReservation.fecha}T12:00:00`).toLocaleDateString('es-CR', { day: '2-digit' })}</strong>
                  <span>{new Date(`${nextReservation.fecha}T12:00:00`).toLocaleDateString('es-CR', { month: 'short' }).replace('.', '')}</span>
                </div>
                <div>
                  <h3>{nextReservation.espacio}</h3>
                  <p>
                    {nextReservation.horaInicio} - {nextReservation.horaFin} · {nextReservation.cantidadPersonas} persona(s)
                  </p>
                  <b className={`reservation-status ${nextReservation.estado.toLowerCase()}`}>{nextReservation.estado}</b>
                </div>
              </div>
            ) : (
              <div className="dashboard-empty">
                <strong>No tienes reservas próximas</strong>
                <span>Explora el catálogo y programa tu siguiente actividad.</span>
                <button className="secondary-button" onClick={() => navigate('spaces')}>
                  Explorar espacios
                </button>
              </div>
            )}
          </section>
          <section className="dashboard-panel quick-management">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Accesos</p>
                <h2>¿Qué deseas hacer?</h2>
              </div>
            </div>
            <div className="quick-action-list">
              <button onClick={() => navigate('spaces')}>
                <span>⌕</span>
                <div>
                  <strong>Consultar disponibilidad</strong>
                  <small>Filtra por fecha, hora y capacidad</small>
                </div>
                <b>→</b>
              </button>
              <button onClick={() => navigate('payments')}>
                <span>₡</span>
                <div>
                  <strong>Completar un pago</strong>
                  <small>Revisa reservas pendientes de pago</small>
                </div>
                <b>→</b>
              </button>
              {showDemoControls && (
                <button onClick={() => navigate('profile')}>
                  <span>◎</span>
                  <div>
                    <strong>Actualizar mi perfil</strong>
                    <small>Gestiona tus datos y contraseña</small>
                  </div>
                  <b>→</b>
                </button>
              )}
            </div>
          </section>
        </div>
        <section className="dashboard-panel client-notices">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Novedades</p>
              <h2>Avisos recientes</h2>
            </div>
            <button onClick={() => navigate('notifications')}>Ver todos →</button>
          </div>
          {notifications.length === 0 ? (
            <div className="dashboard-empty">No tienes avisos por el momento.</div>
          ) : (
            <div className="notice-preview">
              {notifications.slice(0, 3).map((item) => (
                <button key={item.id} onClick={() => navigate('notifications')}>
                  <span className={item.leida ? 'read' : 'unread'}>{item.tipo === 'PAGO' ? '₡' : item.tipo === 'RESERVA' ? '⌂' : 'i'}</span>
                  <div>
                    <strong>{item.titulo}</strong>
                    <small>{item.mensaje}</small>
                  </div>
                  <time>{new Date(item.creadaEn).toLocaleDateString('es-CR')}</time>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    )
  }

  // Respaldo temporal mientras se completa la migración del panel cliente.
  void renderClientDashboard

  function renderSpacesPage() {
    const isAdmin = user && ['ADMIN', 'SUPERADMIN'].includes(user.rol)
    const currentPlace = places.find((place) => String(place.id) === String(selectedPlaceId))
    return (
      <main className="page-container">
        <p className="eyebrow">Catálogo institucional</p>
        <div className="catalog-title">
          <div>
            <h1>Lugares y espacios</h1>
            <p>Primero selecciona un lugar para consultar sus espacios reservables.</p>
          </div>
          {isAdmin && (
            <div className="catalog-admin-actions">
              <button className="secondary-button" onClick={openPlaceCreator}>
                + Crear lugar
              </button>
              <button className="primary-button" disabled={!places.some((place) => place.estado === 'ACTIVO')} onClick={openSpaceCreator}>
                + Crear espacio
              </button>
            </div>
          )}
        </div>
        {message && <p className="form-message">{message}</p>}
        <div className="place-selector">
          {places.map((place, index) => (
            <article
              className={`place-card place-tone-${index % 3} ${String(selectedPlaceId) === String(place.id) ? 'selected' : ''} ${place.estado === 'INACTIVO' ? 'inactive' : ''}`}
              style={
                place.imagenUrl
                  ? {
                      backgroundImage: `linear-gradient(0deg,rgba(35,13,75,.88),rgba(35,13,75,.2)),url(${BACKEND}${place.imagenUrl})`,
                    }
                  : undefined
              }
              key={place.id}
            >
              <button
                className="place-select-button"
                onClick={() => {
                  setSelectedPlaceId(place.id)
                  setAvailableSpaceIds(null)
                }}
              >
                <span>⌂</span>
                <strong>{place.nombre}</strong>
                <small>{place.descripcion || place.direccion || 'Lugar institucional'}</small>
                <b>{spaces.filter((space) => space.lugarId === place.id).length} espacios</b>
              </button>
              {isAdmin && (
                <div className="card-admin-actions">
                  <button onClick={() => openPlaceEditor(place)}>Editar</button>
                  {showDemoControls && (
                    <button className="danger" disabled={place.estado === 'INACTIVO'} onClick={() => deletePlace(place)}>
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
          {isAdmin && spaces.some((space) => !space.lugarId) && (
            <article className={`place-card unassigned ${selectedPlaceId === 'sin-lugar' ? 'selected' : ''}`}>
              <button className="place-select-button" onClick={() => setSelectedPlaceId('sin-lugar')}>
                <span>!</span>
                <strong>Sin lugar asignado</strong>
                <small>Espacios que debes organizar</small>
                <b>{spaces.filter((space) => !space.lugarId).length} espacios</b>
              </button>
            </article>
          )}
        </div>
        {places.length === 0 && !(isAdmin && spaces.some((space) => !space.lugarId)) ? (
          <div className="catalog-empty">
            <strong>Aún no hay lugares registrados</strong>
            <span>Un administrador debe crear primero Sede Nacional, Campo Escuela, Hostel u otro lugar.</span>
          </div>
        ) : (
          <section className="place-section">
            <div className="place-heading">
              <div className="place-symbol">⌂</div>
              <div>
                <h2>{selectedPlaceId === 'sin-lugar' ? 'Sin lugar asignado' : currentPlace?.nombre || 'Selecciona un lugar'}</h2>
                <span>{visibleSpaces.length} espacio(s)</span>
              </div>
              {isAdmin && currentPlace && (
                <div className="place-heading-actions">
                  <button onClick={() => openPlaceEditor(currentPlace)}>Editar lugar</button>
                  {showDemoControls && (
                    <button className="danger" disabled={currentPlace.estado === 'INACTIVO'} onClick={() => deletePlace(currentPlace)}>
                      Eliminar lugar
                    </button>
                  )}
                </div>
              )}
            </div>
            {selectedPlaceId !== 'sin-lugar' && (
              <>
                <AvailabilityDateStrip
                  value={availabilityForm.fecha}
                  onChange={(fecha) => {
                    setAvailabilityForm((current) => ({ ...current, fecha }))
                    setAvailableSpaceIds(null)
                  }}
                />
                <form className="availability-bar" onSubmit={checkAvailability}>
                  <label className="availability-date-input">
                    Fecha
                    <input
                      type="date"
                      required
                      value={availabilityForm.fecha}
                      onChange={(e) =>
                        setAvailabilityForm({
                          ...availabilityForm,
                          fecha: e.target.value,
                        })
                      }
                    />
                  </label>
                <label>
                  Desde
                  <input
                    type="time"
                    min="08:00"
                    max="17:00"
                    required
                    value={availabilityForm.horaInicio}
                    onChange={(e) =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        horaInicio: e.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Hasta
                  <input
                    type="time"
                    min="08:00"
                    max="17:00"
                    required
                    value={availabilityForm.horaFin}
                    onChange={(e) =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        horaFin: e.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Tipo
                  <select value={availabilityTypeId} onChange={(e) => setAvailabilityTypeId(e.target.value)}>
                    <option value="">Todos</option>
                    {types.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Personas
                  <input
                    type="number"
                    min="1"
                    required
                    value={availabilityForm.cantidadPersonas}
                    onChange={(e) =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        cantidadPersonas: e.target.value,
                      })
                    }
                  />
                </label>
                <button className="primary-button">Consultar disponibilidad</button>
                {availableSpaceIds !== null && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setAvailableSpaceIds(null)
                      setAvailabilityTypeId('')
                    }}
                  >
                    Limpiar
                  </button>
                )}
                </form>
              </>
            )}
            {visibleSpaces.length === 0 ? (
              <div className="catalog-empty">
                <strong>{availableSpaceIds === null ? 'Este lugar todavía no tiene espacios' : 'No hay espacios disponibles'}</strong>
                <span>{availableSpaceIds === null ? (isAdmin ? 'Usa “Crear espacio” para agregar el primero.' : 'Pronto se agregarán espacios reservables.') : 'Prueba otra fecha, horario o cantidad de personas.'}</span>
              </div>
            ) : (
              <div className="space-list">
                {visibleSpaces.map((space, index) => (
                  <article className={`space-card space-tone-${index % 3} ${space.estado === 'INACTIVO' ? 'inactive' : ''}`} key={space.id}>
                    <div
                      className="space-image"
                      style={
                        space.imagenUrl
                          ? {
                              backgroundImage: `linear-gradient(0deg, rgba(19,24,43,.5), rgba(19,24,43,.08)), url(${BACKEND}${space.imagenUrl})`,
                            }
                          : undefined
                      }
                    >
                      <span>{space.tipo}</span>
                      {space.estado !== 'DISPONIBLE' && <b>{space.estado}</b>}
                    </div>
                    <div className="space-info">
                      <h3>{space.nombre}</h3>
                      <p>{space.descripcion}</p>
                      <small>
                        Capacidad: {space.capacidad} · {space.categoria}
                      </small>
                      <div className="space-actions">
                        <button
                          className="primary-button"
                          disabled={space.estado !== 'DISPONIBLE'}
                          onClick={() => {
                            setSelectedSpace(space)
                            setForm({
                              ...form,
                              ...availabilityForm,
                              fechaFin: '',
                            })
                            user ? navigate('reserve') : navigate('login', 'reserve')
                          }}
                        >
                          {space.estado === 'DISPONIBLE' ? 'Reservar' : 'No disponible'}
                        </button>
                        {isAdmin && (
                          <>
                            <button className="edit-space-button" onClick={() => openSpaceEditor(space)}>
                              Editar
                            </button>
                            {showDemoControls && (
                              <button className="delete-space-button" disabled={space.estado === 'INACTIVO'} onClick={() => deleteSpace(space)}>
                                Eliminar
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    )
  }

  void renderSpacesPage

  function renderReservePage() {
    const reservablePlaces = places.filter((place) => place.estado === 'ACTIVO')
    const selectedReservePlace = reservablePlaces.find((place) => String(place.id) === String(selectedPlaceId))
    const placeSpaces = spaces.filter((space) => String(space.lugarId) === String(selectedPlaceId) && space.estado === 'DISPONIBLE')
    const placeCover = (place) => place.imagenUrl || spaces.find((space) => String(space.lugarId) === String(place.id) && space.imagenUrl)?.imagenUrl
    const selectedDays = reservationDates(form.fecha, form.fechaFin).length
    const reservationFormComplete = Boolean(selectedSpace && form.fecha && form.fechaFin && form.fechaFin >= form.fecha && form.horaInicio && form.horaFin && Number(form.cantidadPersonas) > 0)
    const reservationHint = !selectedSpace ? 'Selecciona un espacio para continuar.' : !form.fecha || !form.fechaFin ? 'Completa la fecha de inicio y la fecha de fin.' : form.fechaFin < form.fecha ? 'La fecha final debe ser igual o posterior a la fecha inicial.' : !form.horaInicio || !form.horaFin ? 'Completa el horario para continuar.' : ''
    return (
      <main className="page-container reserve-page">
        <p className="eyebrow">Nueva reserva</p>
        <h1>Configura tu visita</h1>
        <p>Primero elige el lugar y después el espacio que necesitas. Horario institucional: 08:00 a 17:00.</p>
        <form className="reservation-form polished visual-reservation-form" onSubmit={reviewReservation}>
          {selectedSpace && (
            <CustomReservationSchedule
              form={form}
              setForm={(nextForm) => {
                setForm(nextForm)
                setReservationAvailability(null)
              }}
            />
          )}
          <section className="visual-selector">
            <div className="selector-heading">
              <span>1</span>
              <div>
                <strong>Selecciona el lugar</strong>
                <small>Sede, campo escuela, hostel u otra instalación</small>
              </div>
            </div>
            <div className="reserve-place-grid">
              {reservablePlaces.map((place, index) => {
                const cover = placeCover(place)
                return (
                  <button
                    type="button"
                    className={`reserve-place-card tone-${index % 3} ${String(selectedPlaceId) === String(place.id) ? 'selected' : ''}`}
                    key={place.id}
                    onClick={() => {
                      setSelectedPlaceId(place.id)
                      setSelectedSpace(null)
                      setMessage('')
                    }}
                  >
                    <span
                      className="reserve-card-image"
                      style={
                        cover
                          ? {
                              backgroundImage: `linear-gradient(0deg,rgba(17,23,51,.68),rgba(17,23,51,.08)),url(${BACKEND}${cover})`,
                            }
                          : undefined
                      }
                    />
                    <span className="reserve-card-copy">
                      <strong>{place.nombre}</strong>
                      <small>{spaces.filter((space) => String(space.lugarId) === String(place.id) && space.estado === 'DISPONIBLE').length} espacios disponibles</small>
                    </span>
                    {String(selectedPlaceId) === String(place.id) && <b>✓</b>}
                  </button>
                )
              })}
            </div>
          </section>
          <section className={`visual-selector ${selectedReservePlace ? '' : 'disabled-step'}`}>
            <div className="selector-heading">
              <span>2</span>
              <div>
                <strong>Selecciona el espacio</strong>
                <small>{selectedReservePlace ? `Opciones disponibles en ${selectedReservePlace.nombre}` : 'Primero selecciona un lugar'}</small>
              </div>
            </div>
            {selectedReservePlace &&
              (placeSpaces.length ? (
                <div className="reserve-space-grid">
                  {placeSpaces.map((space) => (
                    <button
                      type="button"
                      className={`reserve-space-card ${String(selectedSpace?.id) === String(space.id) ? 'selected' : ''}`}
                      key={space.id}
                      onClick={() => {
                        setSelectedSpace(space)
                        setMessage('')
                      }}
                    >
                      <span
                        className="reserve-card-image"
                        style={
                          space.imagenUrl
                            ? {
                                backgroundImage: `linear-gradient(0deg,rgba(17,23,51,.62),rgba(17,23,51,.04)),url(${BACKEND}${space.imagenUrl})`,
                              }
                            : undefined
                        }
                      />
                      <span className="reserve-card-copy">
                        <strong>{space.nombre}</strong>
                        <small>
                          {space.tipo} · hasta {space.capacidad} personas
                        </small>
                      </span>
                      {String(selectedSpace?.id) === String(space.id) && <b>✓</b>}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="selector-empty">Este lugar todavía no tiene espacios disponibles.</div>
              ))}
          </section>
          {selectedSpace && (
            <div className="selected-space-summary">
              <span>✓</span>
              <div>
                <small>ESPACIO SELECCIONADO</small>
                <strong>{selectedSpace.nombre}</strong>
                <p>
                  {selectedReservePlace?.nombre} · {selectedSpace.categoria} · hasta {selectedSpace.capacidad} personas
                </p>
              </div>
            </div>
          )}
          <div className="selector-heading schedule-heading">
            <span>3</span>
            <div>
              <strong>Define fechas y horario</strong>
              <small>El mismo horario se reservará en cada día seleccionado</small>
            </div>
          </div>
          <div className="date-range-fields">
            <label>
              Fecha de inicio
              <input
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                required
                value={form.fecha}
                onChange={(e) => {
                  setForm({
                    ...form,
                    fecha: e.target.value,
                    fechaFin: form.fechaFin && form.fechaFin < e.target.value ? e.target.value : form.fechaFin,
                  })
                  setReservationAvailability(null)
                }}
              />
            </label>
            <label>
              Fecha de fin
              <input
                type="date"
                min={form.fecha || new Date().toISOString().slice(0, 10)}
                required
                value={form.fechaFin}
                onChange={(e) => {
                  setForm({ ...form, fechaFin: e.target.value })
                  setReservationAvailability(null)
                }}
              />
            </label>
          </div>
          <label>
            Hora inicio
            <input
              type="time"
              min="08:00"
              max="17:00"
              required
              value={form.horaInicio}
              onChange={(e) => {
                setForm({ ...form, horaInicio: e.target.value })
                setReservationAvailability(null)
              }}
            />
          </label>
          <label>
            Hora fin
            <input
              type="time"
              min="08:00"
              max="17:00"
              required
              value={form.horaFin}
              onChange={(e) => {
                setForm({ ...form, horaFin: e.target.value })
                setReservationAvailability(null)
              }}
            />
          </label>
          <label>
            Personas
            <input
              type="number"
              min="1"
              max={selectedSpace?.capacidad || undefined}
              required
              value={form.cantidadPersonas}
              onChange={(e) => {
                setForm({ ...form, cantidadPersonas: e.target.value })
                setReservationAvailability(null)
              }}
            />
          </label>
          <div className="live-total reservation-live-total">
            <div>
              <span>Duración diaria</span>
              <strong>{hours || 0} hora(s)</strong>
            </div>
            <div>
              <span>Días seleccionados</span>
              <strong>{selectedDays || 0}</strong>
            </div>
            <div>
              <span>Total provisional</span>
              <strong>₡{(hours * hourlyRate * selectedDays).toLocaleString('es-CR')}</strong>
            </div>
          </div>
          {reservationAvailability === 'available' && <div className="availability-result available">✓ Horario disponible en todas las fechas</div>}
          {reservationAvailability === 'unavailable' && <div className="availability-result unavailable">× Una de las fechas está ocupada</div>}
          <button className="primary-button reserve-review-button" disabled={!reservationFormComplete || checkingReservation}>
            {checkingReservation ? 'Comprobando fechas…' : 'Comprobar y revisar reserva'}
          </button>
          {reservationHint && <p className="reservation-form-hint">{reservationHint}</p>}
        </form>
        {message && <p className="form-error">{message}</p>}
      </main>
    )
  }

  void renderReservePage

  function renderAdminPage() {
    const reportMonths = Object.entries(reportSummary.porMes || {})
    const activeReportMonths = reportMonths.filter(([, hours]) => hours > 0)
    const busiestMonth = activeReportMonths.reduce((best, current) => !best || current[1] > best[1] ? current : best, null)
    const quietestMonth = activeReportMonths.reduce((best, current) => !best || current[1] < best[1] ? current : best, null)
    const leastUsedSpace = reportSummary.espaciosUso?.at(-1)
    const busiestDay = Object.entries(reportSummary.porDiaSemana || {}).reduce((best, current) => !best || current[1] > best[1] ? current : best, null)
    const busiestHour = Object.entries(reportSummary.porHoraInicio || {}).reduce((best, current) => !best || current[1] > best[1] ? current : best, null)
    const variationLabel = (value) => reportSummary.tienePeriodoAnterior
      ? `${Number(value) > 0 ? '+' : ''}${Number(value || 0)}%`
      : 'Sin datos anteriores para comparar'
    return (
      <main className="page-container admin-page">
        <p className="eyebrow">Acceso administrativo</p>
        <h1>Administración</h1>
        <AdminTabs value={adminTab} showDemoControls={showDemoControls} onChange={(tab) => { setAdminTab(tab); setMessage('') }} />
        {message && <p className="form-message">{message}</p>}
        {adminTab === 'precios' && (
          <form className="admin-rate-panel" onSubmit={saveRate}>
            <div>
              <p className="eyebrow">Configuración de cobros</p>
              <h2>Precio de reserva</h2>
              <p>Define la tarifa global por cada hora de uso de un espacio. Solo los perfiles administradores pueden modificarla.</p>
            </div>
            <label>
              Tarifa por hora (CRC)
              <input type="number" min="0.01" step="0.01" required value={rateForm} onChange={(event) => setRateForm(event.target.value)} />
            </label>
            <div className="admin-rate-current">
              <span>Tarifa vigente</span>
              <strong>
                ₡
                {hourlyRate.toLocaleString('es-CR', {
                  minimumFractionDigits: 2,
                })}
              </strong>
            </div>
            <button className="primary-button" disabled={savingRate}>
              {savingRate ? 'Guardando…' : 'Guardar precio'}
            </button>
            <small>Este cambio se aplica a nuevos cálculos de pago mientras el backend permanezca encendido.</small>
          </form>
        )}
        {adminTab === 'reservas' && (
          <div className="admin-table">
            <div className="admin-filter-bar">
              <label>
                Buscar reserva o usuario
                <input
                  value={adminFilters.reserva}
                  placeholder="Espacio, correo o número…"
                  onChange={(e) =>
                    setAdminFilters({
                      ...adminFilters,
                      reserva: e.target.value,
                    })
                  }
                />
              </label>
              <button type="button" onClick={() => setAdminFilters({ ...adminFilters, reserva: '' })}>
                Limpiar
              </button>
            </div>
            <div className="admin-table-head">
              <span>Reserva</span>
              <span>Usuario</span>
              <span>Fecha</span>
              <span>Estado / Acciones</span>
            </div>
            {adminReservations.length === 0 ? (
              <p className="admin-empty">No hay reservas registradas.</p>
            ) : (
              adminReservations
                .filter((reservation) => !adminFilters.reserva || [reservation.id, reservation.espacio, reservation.correoUsuario, reservation.estado].join(' ').toLowerCase().includes(adminFilters.reserva.toLowerCase()))
                .map((reservation) => (
                  <article key={reservation.id}>
                    <div>
                      <strong>
                        #{reservation.id} · {reservation.espacio}
                      </strong>
                      <small>{reservation.cantidadPersonas} persona(s)</small>
                    </div>
                    <span>{reservation.correoUsuario}</span>
                    <span>
                      {reservation.fecha}
                      <small>
                        {reservation.horaInicio} - {reservation.horaFin}
                      </small>
                    </span>
                    <div className="admin-row-actions">
                      <b className={`reservation-status ${reservation.estado.toLowerCase()}`}>{reservation.estado}</b>
                      {reservation.estado === 'PENDIENTE' && (
                        <>
                          <button onClick={() => reviewAdminReservation(reservation, 'aprobar')}>Aprobar</button>
                          <button className="danger" onClick={() => reviewAdminReservation(reservation, 'rechazar')}>
                            Rechazar
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))
            )}
          </div>
        )}
        {adminTab === 'pagos' && (
          <div className="admin-table payments-admin">
            <div className="admin-filter-bar">
              <label>
                Buscar pago o reserva
                <input value={adminFilters.pago} placeholder="Referencia, reserva o estado…" onChange={(e) => setAdminFilters({ ...adminFilters, pago: e.target.value })} />
              </label>
              <button type="button" onClick={() => setAdminFilters({ ...adminFilters, pago: '' })}>
                Limpiar
              </button>
            </div>
            <div className="admin-table-head">
              <span>Referencia</span>
              <span>Reserva</span>
              <span>Monto</span>
              <span>Estado / Acciones</span>
            </div>
            {adminPayments.length === 0 ? (
              <p className="admin-empty">No hay pagos registrados.</p>
            ) : (
              adminPayments
                .filter((payment) => !adminFilters.pago || [payment.referencia, payment.reservaId, payment.estado, payment.metodo].join(' ').toLowerCase().includes(adminFilters.pago.toLowerCase()))
                .map((payment) => (
                  <article key={payment.id}>
                    <div>
                      <strong>{payment.referencia}</strong>
                      <small>{payment.metodo.replaceAll('_', ' ')}</small>
                    </div>
                    <span>Reserva #{payment.reservaId}</span>
                    <strong>₡{Number(payment.monto).toLocaleString('es-CR')}</strong>
                    <div className="admin-row-actions">
                      <b className={`payment-status ${payment.estado.toLowerCase()}`}>{payment.estado.replaceAll('_', ' ')}</b>
                      {payment.estado === 'PENDIENTE_VERIFICACION' && (
                        <>
                          <button onClick={() => reviewAdminPayment(payment, 'aprobar')}>Aprobar</button>
                          <button className="danger" onClick={() => reviewAdminPayment(payment, 'rechazar')}>
                            Rechazar
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))
            )}
          </div>
        )}
        {adminTab === 'usuarios' && (
          <div className="admin-table users-admin">
            <div className="admin-filter-bar">
              <label>
                Buscar usuario
                <input
                  value={adminFilters.usuario}
                  placeholder="Nombre, correo, rol…"
                  onChange={(e) =>
                    setAdminFilters({
                      ...adminFilters,
                      usuario: e.target.value,
                    })
                  }
                />
              </label>
              <button type="button" onClick={() => setAdminFilters({ ...adminFilters, usuario: '' })}>
                Limpiar
              </button>
            </div>
            <div className="admin-table-head">
              <span>Usuario</span>
              <span>Correo</span>
              <span>Rol</span>
              <span>Estado</span>
            </div>
            {adminUsers
              .filter((target) => !adminFilters.usuario || [target.nombre, target.correo, target.rol, target.estado].join(' ').toLowerCase().includes(adminFilters.usuario.toLowerCase()))
              .map((target) => (
                <article key={target.id}>
                  <strong>{target.nombre}</strong>
                  <span>{target.correo}</span>
                  <select value={target.rol} disabled={user?.rol !== 'SUPERADMIN' || target.id === user?.id} onChange={(e) => updateAdminUser(target, { rol: e.target.value })}>
                    <option value="USUARIO">Usuario</option>
                    <option value="ADMIN">Administrador</option>
                    {user?.rol === 'SUPERADMIN' && <option value="SUPERADMIN">Superadministrador</option>}
                  </select>
                  <select value={target.estado} disabled={target.id === user?.id || (user?.rol !== 'SUPERADMIN' && target.rol !== 'USUARIO')} onChange={(e) => updateAdminUser(target, { estado: e.target.value })}>
                    <option value="ACTIVO">Activo</option>
                    <option value="BLOQUEADO">Bloqueado</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                  {showDemoControls && <div className="admin-row-actions">
                    <button className="danger" disabled={target.id === user?.id || (user?.rol !== 'SUPERADMIN' && target.rol !== 'USUARIO')} onClick={() => deleteAdminUser(target)}>
                      Eliminar
                    </button>
                  </div>}
                </article>
              ))}
          </div>
        )}
        {adminTab === 'reportes' && (
          <div className="reports-panel">
            <ReportFilters filters={reportFilters} places={places} spaces={spaces} onChange={setReportFilters} />
            <ReportMetrics summary={reportSummary} leastUsedSpace={leastUsedSpace} />
            <section className="report-comparison">
              <div>
                <p className="eyebrow">Comparación automática</p>
                <h2>Frente al período anterior</h2>
                <p>Se compara con un período inmediatamente anterior de la misma duración.</p>
              </div>
              <article className={Number(reportSummary.variacionReservas) >= 0 ? 'positive' : 'negative'}>
                <span>Reservas</span><strong>{variationLabel(reportSummary.variacionReservas)}</strong>
              </article>
              <article className={Number(reportSummary.variacionHoras) >= 0 ? 'positive' : 'negative'}>
                <span>Horas de uso</span><strong>{variationLabel(reportSummary.variacionHoras)}</strong>
              </article>
              <article>
                <span>Día con mayor uso</span><strong>{busiestDay && busiestDay[1] > 0 ? `${busiestDay[0]} · ${busiestDay[1]}h` : 'Sin datos'}</strong>
              </article>
              <article>
                <span>Hora de inicio más solicitada</span><strong>{busiestHour && busiestHour[1] > 0 ? `${busiestHour[0]} · ${busiestHour[1]}` : 'Sin datos'}</strong>
              </article>
            </section>
            <div className="report-insights">
              <section className="report-chart">
                <h2>Espacios más utilizados</h2>
                {(reportSummary.espaciosUso || []).slice(0, 6).map((item) => (
                  <div className="chart-row" key={item.id}>
                    <span title={item.nombre}>{item.nombre}</span>
                    <div>
                      <i style={{ width: `${item.porcentajeOcupacion}%` }} />
                    </div>
                    <strong>{item.horas}h</strong>
                  </div>
                ))}
                {!reportSummary.espaciosUso?.length && <p>No hay datos todavía.</p>}
              </section>
              <section className="report-chart">
                <h2>Uso por lugar / oficina</h2>
                {(reportSummary.lugaresUso || []).slice(0, 6).map((item) => (
                  <div className="chart-row" key={item.id}>
                    <span title={item.nombre}>{item.nombre}</span>
                    <div>
                      <i style={{ width: `${item.porcentajeOcupacion}%` }} />
                    </div>
                    <strong>{item.horas}h</strong>
                  </div>
                ))}
                {!reportSummary.lugaresUso?.length && <p>No hay lugares para mostrar.</p>}
              </section>
              <section className="report-chart">
                <h2>Uso por temporada</h2>
                {Object.entries(reportSummary.porTemporada || {}).map(([name, hours]) => (
                  <div className="chart-row" key={name}>
                    <span>{name}</span>
                    <div>
                      <i style={{ width: `${(hours / Math.max(...Object.values(reportSummary.porTemporada || { total: 1 }), 1)) * 100}%` }} />
                    </div>
                    <strong>{hours}h</strong>
                  </div>
                ))}
              </section>
            </div>
            <section className="report-chart report-months">
              <h2>Horas reservadas por mes</h2>
              <div className="month-highlights">
                <span><small>Mayor demanda</small><strong>{busiestMonth ? `${busiestMonth[0]} · ${busiestMonth[1]} h` : 'Sin datos'}</strong></span>
                <span><small>Menor demanda con actividad</small><strong>{quietestMonth ? `${quietestMonth[0]} · ${quietestMonth[1]} h` : 'Sin datos'}</strong></span>
              </div>
              <div className="month-bars">
                {Object.entries(reportSummary.porMes || {}).map(([name, hours]) => (
                  <div key={name}>
                    <span>
                      <i style={{ height: `${Math.max(3, (hours / Math.max(...Object.values(reportSummary.porMes || { total: 1 }), 1)) * 100)}%` }} />
                    </span>
                    <strong>{hours}h</strong>
                    <small>{name}</small>
                  </div>
                ))}
              </div>
            </section>
            <div className="report-insights report-demand-patterns">
              <section className="report-chart">
                <h2>Uso por día de la semana</h2>
                {Object.entries(reportSummary.porDiaSemana || {}).map(([name, hours]) => (
                  <div className="chart-row" key={name}><span>{name}</span><div><i style={{ width: `${(hours / Math.max(...Object.values(reportSummary.porDiaSemana || { total: 1 }), 1)) * 100}%` }} /></div><strong>{hours}h</strong></div>
                ))}
              </section>
              <section className="report-chart">
                <h2>Reservas por hora de inicio</h2>
                {Object.entries(reportSummary.porHoraInicio || {}).map(([hour, count]) => (
                  <div className="chart-row" key={hour}><span>{hour}</span><div><i style={{ width: `${(count / Math.max(...Object.values(reportSummary.porHoraInicio || { total: 1 }), 1)) * 100}%` }} /></div><strong>{count}</strong></div>
                ))}
              </section>
            </div>
            <section className="report-usage-section">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Rotación y mantenimiento</p>
                  <h2>Uso detallado de espacios</h2>
                </div>
                <span className="report-period">
                  {reportSummary.desde || '—'} → {reportSummary.hasta || '—'}
                </span>
              </div>
              <div className="usage-table">
                <div className="usage-table-head">
                  <span>Espacio</span>
                  <span>Reservas</span>
                  <span>Horas</span>
                  <span>Ocupación</span>
                  <span>Nivel</span>
                </div>
                {(reportSummary.espaciosUso || []).map((item) => (
                  <article key={item.id}>
                    <div>
                      <strong>{item.nombre}</strong>
                      <small>{item.lugar}</small>
                    </div>
                    <span>{item.reservas}</span>
                    <span>{item.horas} h</span>
                    <span>{item.porcentajeOcupacion}%</span>
                    <b className={`usage-level ${item.nivelUso.toLowerCase()}`}>{item.nivelUso}</b>
                  </article>
                ))}
                {!reportSummary.espaciosUso?.length && <p>No hay espacios que coincidan con los filtros.</p>}
              </div>
            </section>
            <section className="report-recommendations">
              <div>
                <p className="eyebrow">Apoyo para decisiones</p>
                <h2>Recomendaciones</h2>
                <p>Son avisos informativos; ningún espacio se bloquea automáticamente.</p>
              </div>
              <ul>
                {(reportSummary.recomendaciones || []).map((text, index) => (
                  <li key={`${index}-${text}`}>{text}</li>
                ))}
              </ul>
            </section>
            <section className="report-chart">
              <h2>Distribución por estado</h2>
              {['PENDIENTE', 'APROBADA', 'CONFIRMADA', 'CANCELADA', 'RECHAZADA'].map((value) => {
                const count = reportSummary.porEstado?.[value] || 0
                return (
                  <div className="chart-row" key={value}>
                    <span>{value}</span>
                    <div>
                      <i
                        style={{
                          width: `${(count / Math.max(reportSummary.total || 0, 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <strong>{count}</strong>
                  </div>
                )
              })}
            </section>
            <form className="report-form" onSubmit={downloadReservationsReport}>
              <h2>Exportar reservas</h2>
              <p>El PDF y el CSV respetan los filtros seleccionados arriba.</p>
              <div className="report-section-buttons export-section-buttons">
                {[
                  ['lugares', 'Lugares'],
                  ['espacios', 'Espacios'],
                  ['detalles', 'Detalles de reserva'],
                  ['estados', 'Estados'],
                ].map(([key, label]) => (
                  <button
                    type="button"
                    className={reportSections[key] ? 'selected' : ''}
                    key={key}
                    onClick={() =>
                      setReportSections((current) => ({
                        ...current,
                        [key]: !current[key],
                      }))
                    }
                  >
                    {reportSections[key] ? '✓ ' : ''}
                    {label}
                  </button>
                ))}
              </div>
              <div className="report-actions">
                <button className="primary-button">Descargar CSV</button>
                <button type="button" className="secondary-button" onClick={() => downloadReservationsReport(null, 'pdf')}>
                  Descargar PDF
                </button>
              </div>
            </form>
          </div>
        )}
        {adminTab === 'auditoria' && (
          <div className="admin-table audit-table">
            <div className="admin-table-head">
              <span>Fecha</span>
              <span>Actor</span>
              <span>Acción</span>
              <span>Recurso / Detalle</span>
            </div>
            {auditEntries.length === 0 ? (
              <p className="admin-empty">Aún no hay operaciones registradas en la bitácora.</p>
            ) : (
              auditEntries.map((entry) => (
                <article key={entry.id}>
                  <span>{new Date(entry.creadaEn).toLocaleString('es-CR')}</span>
                  <span>{entry.actor}</span>
                  <b>{entry.accion}</b>
                  <div>
                    <strong>
                      {entry.recurso}
                      {entry.recursoId ? ` #${entry.recursoId}` : ''}
                    </strong>
                    <small>{entry.detalle}</small>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </main>
    )
  }

  function logout() {
    localStorage.removeItem('reservas_token')
    setToken(null)
    setUser(null)
    setReservations([])
    setPayments([])
    fetch(`${API}/espacios`)
      .then(readJsonArray)
      .then(setSpaces)
      .catch(() => setSpaces([]))
    fetch(`${API}/lugares`)
      .then(readJsonArray)
      .then((data) => {
        setPlaces(data)
        setSelectedPlaceId(data[0]?.id || null)
      })
      .catch(() => setPlaces([]))
    navigate('home')
  }

  return (
    <div className="workspace-app">
      <Header
        user={user}
        page={page}
        navigate={navigate}
        logout={logout}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((current) => !current)}
        unreadCount={notifications.filter((notification) => !notification.leida).length}
        showDemoControls={showDemoControls}
        onToggleDemoControls={() => {
          const next = !showDemoControls
          setShowDemoControls(next)
          if (!next) {
            setAdminTab('usuarios')
            if (['reserve', 'reservations', 'payments', 'notifications'].includes(page)) navigate('dashboard')
          }
        }}
      />
      <SiempreListosRibbon />
      {page === 'home' && <HomePage onExploreSpaces={() => navigate('spaces')} />}
      {page === 'login' && (
        <AuthPage
          authMode={authMode}
          message={message}
          recoveryToken={recoveryToken}
          returnPage={returnPage}
          onLogin={login}
          onRegister={register}
          onRequestRecovery={requestRecovery}
          onConfirmRecovery={confirmRecovery}
          onModeChange={setAuthMode}
          onMessageChange={setMessage}
          onBack={(targetPage) => { setMessage(''); navigate(targetPage === 'login' ? 'home' : targetPage || 'home') }}
        />
      )}
      {page === 'dashboard' && renderDashboard()}
      {page === 'spaces' && (
        <SpacesPage
          user={user}
          places={places}
          spaces={spaces}
          selectedPlaceId={selectedPlaceId}
          availabilityForm={availabilityForm}
          availabilityTypeId={availabilityTypeId}
          availableSpaceIds={availableSpaceIds}
          types={types}
          message={message}
          showDemoControls={showDemoControls}
          onPlaceChange={(placeId) => { setSelectedPlaceId(placeId); setAvailableSpaceIds(null) }}
          onAvailabilityChange={setAvailabilityForm}
          onTypeChange={setAvailabilityTypeId}
          onCheckAvailability={checkAvailability}
          onClearAvailability={(clearType) => { setAvailableSpaceIds(null); if (clearType) setAvailabilityTypeId('') }}
          onCreatePlace={openPlaceCreator}
          onCreateSpace={openSpaceCreator}
          onEditPlace={openPlaceEditor}
          onDeletePlace={deletePlace}
          onEditSpace={openSpaceEditor}
          onDeleteSpace={deleteSpace}
          onReserve={(space) => {
            setSelectedSpace(space)
            setForm({ ...form, ...availabilityForm, fechaFin: '' })
            user ? navigate('reserve') : navigate('login', 'reserve')
          }}
        />
      )}
      {page === 'reserve' && (
        <ReservePage
          places={places}
          spaces={spaces}
          selectedPlaceId={selectedPlaceId}
          selectedSpace={selectedSpace}
          form={form}
          hours={hours}
          hourlyRate={hourlyRate}
          reservationAvailability={reservationAvailability}
          checkingReservation={checkingReservation}
          message={message}
          onPlaceChange={(placeId) => { setSelectedPlaceId(placeId); setSelectedSpace(null); setMessage('') }}
          onSpaceChange={(space) => { setSelectedSpace(space); setMessage('') }}
          onFormChange={setForm}
          onClearAvailability={() => setReservationAvailability(null)}
          onReview={reviewReservation}
        />
      )}
      {page === 'reservations' && (
        <ReservationsPage
          reservations={reservations}
          payments={payments}
          spaces={spaces}
          places={places}
          message={message}
          onNavigateSpaces={() => navigate('spaces')}
          onEdit={openReservationEditor}
          onCancel={cancelReservation}
        />
      )}
      {page === 'payments' && (
        <PaymentsPage
          reservations={reservations}
          payments={payments}
          paymentReservationId={paymentReservationId}
          paymentMethod={paymentMethod}
          paymentStep={paymentStep}
          paymentResult={paymentResult}
          paying={paying}
          hourlyRate={hourlyRate}
          message={message}
          onReservationChange={setPaymentReservationId}
          onMethodChange={setPaymentMethod}
          onStepChange={setPaymentStep}
          onResultChange={setPaymentResult}
          onSubmit={submitPayment}
          onNavigateReservations={() => navigate('reservations')}
          onDownloadReceipt={downloadReceipt}
        />
      )}
      {page === 'notifications' && <NotificationsPage notifications={notifications} onRead={readNotification} />}
      {page === 'profile' && <ProfilePage user={user} message={message} onUpdateProfile={updateProfile} onChangePassword={changePassword} />}
      {page === 'admin' && renderAdminPage()}
      {showSummary && (
        <div
          className="custom-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowSummary(false)
              setEditingSummaryRate(false)
            }
          }}
        >
          <section className="custom-modal reservation-review-modal" role="dialog" aria-modal="true" aria-labelledby="reservation-summary-title">
            <button
              type="button"
              className="custom-modal-close"
              aria-label="Cerrar resumen de reserva"
              onClick={() => {
                setShowSummary(false)
                setEditingSummaryRate(false)
              }}
            >
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
                <strong>{reservationDates(form.fecha, form.fechaFin).length}</strong>
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
              {user && ['ADMIN', 'SUPERADMIN'].includes(user.rol) && (
                <div className="modal-rate-heading">
                  <span>Tarifa por hora</span>
                  <button
                    type="button"
                    className="modal-rate-edit"
                    onClick={() => {
                      setRateForm(String(hourlyRate))
                      setEditingSummaryRate((current) => !current)
                    }}
                  >
                    {editingSummaryRate ? 'Cancelar' : 'Editar precio'}
                  </button>
                </div>
              )}
              {editingSummaryRate && user && ['ADMIN', 'SUPERADMIN'].includes(user.rol) && (
                <form className="modal-rate-form" onSubmit={saveRate}>
                  <label>
                    Nuevo precio por hora (CRC)
                    <input type="number" min="0.01" step="0.01" required value={rateForm} onChange={(event) => setRateForm(event.target.value)} />
                  </label>
                  <button className="primary-button" disabled={savingRate}>
                    {savingRate ? 'Guardando…' : 'Actualizar precio'}
                  </button>
                </form>
              )}
              <span className="modal-rate-breakdown">
                ₡{hourlyRate.toLocaleString('es-CR')} × {hours} hora(s) × {reservationDates(form.fecha, form.fechaFin).length} día(s)
              </span>
              <strong>₡{(hours * hourlyRate * reservationDates(form.fecha, form.fechaFin).length).toLocaleString('es-CR')}</strong>
              <small>Se creará una reserva diaria por cada fecha seleccionada.</small>
            </div>
            <div className="custom-modal-actions">
              <button className="secondary-button" onClick={() => setShowSummary(false)}>
                Modificar
              </button>
              <button className="primary-button" onClick={confirmReservation}>
                Confirmar y continuar al pago
              </button>
            </div>
          </section>
        </div>
      )}
      {editingSpace && (
        <div className="custom-modal-overlay">
          <form className="custom-modal space-editor media-editor" onSubmit={saveSpace}>
            <button type="button" className="custom-modal-close" onClick={() => setEditingSpace(null)}>
              ×
            </button>
            <p className="eyebrow">Administración</p>
            <h2>{editingSpace.id ? 'Editar espacio' : 'Crear espacio'}</h2>
            <div
              className="editor-media-preview"
              style={
                spaceImagePreview
                  ? {
                      backgroundImage: `linear-gradient(0deg,rgba(33,11,77,.55),transparent),url(${spaceImagePreview})`,
                    }
                  : undefined
              }
            >
              <span>{spaceImagePreview ? 'Vista previa' : 'Agrega una fotografía del espacio'}</span>
            </div>
            <div className="space-editor-grid">
              <label>
                Nombre
                <input required maxLength="120" value={editingSpace.nombre} onChange={(e) => setEditingSpace({ ...editingSpace, nombre: e.target.value })} />
              </label>
              <label>
                Capacidad
                <input
                  required
                  type="number"
                  min="1"
                  value={editingSpace.capacidad}
                  onChange={(e) =>
                    setEditingSpace({
                      ...editingSpace,
                      capacidad: e.target.value,
                    })
                  }
                />
              </label>
              <label className="full-field">
                Descripción
                <textarea
                  maxLength="500"
                  rows="3"
                  value={editingSpace.descripcion || ''}
                  onChange={(e) =>
                    setEditingSpace({
                      ...editingSpace,
                      descripcion: e.target.value,
                    })
                  }
                />
              </label>
              <label>
                Lugar
                <select
                  required
                  value={editingSpace.lugarId}
                  onChange={(e) =>
                    setEditingSpace({
                      ...editingSpace,
                      lugarId: e.target.value,
                    })
                  }
                >
                  <option value="">Seleccionar lugar</option>
                  {places
                    .filter((place) => place.estado === 'ACTIVO')
                    .map((place) => (
                      <option key={place.id} value={place.id}>
                        {place.nombre}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Tipo
                <select required value={editingSpace.tipoId} onChange={(e) => setEditingSpace({ ...editingSpace, tipoId: e.target.value })}>
                  {types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Categoría
                <select
                  required
                  value={editingSpace.categoriaId}
                  onChange={(e) =>
                    setEditingSpace({
                      ...editingSpace,
                      categoriaId: e.target.value,
                    })
                  }
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Estado
                <select value={editingSpace.estado} onChange={(e) => setEditingSpace({ ...editingSpace, estado: e.target.value })}>
                  <option value="DISPONIBLE">Disponible</option>
                  <option value="MANTENIMIENTO">Mantenimiento</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </label>
              <label className="file-field">
                Fotografía
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files[0] || null
                    setSpaceImage(file)
                    setSpaceImagePreview(file ? URL.createObjectURL(file) : '')
                  }}
                />
                <small>JPG, PNG o WEBP · máximo 5 MB</small>
              </label>
            </div>
            {message && <p className="form-error">{message}</p>}
            <div className="custom-modal-actions">
              <button type="button" className="secondary-button" onClick={() => setEditingSpace(null)}>
                Cancelar
              </button>
              <button className="primary-button" disabled={savingSpace}>
                {savingSpace ? 'Guardando…' : editingSpace.id ? 'Guardar cambios' : 'Crear espacio'}
              </button>
            </div>
          </form>
        </div>
      )}
      {showPlaceEditor && (
        <div className="custom-modal-overlay">
          <form className="custom-modal media-editor" onSubmit={savePlace}>
            <button type="button" className="custom-modal-close" onClick={() => setShowPlaceEditor(false)}>
              ×
            </button>
            <p className="eyebrow">Administración</p>
            <h2>{editingPlaceId ? 'Editar lugar' : 'Crear lugar'}</h2>
            <div
              className="editor-media-preview place-preview"
              style={
                placeImagePreview
                  ? {
                      backgroundImage: `linear-gradient(0deg,rgba(33,11,77,.55),transparent),url(${placeImagePreview})`,
                    }
                  : undefined
              }
            >
              <span>{placeImagePreview ? 'Vista previa de portada' : 'Agrega una portada del lugar'}</span>
            </div>
            <div className="space-editor-grid">
              <label>
                Nombre
                <input required maxLength="120" placeholder="Ej. Hostel" value={placeForm.nombre} onChange={(e) => setPlaceForm({ ...placeForm, nombre: e.target.value })} />
              </label>
              <label>
                Estado
                <select value={placeForm.estado} onChange={(e) => setPlaceForm({ ...placeForm, estado: e.target.value })}>
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                </select>
              </label>
              <label className="full-field">
                Descripción
                <textarea rows="3" maxLength="500" value={placeForm.descripcion} onChange={(e) => setPlaceForm({ ...placeForm, descripcion: e.target.value })} />
              </label>
              <label className="full-field">
                Dirección
                <input maxLength="250" value={placeForm.direccion} onChange={(e) => setPlaceForm({ ...placeForm, direccion: e.target.value })} />
              </label>
              <label className="full-field file-field">
                Fotografía de portada
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    const file = e.target.files[0] || null
                    setPlaceImage(file)
                    setPlaceImagePreview(file ? URL.createObjectURL(file) : '')
                  }}
                />
                <small>JPG, PNG o WEBP · máximo 5 MB</small>
              </label>
            </div>
            {message && <p className="form-error">{message}</p>}
            <div className="custom-modal-actions">
              <button type="button" className="secondary-button" onClick={() => setShowPlaceEditor(false)}>
                Cancelar
              </button>
              <button className="primary-button" disabled={savingSpace}>
                {savingSpace ? 'Guardando…' : editingPlaceId ? 'Guardar cambios' : 'Crear lugar'}
              </button>
            </div>
          </form>
        </div>
      )}
      {deleteTarget && (
        <div className="custom-modal-overlay">
          <section className="custom-modal confirmation-dialog">
            <div className="confirmation-icon">!</div>
            <p className="eyebrow">Confirmar acción</p>
            <h2>Desactivar {deleteTarget.type === 'place' ? 'lugar' : 'espacio'}</h2>
            <p>
              ¿Deseas desactivar <strong>{deleteTarget.item.nombre}</strong>? {deleteTarget.type === 'place' ? 'Sus espacios dejarán de mostrarse públicamente.' : 'Ya no podrá reservarse mientras permanezca inactivo.'}
            </p>
            <div className="custom-modal-actions">
              <button className="secondary-button" onClick={() => setDeleteTarget(null)}>
                Conservar
              </button>
              <button className="danger-confirm" onClick={confirmCatalogDeletion}>
                Sí, desactivar
              </button>
            </div>
          </section>
        </div>
      )}
      {editingReservation && (
        <div className="custom-modal-overlay">
          <form className="custom-modal" onSubmit={saveReservation}>
            <button type="button" className="custom-modal-close" onClick={() => setEditingReservation(null)}>
              ×
            </button>
            <p className="eyebrow">Gestión de reserva</p>
            <h2>Modificar reserva #{editingReservation.id}</h2>
            <div className="space-editor-grid">
              <label className="full-field">
                Espacio
                <select
                  required
                  value={editingReservation.espacioId}
                  onChange={(e) =>
                    setEditingReservation({
                      ...editingReservation,
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
                  value={editingReservation.fecha}
                  onChange={(e) =>
                    setEditingReservation({
                      ...editingReservation,
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
                  value={editingReservation.cantidadPersonas}
                  onChange={(e) =>
                    setEditingReservation({
                      ...editingReservation,
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
                  value={editingReservation.horaInicio}
                  onChange={(e) =>
                    setEditingReservation({
                      ...editingReservation,
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
                  value={editingReservation.horaFin}
                  onChange={(e) =>
                    setEditingReservation({
                      ...editingReservation,
                      horaFin: e.target.value,
                    })
                  }
                />
              </label>
            </div>
            {message && <p className="form-error">{message}</p>}
            <div className="custom-modal-actions">
              <button type="button" className="secondary-button" onClick={() => setEditingReservation(null)}>
                Volver
              </button>
              <button className="primary-button" disabled={savingReservation}>
                {savingReservation ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
      {page !== 'home' && <SocialFooter />}
    </div>
  )
}

export default WorkspaceApp
