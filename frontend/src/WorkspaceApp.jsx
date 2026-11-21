import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import Header from './components/Header'
import { SocialFooter, SiempreListosRibbon } from './components/Branding'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import ReservationsPage from './pages/ReservationsPage'
import PaymentsPage from './pages/PaymentsPage'
import ClientDashboard from './pages/ClientDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminPage from './pages/AdminPage'
import SpacesPage from './pages/SpacesPage'
import ReservePage from './pages/ReservePage'
import { BACKEND } from './services/api'
import {
  fetchAdminPayments,
  fetchAdminReservations,
  fetchAdminUsers,
  fetchAuditEntries,
  fetchReportSummary,
  requestHourlyRateUpdate,
  requestPaymentReview,
  requestReservationReview,
  requestReservationsReport,
  requestUserCreation,
  requestUserDeletion,
  requestUserUpdate,
} from './services/adminService'
import {
  confirmPasswordRecovery,
  registerUser,
  requestPasswordRecovery,
  updateCurrentPassword,
  updateCurrentUser,
} from './services/authService'
import useAuth from './hooks/useAuth'
import useReservations from './hooks/useReservations'
import {
  cancelReservationRequest,
  createReservationRange,
  fetchAvailability,
  updateReservation as updateReservationRequest,
} from './services/reservationService'
import {
  deactivateCatalogItem,
  fetchAdminCatalog,
  fetchPublicConfig,
  fetchPublicPlaces,
  fetchPublicSpaces,
  savePlaceRequest,
  saveSpaceRequest,
} from './services/catalogService'
import {
  cancelStripeSession,
  confirmStripeSession,
  createMockPayment,
  fetchMyPayments,
  requestReceipt,
  startStripeCheckout,
} from './services/paymentService'
import { fetchNotifications, markNotificationRead } from './services/notificationService'
import { DeleteConfirmationModal, PlaceEditorModal, SpaceEditorModal } from './components/CatalogModals'
import { ReservationEditorModal, ReservationSummaryModal } from './components/ReservationModals'
import { isStrongPassword, PASSWORD_MESSAGE } from './utils/password'
import { reservationDates, reservationHasEnded } from './utils/reservations'

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
  const {
    user,
    token,
    authHeaders: auth,
    authenticate,
    clearSession,
    updateSessionUser,
  } = useAuth()
  const [spaces, setSpaces] = useState([])
  const {
    reservations,
    prependReservations,
    mergeReservation,
    confirmReservationPayment,
    clearReservations,
  } = useReservations({ token, authHeaders: auth, refreshKey: page })
  const [payments, setPayments] = useState([])
  const [paymentReservationId, setPaymentReservationId] = useState('')
  const [paymentFocusIds, setPaymentFocusIds] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('STRIPE')
  const [paymentStep, setPaymentStep] = useState(1)
  const [paymentResult, setPaymentResult] = useState(null)
  const stripeHandledRef = useRef('')
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
  const [adminPages, setAdminPages] = useState({ reservas: 1, pagos: 1, usuarios: 1, auditoria: 1 })
  const [adminUsers, setAdminUsers] = useState([])
  const [showUserCreator, setShowUserCreator] = useState(false)
  const [savingUser, setSavingUser] = useState(false)
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
  // Las opciones están visibles por defecto; el botón permite ocultarlas durante la presentación.
  const [showDemoControls, setShowDemoControls] = useState(true)
  const [sprintView, setSprintView] = useState('both')
  const showSprint2 = showDemoControls || sprintView !== 'sprint1'
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

  const navigate = (next, origin) => {
    if (next === 'login') {
      setReturnPage(origin && origin !== 'login' ? origin : 'home')
      setAuthMode('login')
    }
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
    const protectedPages = ['dashboard', 'reserve', 'reservations', 'payments', 'notifications', 'profile', 'admin']
    if (!token && protectedPages.includes(page)) {
      const redirect = window.setTimeout(() => navigate('login', page), 0)
      return () => window.clearTimeout(redirect)
    }
    return undefined
  }, [page, token])

  useEffect(() => {
    if (page !== 'admin' || !user || ['ADMIN', 'SUPERADMIN'].includes(user.rol)) return
    const redirect = window.setTimeout(() => navigate('dashboard'), 0)
    return () => window.clearTimeout(redirect)
  }, [page, user])

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
    fetchPublicConfig()
      .then((data) => {
        setHourlyRate(Number(data.tarifaHora))
        setRateForm(String(data.tarifaHora))
      })
      .catch(() => setHourlyRate(25000))
    fetchPublicSpaces()
      .then((data) => {
        setSpaces(data)
        setTypes([...new Map(data.map((space) => [space.tipoId, { id: space.tipoId, nombre: space.tipo }])).values()])
      })
      .catch(() => setSpaces([]))
    fetchPublicPlaces()
      .then((data) => {
        setPlaces(data)
        if (data.length) setSelectedPlaceId((current) => current || data[0].id)
      })
      .catch(() => setPlaces([]))
  }, [])

  useEffect(() => {
    if (!token) return
    fetchMyPayments(auth)
      .then(setPayments)
      .catch(() => setPayments([]))
    fetchNotifications(auth)
      .then(setNotifications)
      .catch(() => setNotifications([]))
  }, [token, page, auth])

  useEffect(() => {
    if (page !== 'payments') return
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('stripe_session')
    if (params.get('stripe_cancelled') === '1') {
      const sessionId = sessionStorage.getItem('stripe_pending_session')
      if (token && sessionId) {
        cancelStripeSession(auth, sessionId).then((payment) => {
          setPayments((current) => (current.some((item) => item.id === payment.id) ? current.map((item) => item.id === payment.id ? payment : item) : [payment, ...current]))
          setMessage(payment.estado === 'APROBADO' ? 'Stripe confirmó el pago. La reserva quedó confirmada.' : 'El pago se canceló en Stripe. Puedes intentarlo de nuevo cuando quieras.')
        }).catch(() => setMessage('El pago se canceló. Si sigue pendiente, vuelve a cargar esta pantalla.'))
          .finally(() => sessionStorage.removeItem('stripe_pending_session'))
      } else {
        Promise.resolve().then(() => setMessage('El pago se canceló en Stripe. Puedes intentarlo de nuevo cuando quieras.'))
      }
      window.history.replaceState({}, document.title, '/pagos')
      return
    }
    const pendingSessionId = sessionId || sessionStorage.getItem('stripe_pending_session')
    if (!token || !pendingSessionId || stripeHandledRef.current === pendingSessionId) return
    stripeHandledRef.current = pendingSessionId
    confirmStripeSession(auth, pendingSessionId)
      .then((payment) => {
        setPaymentResult(payment)
        setPayments((current) => (current.some((item) => item.id === payment.id) ? current.map((item) => (item.id === payment.id ? payment : item)) : [payment, ...current]))
        if (payment.estado === 'APROBADO') confirmReservationPayment(payment.reservaId)
        setPaymentReservationId('')
        setPaymentStep(3)
        setMessage(payment.estado === 'APROBADO' ? 'Stripe confirmó el pago de prueba. La reserva quedó confirmada.' : 'Stripe aún no confirma el pago. Actualiza en unos segundos para consultar de nuevo.')
        if (payment.estado === 'APROBADO') sessionStorage.removeItem('stripe_pending_session')
      })
      .catch((error) => { setMessage(error.message || 'No se pudo verificar el resultado de Stripe') })
      .finally(() => { window.history.replaceState({}, document.title, '/pagos') })
  }, [page, token, auth, confirmReservationPayment])

  useEffect(() => {
    if (!user || !['ADMIN', 'SUPERADMIN'].includes(user.rol)) return
    fetchAdminCatalog(auth)
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
    Promise.all([fetchAdminUsers(auth), fetchAdminReservations(auth), fetchAdminPayments(auth), fetchReportSummary(auth), fetchAuditEntries(auth)])
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
    fetchAuditEntries(auth)
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
    const query = params.toString()
    const timer = window.setTimeout(() => {
      fetchReportSummary(auth, query, controller.signal)
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

  async function login(event) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    try {
      await authenticate(data)
      navigate(returnPage === 'home' ? 'dashboard' : returnPage)
    } catch {
      setMessage('Correo o contraseña incorrectos')
    }
  }

  async function register(event) {
    event.preventDefault()
    setMessage('')
    const data = Object.fromEntries(new FormData(event.currentTarget))
    if (data.password !== data.confirmacion) return setMessage('Las contraseñas no coinciden')
    if (!isStrongPassword(data.password)) return setMessage(PASSWORD_MESSAGE)
    try {
      await registerUser({
        nombre: data.nombre,
        correo: data.correo,
        password: data.password,
      })
      setAuthMode('login')
      setMessage('Registro exitoso. Ya puedes iniciar sesión.')
    } catch (error) {
      setMessage(error.message || 'No se pudo completar el registro')
    }
  }

  async function requestRecovery(event) {
    event.preventDefault()
    setMessage('')
    const data = Object.fromEntries(new FormData(event.currentTarget))
    let body
    try {
      body = await requestPasswordRecovery(data)
    } catch (error) {
      return setMessage(error.message || 'No se pudo generar la solicitud')
    }
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
    try {
      await confirmPasswordRecovery({
        token: data.token,
        passwordNuevo: data.passwordNuevo,
      })
    } catch (error) {
      return setMessage(error.message || 'No se pudo restablecer la contraseña')
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
          const available = await fetchAvailability({
            fecha,
            horaInicio: form.horaInicio,
            horaFin: form.horaFin,
            personas: form.cantidadPersonas,
            lugarId: selectedSpace.lugarId,
          })
          return { fecha, available }
        }),
      )
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
    let created
    try {
      created = await createReservationRange(auth, {
        fechaInicio: form.fecha,
        fechaFin: form.fechaFin,
        horaInicio: form.horaInicio,
        horaFin: form.horaFin,
        cantidadPersonas: Number(form.cantidadPersonas),
        espacioId: selectedSpace.id,
      })
    } catch (error) {
      setShowSummary(false)
      return setMessage(error.message || 'No se pudo crear la reserva')
    }
    prependReservations(created)
    const createdIds = created.map((reservation) => String(reservation.id))
    setPaymentFocusIds(createdIds)
    setPaymentReservationId(createdIds[0] || '')
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
    const selectedReservation = reservations.find((reservation) => String(reservation.id) === String(paymentReservationId))
    if (!selectedReservation || reservationHasEnded(selectedReservation)) return setMessage('Esta reserva ya expiró y no se puede pagar.')
    setPaying(true)
    if (paymentMethod === 'STRIPE') {
      try {
        const { ok, status, body } = await startStripeCheckout(auth, Number(paymentReservationId))
        if (!ok) return setMessage(body.detail || body.message || `Error ${status} al iniciar Stripe Checkout`)
        if (!body.url) return setMessage('Stripe no devolvió el enlace de Checkout')
        if (body.sessionId) sessionStorage.setItem('stripe_pending_session', body.sessionId)
        window.location.assign(body.url)
        return
      } catch {
        setMessage('No se pudo conectar con Stripe. Inténtalo de nuevo.')
      } finally {
        setPaying(false)
      }
      return
    }
    const { ok, status, body } = await createMockPayment(auth, Number(paymentReservationId), paymentMethod)
    setPaying(false)
    if (!ok) return setMessage(body.detail || body.message || `Error ${status} al registrar el pago`)
    setPaymentResult(body)
    setPayments((current) => (current.some((payment) => payment.id === body.id) ? current.map((payment) => (payment.id === body.id ? body : payment)) : [body, ...current]))
    if (body.estado === 'APROBADO') confirmReservationPayment(body.reservaId)
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
    const { ok, status, body } = await requestHourlyRateUpdate(auth, tarifaHora)
    setSavingRate(false)
    if (!ok) {
      return setMessage(body.detail || body.message || `Error ${status} al actualizar la tarifa`)
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
    const { ok, status, body: updated } = await saveSpaceRequest(auth, editingSpace.id, payload, spaceImage)
    setSavingSpace(false)
    if (!ok) return setMessage(updated.detail || updated.message || `Error ${status} al guardar el espacio`)
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
    const { ok, status, body } = await savePlaceRequest(auth, editingPlaceId, placeForm, placeImage)
    setSavingSpace(false)
    if (!ok) return setMessage(body.detail || body.message || `Error ${status} al guardar el lugar`)
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
    const { ok, status } = await deactivateCatalogItem(auth, type, item.id)
    setDeleteTarget(null)
    if (!ok) return setMessage(`No se pudo desactivar ${type === 'place' ? 'el lugar' : 'el espacio'} (error ${status})`)
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
    let body
    try {
      body = await updateReservationRequest(auth, editingReservation.id, payload)
    } catch (error) {
      setSavingReservation(false)
      return setMessage(error.message || 'No se pudo modificar la reserva')
    }
    setSavingReservation(false)
    mergeReservation(body)
    setEditingReservation(null)
    setMessage('Reserva modificada y enviada nuevamente a revisión')
  }

  async function cancelReservation(reservation) {
    if (!window.confirm(`¿Cancelar la reserva #${reservation.id} de ${reservation.espacio}?`)) return
    let body
    try {
      body = await cancelReservationRequest(auth, reservation.id)
    } catch (error) {
      return setMessage(error.message || 'No se pudo cancelar la reserva')
    }
    mergeReservation(body)
    setMessage('Reserva cancelada. El horario quedó disponible nuevamente.')
  }

  async function checkAvailability(event) {
    event.preventDefault()
    setMessage('')
    if (!availabilityForm.fecha) return setMessage('Selecciona un día en el calendario para consultar disponibilidad')
    let body
    try {
      body = await fetchAvailability({
        fecha: availabilityForm.fecha,
        horaInicio: availabilityForm.horaInicio,
        horaFin: availabilityForm.horaFin,
        personas: availabilityForm.cantidadPersonas,
        lugarId: selectedPlaceId,
        tipoId: availabilityTypeId,
      })
    } catch (error) {
      return setMessage(error.message || 'No se pudo consultar la disponibilidad')
    }
    setAvailableSpaceIds(body.map((space) => space.id))
    setMessage(`${body.length} espacio(s) disponible(s) para el horario indicado`)
  }

  async function reviewAdminReservation(reservation, action) {
    const { ok, status, body } = await requestReservationReview(auth, reservation.id, action)
    if (!ok) return setMessage(body.detail || body.message || `Error ${status}`)
    setAdminReservations((current) => current.map((item) => (item.id === body.id ? body : item)))
    setMessage(`Reserva ${action === 'aprobar' ? 'aprobada' : 'rechazada'}`)
  }

  async function reviewAdminPayment(payment, action) {
    const { ok, status, body } = await requestPaymentReview(auth, payment.id, action)
    if (!ok) return setMessage(body.detail || body.message || `Error ${status}`)
    setAdminPayments((current) => current.map((item) => (item.id === body.id ? body : item)))
    setMessage(`Pago ${action === 'aprobar' ? 'aprobado' : 'rechazado'}`)
  }

  async function updateAdminUser(target, changes) {
    const { ok, status, body } = await requestUserUpdate(auth, target.id, {
      estado: changes.estado || target.estado,
      rol: changes.rol || target.rol,
    })
    if (!ok) return setMessage(body.detail || body.message || `Error ${status}`)
    setAdminUsers((current) => current.map((item) => (item.id === body.id ? body : item)))
    setMessage('Usuario actualizado correctamente')
  }

  async function createAdminUser(event) {
    event.preventDefault()
    setMessage('')
    const formElement = event.currentTarget
    const data = Object.fromEntries(new FormData(formElement))
    if (!isStrongPassword(data.password)) return setMessage(PASSWORD_MESSAGE)
    setSavingUser(true)
    try {
      const { ok, status, body } = await requestUserCreation(auth, data)
      if (!ok) return setMessage(body.detail || body.message || `Error ${status}`)
      setAdminUsers((current) => [...current, body])
      formElement.reset()
      setShowUserCreator(false)
      setMessage('Usuario registrado correctamente')
    } finally {
      setSavingUser(false)
    }
  }

  async function deleteAdminUser(target) {
    if (target.id === user?.id) return setMessage('No puedes eliminar tu propia cuenta')
    if (!window.confirm(`¿Eliminar permanentemente la cuenta de ${target.nombre}? Esta acción no se puede deshacer.`)) return
    const { ok, status, body } = await requestUserDeletion(auth, target.id)
    if (!ok) return setMessage(body.detail || body.message || `No se pudo eliminar la cuenta (error ${status})`)
    setAdminUsers((current) => current.filter((item) => item.id !== target.id))
    setMessage('Cuenta eliminada permanentemente')
  }

  async function updateProfile(event) {
    event.preventDefault()
    setMessage('')
    const data = Object.fromEntries(new FormData(event.currentTarget))
    const correoAnterior = user.correo
    let body
    try {
      body = await updateCurrentUser(auth, data)
    } catch (error) {
      return setMessage(error.message || 'No se pudo actualizar el perfil')
    }
    updateSessionUser(body)
    if (body.correo !== correoAnterior) {
      setMessage('Perfil actualizado. Inicia sesión nuevamente con tu nuevo correo.')
      setTimeout(logout, 1800)
    } else setMessage('Perfil actualizado correctamente')
  }

  async function readNotification(notification) {
    if (notification.leida) return
    const body = await markNotificationRead(auth, notification.id)
    if (!body) return
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
    const response = await requestReservationsReport(auth, format, params)
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
    const response = await requestReceipt(auth, payment.id)
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
    try {
      await updateCurrentPassword(auth, {
        passwordActual: data.passwordActual,
        passwordNuevo: data.passwordNuevo,
      })
    } catch (error) {
      return setMessage(error.message || 'No se pudo actualizar la contraseña')
    }
    formElement.reset()
    clearSession()
    clearReservations()
    setPayments([])
    setAuthMode('login')
    navigate('login')
    setMessage('Contraseña restablecida. Inicia sesión nuevamente con tu nueva contraseña.')
  }

  function renderDashboard() {
    return ['ADMIN', 'SUPERADMIN'].includes(user?.rol)
      ? (
        <AdminDashboard
          user={user}
          adminReservations={adminReservations}
          adminPayments={adminPayments}
          adminUsers={adminUsers}
          spaces={spaces}
          places={places}
          showDemoControls={showDemoControls}
          reportSummary={reportSummary}
          message={message}
          reportSections={reportSections}
          spaceUsageSlide={spaceUsageSlide}
          autoRotateCharts={autoRotateCharts}
          setAdminTab={setAdminTab}
          navigate={navigate}
          setReportSections={setReportSections}
          setAutoRotateCharts={setAutoRotateCharts}
          setSpaceUsageSlide={setSpaceUsageSlide}
        />
      )
      : <ClientDashboard user={user} reservations={reservations} payments={payments} notifications={notifications} showDemoControls={showDemoControls} showSprint2={showSprint2} onNavigate={navigate} />
  }

  function logout() {
    clearSession()
    clearReservations()
    setPayments([])
    fetchPublicSpaces()
      .then(setSpaces)
      .catch(() => setSpaces([]))
    fetchPublicPlaces()
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
        sprintView={sprintView}
        onToggleSprintView={() => {
          const next = sprintView === 'both' ? 'sprint1' : sprintView === 'sprint1' ? 'sprint2' : 'both'
          setSprintView(next)
          setMessage('')
          if (next === 'sprint1' && ['reserve', 'reservations'].includes(page)) navigate('dashboard')
          if (next === 'sprint1' && authMode === 'recover') setAuthMode('login')
        }}
        onToggleDemoControls={() => {
          const next = !showDemoControls
          setShowDemoControls(next)
          if (!next) {
            setSprintView('both')
            setAdminTab('usuarios')
            if (['payments', 'notifications'].includes(page)) navigate('dashboard')
          }
        }}
      />
      <SiempreListosRibbon />
      {page === 'home' && <HomePage onExploreSpaces={() => navigate('spaces')} />}
      {page === 'login' && (
        <AuthPage
          authMode={authMode}
          message={message}
          showSprint2={showSprint2}
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
          showSprint2={showSprint2}
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
          focusedReservationIds={paymentFocusIds}
          paymentReservationId={paymentReservationId}
          paymentMethod={paymentMethod}
          paymentStep={paymentStep}
          paymentResult={paymentResult}
          paying={paying}
          hourlyRate={hourlyRate}
          message={message}
          onReservationChange={setPaymentReservationId}
          onShowAllReservations={() => setPaymentFocusIds(null)}
          onMethodChange={setPaymentMethod}
          onStepChange={setPaymentStep}
          onResultChange={setPaymentResult}
          onSubmit={submitPayment}
          onNavigateReservations={() => { setPaymentFocusIds(null); navigate('reservations') }}
          onDownloadReceipt={downloadReceipt}
        />
      )}
      {page === 'notifications' && <NotificationsPage notifications={notifications} onRead={readNotification} />}
      {page === 'profile' && <ProfilePage user={user} message={message} onUpdateProfile={updateProfile} onChangePassword={changePassword} />}
      {page === 'admin' && (
        <AdminPage
          user={user}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          adminPages={adminPages}
          setAdminPages={setAdminPages}
          adminFilters={adminFilters}
          setAdminFilters={setAdminFilters}
          adminReservations={adminReservations}
          adminPayments={adminPayments}
          adminUsers={adminUsers}
          auditEntries={auditEntries}
          auth={auth}
          message={message}
          setMessage={setMessage}
          showDemoControls={showDemoControls}
          showSprint2={showSprint2}
          hourlyRate={hourlyRate}
          rateForm={rateForm}
          setRateForm={setRateForm}
          savingRate={savingRate}
          saveRate={saveRate}
          reviewAdminReservation={reviewAdminReservation}
          reviewAdminPayment={reviewAdminPayment}
          updateAdminUser={updateAdminUser}
          createAdminUser={createAdminUser}
          deleteAdminUser={deleteAdminUser}
          savingUser={savingUser}
          showUserCreator={showUserCreator}
          setShowUserCreator={setShowUserCreator}
          reportSummary={reportSummary}
          reportFilters={reportFilters}
          setReportFilters={setReportFilters}
          reportSections={reportSections}
          setReportSections={setReportSections}
          places={places}
          spaces={spaces}
          downloadReservationsReport={downloadReservationsReport}
        />
      )}
      {showSummary && (
        <ReservationSummaryModal
          user={user}
          selectedSpace={selectedSpace}
          places={places}
          form={form}
          hours={hours}
          hourlyRate={hourlyRate}
          editingRate={editingSummaryRate}
          rateForm={rateForm}
          savingRate={savingRate}
          onRateFormChange={setRateForm}
          onToggleRateEditor={() => {
            setRateForm(String(hourlyRate))
            setEditingSummaryRate((current) => !current)
          }}
          onSaveRate={saveRate}
          onClose={() => {
            setShowSummary(false)
            setEditingSummaryRate(false)
          }}
          onModify={() => setShowSummary(false)}
          onConfirm={confirmReservation}
        />
      )}
      {editingSpace && (
        <SpaceEditorModal
          space={editingSpace}
          places={places}
          types={types}
          categories={categories}
          imagePreview={spaceImagePreview}
          message={message}
          saving={savingSpace}
          onChange={setEditingSpace}
          onImageChange={(file) => {
            setSpaceImage(file)
            setSpaceImagePreview(file ? URL.createObjectURL(file) : '')
          }}
          onClose={() => setEditingSpace(null)}
          onSubmit={saveSpace}
        />
      )}
      {showPlaceEditor && (
        <PlaceEditorModal
          placeId={editingPlaceId}
          placeForm={placeForm}
          imagePreview={placeImagePreview}
          message={message}
          saving={savingSpace}
          onChange={setPlaceForm}
          onImageChange={(file) => {
            setPlaceImage(file)
            setPlaceImagePreview(file ? URL.createObjectURL(file) : '')
          }}
          onClose={() => setShowPlaceEditor(false)}
          onSubmit={savePlace}
        />
      )}
      {deleteTarget && <DeleteConfirmationModal target={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={confirmCatalogDeletion} />}
      {editingReservation && (
        <ReservationEditorModal
          reservation={editingReservation}
          spaces={spaces}
          message={message}
          saving={savingReservation}
          onChange={setEditingReservation}
          onClose={() => setEditingReservation(null)}
          onSubmit={saveReservation}
        />
      )}
      {page !== 'home' && <SocialFooter />}
    </div>
  )
}

export default WorkspaceApp
