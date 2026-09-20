import { formatCurrency, formatStatus } from '../utils/formatters'

const paymentOptions = [
  ['TARJETA_MOCK', '▣', 'Tarjeta simulada', 'Aprobación inmediata sin introducir números reales.'],
  ['TRANSFERENCIA', '▤', 'Transferencia bancaria', 'Registra el método y queda pendiente de verificación.'],
  ['EFECTIVO', '₡', 'Efectivo en sede', 'Paga en recepción dentro de las próximas 48 horas.'],
]

export default function PaymentsPage({
  reservations, payments, paymentReservationId, paymentMethod, paymentStep, paymentResult, paying, hourlyRate, message,
  onReservationChange, onMethodChange, onStepChange, onResultChange, onSubmit, onNavigateReservations, onDownloadReceipt,
}) {
  const payableReservations = reservations.filter((reservation) => !payments.some((payment) => payment.reservaId === reservation.id && payment.estado !== 'RECHAZADO') && !['CANCELADA', 'RECHAZADA'].includes(reservation.estado))
  const selected = reservations.find((reservation) => String(reservation.id) === String(paymentReservationId))
  const paymentHours = selected ? Math.max(0, (Number(String(selected.horaFin).slice(0, 2)) * 60 + Number(String(selected.horaFin).slice(3, 5)) - (Number(String(selected.horaInicio).slice(0, 2)) * 60 + Number(String(selected.horaInicio).slice(3, 5)))) / 60) : 0
  const paymentTotal = paymentHours * hourlyRate

  return (
    <main className="page-container payment-page modern-payment-page">
      <div className="payments-title"><div><p className="eyebrow">Pago demostrativo seguro</p><h1>Completa tu reserva</h1><p>Proceso simulado en colones costarricenses. Nunca solicitamos ni almacenamos datos bancarios reales.</p></div><span>🔒 Entorno de prueba</span></div>
      <div className="payment-flow-layout">
        <section className="payment-wizard">
          <div className="payment-progress">{[['1', 'Reserva'], ['2', 'Método'], ['3', 'Confirmación']].map(([number, label], index) => <div className={paymentStep >= index + 1 ? 'active' : ''} key={number}><span>{paymentStep > index + 1 ? '✓' : number}</span><small>{label}</small></div>)}</div>
          {paymentStep === 1 && <div className="payment-stage"><p className="eyebrow">Paso 1 de 3</p><h2>Selecciona la reserva</h2><p>Elige cuál solicitud deseas completar.</p>
            {payableReservations.length === 0 ? <div className="payment-empty">No tienes reservas pendientes de pago.</div> : <div className="payable-list">{payableReservations.map((reservation) => <button className={String(paymentReservationId) === String(reservation.id) ? 'selected' : ''} key={reservation.id} onClick={() => { onReservationChange(String(reservation.id)); onResultChange(null) }}><span className="payment-calendar"><strong>{new Date(`${reservation.fecha}T12:00`).getDate()}</strong><small>{new Date(`${reservation.fecha}T12:00`).toLocaleDateString('es-CR', { month: 'short' }).replace('.', '')}</small></span><span><strong>{reservation.espacio}</strong><small>Reserva #{reservation.id} · {String(reservation.horaInicio).slice(0, 5)} - {String(reservation.horaFin).slice(0, 5)}</small></span><b>{String(paymentReservationId) === String(reservation.id) ? '✓' : '›'}</b></button>)}</div>}
            <div className="wizard-actions"><span /><button className="primary-button" disabled={!selected} onClick={() => onStepChange(2)}>Continuar al método →</button></div></div>}
          {paymentStep === 2 && <form className="payment-stage" onSubmit={onSubmit}><p className="eyebrow">Paso 2 de 3</p><h2>Selecciona cómo pagar</h2>
            {selected && <div className="compact-payment-summary"><div><strong>{selected.espacio}</strong><small>{selected.fecha} · {String(selected.horaInicio).slice(0, 5)} - {String(selected.horaFin).slice(0, 5)} ({paymentHours} h)</small></div><strong>{formatCurrency(paymentTotal)}</strong></div>}
            <fieldset className="payment-methods visual-methods"><legend>Método de pago</legend>{paymentOptions.map(([value, icon, title, help]) => <label className={paymentMethod === value ? 'selected' : ''} key={value}><input type="radio" name="metodo" value={value} checked={paymentMethod === value} onChange={(event) => onMethodChange(event.target.value)} /><i>{icon}</i><span><strong>{title}</strong><small>{help}</small></span><b>{paymentMethod === value ? '✓' : ''}</b></label>)}</fieldset>
            {paymentMethod === 'TARJETA_MOCK' && <div className="method-instructions card-demo"><span>SIMULACIÓN</span><strong>•••• •••• •••• 2026</strong><small>No se solicitarán datos de una tarjeta real.</small></div>}
            {paymentMethod === 'TRANSFERENCIA' && <div className="method-instructions"><strong>Transferencia de demostración</strong><p>Banco Nacional · Cuenta institucional simulada</p><small>Utiliza la referencia de reserva #{selected?.id}. Un administrador deberá verificarla.</small></div>}
            {paymentMethod === 'EFECTIVO' && <div className="method-instructions"><strong>Pago en recepción</strong><p>Presenta el número de reserva #{selected?.id} y un documento de identificación.</p><small>La reserva permanecerá pendiente hasta registrar el pago.</small></div>}
            <div className="wizard-actions"><button type="button" className="secondary-button" onClick={() => onStepChange(1)}>← Volver</button><button className="primary-button" disabled={paying}>{paying ? 'Procesando…' : paymentMethod === 'TARJETA_MOCK' ? 'Confirmar pago simulado' : 'Registrar método'}</button></div>{message && <p className={paymentResult ? 'form-message' : 'form-error'}>{message}</p>}</form>}
          {paymentStep === 3 && <div className="payment-stage payment-finish"><div className="success-check">✓</div><p className="eyebrow">Paso 3 de 3</p><h2>{paymentResult?.estado === 'APROBADO' ? 'Reserva confirmada' : 'Solicitud registrada'}</h2><p>{paymentResult?.estado === 'APROBADO' ? 'El pago de demostración fue aprobado inmediatamente.' : 'El método quedó pendiente de verificación administrativa.'}</p>{paymentResult && <div className="finish-receipt"><span>Referencia<strong>{paymentResult.referencia}</strong></span><span>Total<strong>{formatCurrency(paymentResult.monto)}</strong></span><span>Estado<strong>{formatStatus(paymentResult.estado)}</strong></span></div>}<div className="wizard-actions centered"><button className="secondary-button" onClick={() => { onStepChange(1); onResultChange(null) }}>Realizar otro pago</button><button className="primary-button" onClick={onNavigateReservations}>Ver mis reservas</button></div></div>}
        </section>
        <aside className="payment-history-modern"><div><p className="eyebrow">Historial</p><h2>Pagos registrados</h2></div>{payments.length === 0 ? <p className="payment-empty">Aún no hay pagos.</p> : payments.slice(0, 6).map((payment) => <article key={payment.id}><div><strong>{payment.referencia}</strong><small>Reserva #{payment.reservaId} · {payment.metodo.replace('_MOCK', '')}</small>{payment.estado === 'APROBADO' && <button onClick={() => onDownloadReceipt(payment)}>Comprobante PDF</button>}</div><div><strong>{formatCurrency(payment.monto)}</strong><span className={`payment-status ${payment.estado.toLowerCase()}`}>{formatStatus(payment.estado)}</span></div></article>)}</aside>
      </div>
    </main>
  )
}
