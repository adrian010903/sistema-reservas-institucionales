import { formatCurrency } from '../utils/formatters'

const ACTIVE_STATES = ['PENDIENTE', 'APROBADA', 'CONFIRMADA']

export default function ClientDashboard({ user, reservations, payments, notifications, showDemoControls, onNavigate }) {
  if (!showDemoControls) {
    return (
      <main className="page-container role-dashboard client-dashboard">
        <div className="dashboard-welcome">
          <div><p className="eyebrow">Panel de usuario</p><h1>Hola, {user?.nombre}</h1><p>Consulta los espacios institucionales o actualiza la información de tu cuenta.</p></div>
          <button className="primary-button" onClick={() => onNavigate('spaces')}>Consultar espacios</button>
        </div>
        <section className="dashboard-panel quick-management">
          <div className="panel-heading"><div><p className="eyebrow">Accesos</p><h2>Gestiones disponibles</h2></div></div>
          <div className="quick-action-list">
            <button onClick={() => onNavigate('spaces')}><span>⌕</span><div><strong>Consultar espacios</strong><small>Revisa lugares, capacidad y disponibilidad</small></div><b>→</b></button>
            <button onClick={() => onNavigate('profile')}><span>◎</span><div><strong>Consultar y actualizar perfil</strong><small>Gestiona tus datos y contraseña</small></div><b>→</b></button>
          </div>
        </section>
      </main>
    )
  }
  const upcoming = reservations
    .filter((reservation) => ACTIVE_STATES.includes(reservation.estado) && new Date(`${reservation.fecha}T${reservation.horaInicio}`) >= new Date())
    .sort((first, second) => `${first.fecha}T${first.horaInicio}`.localeCompare(`${second.fecha}T${second.horaInicio}`))
  const nextReservation = upcoming[0]
  const pendingCount = reservations.filter((reservation) => reservation.estado === 'PENDIENTE').length
  const confirmedCount = reservations.filter((reservation) => reservation.estado === 'CONFIRMADA').length
  const approvedPayments = payments.filter((payment) => payment.estado === 'APROBADO')
  const paidTotal = approvedPayments.reduce((total, payment) => total + Number(payment.monto || 0), 0)
  const unread = notifications.filter((notification) => !notification.leida).length

  return (
    <main className="page-container role-dashboard client-dashboard">
      <div className="dashboard-welcome">
        <div>
          <p className="eyebrow">Mi panel de reservas</p>
          <h1>Hola, {user?.nombre}</h1>
          <p>Organiza tus próximas actividades y consulta el estado de tus solicitudes.</p>
        </div>
        <button className="primary-button" onClick={() => onNavigate('spaces')}>Buscar un espacio</button>
      </div>

      <section className="dashboard-metrics client-metrics">
        <button onClick={() => onNavigate('reservations')}><span className="metric-icon indigo">▤</span><div><small>Próximas reservas</small><strong>{upcoming.length}</strong><em>{pendingCount} pendientes</em></div></button>
        <button onClick={() => onNavigate('reservations')}><span className="metric-icon green">✓</span><div><small>Confirmadas</small><strong>{confirmedCount}</strong><em>Listas para tu visita</em></div></button>
        <button onClick={() => onNavigate('payments')}><span className="metric-icon amber">₡</span><div><small>Pagos aprobados</small><strong>{approvedPayments.length}</strong><em>{formatCurrency(paidTotal)} registrados</em></div></button>
        <button onClick={() => onNavigate('notifications')}><span className="metric-icon violet">●</span><div><small>Avisos nuevos</small><strong>{unread}</strong><em>{notifications.length} notificaciones</em></div></button>
      </section>

      <div className="dashboard-grid client-grid">
        <section className="dashboard-panel next-booking">
          <div className="panel-heading"><div><p className="eyebrow">Agenda</p><h2>Tu próxima reserva</h2></div><button onClick={() => onNavigate('reservations')}>Ver historial →</button></div>
          {nextReservation ? (
            <div className="next-booking-card">
              <div className="calendar-tile"><strong>{new Date(`${nextReservation.fecha}T12:00:00`).toLocaleDateString('es-CR', { day: '2-digit' })}</strong><span>{new Date(`${nextReservation.fecha}T12:00:00`).toLocaleDateString('es-CR', { month: 'short' }).replace('.', '')}</span></div>
              <div><h3>{nextReservation.espacio}</h3><p>{nextReservation.horaInicio} - {nextReservation.horaFin} · {nextReservation.cantidadPersonas} persona(s)</p><b className={`reservation-status ${nextReservation.estado.toLowerCase()}`}>{nextReservation.estado}</b></div>
            </div>
          ) : <div className="dashboard-empty"><strong>No tienes reservas próximas</strong><span>Explora el catálogo y programa tu siguiente actividad.</span><button className="secondary-button" onClick={() => onNavigate('spaces')}>Explorar espacios</button></div>}
        </section>

        <section className="dashboard-panel quick-management">
          <div className="panel-heading"><div><p className="eyebrow">Accesos</p><h2>¿Qué deseas hacer?</h2></div></div>
          <div className="quick-action-list">
            <button onClick={() => onNavigate('spaces')}><span>⌕</span><div><strong>Consultar disponibilidad</strong><small>Filtra por fecha, hora y capacidad</small></div><b>→</b></button>
            <button onClick={() => onNavigate('payments')}><span>₡</span><div><strong>Completar un pago</strong><small>Revisa reservas pendientes de pago</small></div><b>→</b></button>
            {showDemoControls && <button onClick={() => onNavigate('profile')}><span>◎</span><div><strong>Actualizar mi perfil</strong><small>Gestiona tus datos y contraseña</small></div><b>→</b></button>}
          </div>
        </section>
      </div>

      <section className="dashboard-panel client-notices">
        <div className="panel-heading"><div><p className="eyebrow">Novedades</p><h2>Avisos recientes</h2></div><button onClick={() => onNavigate('notifications')}>Ver todos →</button></div>
        {notifications.length === 0 ? <div className="dashboard-empty">No tienes avisos por el momento.</div> : (
          <div className="notice-preview">{notifications.slice(0, 3).map((notification) => <button key={notification.id} onClick={() => onNavigate('notifications')}><span className={notification.leida ? 'read' : 'unread'}>{notification.tipo === 'PAGO' ? '₡' : notification.tipo === 'RESERVA' ? '⌂' : 'i'}</span><div><strong>{notification.titulo}</strong><small>{notification.mensaje}</small></div><time>{new Date(notification.creadaEn).toLocaleDateString('es-CR')}</time></button>)}</div>
        )}
      </section>
    </main>
  )
}
