import { formatDateTime } from '../utils/formatters'

export default function NotificationsPage({ notifications, onRead }) {
  return (
    <main className="page-container notifications-page">
      <p className="eyebrow">Centro de avisos</p>
      <h1>Notificaciones</h1>
      <p>Actualizaciones de tus reservas, pagos y cuenta.</p>
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="catalog-empty"><strong>No tienes notificaciones</strong><span>Los cambios importantes aparecerán aquí.</span></div>
        ) : notifications.map((notification) => (
          <button className={notification.leida ? 'read' : 'unread'} key={notification.id} onClick={() => onRead(notification)}>
            <span className={`notification-icon ${notification.tipo.toLowerCase()}`}>{notification.tipo === 'PAGO' ? '₡' : notification.tipo === 'RESERVA' ? '⌂' : 'i'}</span>
            <div><strong>{notification.titulo}</strong><p>{notification.mensaje}</p><small>{formatDateTime(notification.creadaEn)}</small></div>
            {!notification.leida && <b>NUEVA</b>}
          </button>
        ))}
      </div>
    </main>
  )
}
