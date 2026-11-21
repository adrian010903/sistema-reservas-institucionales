import AdminTabs from '../components/AdminTabs'
import PasswordField from '../components/PasswordField'
import ReportFilters from '../components/ReportFilters'
import ReportMetrics from '../components/ReportMetrics'
import TroubleshootingPanel from '../components/TroubleshootingPanel'

const ADMIN_PAGE_SIZE = 10

function AdminPagination({ page, totalPages, totalItems, onPageChange }) {
  const firstVisible = totalItems ? (page - 1) * ADMIN_PAGE_SIZE + 1 : 0
  const lastVisible = Math.min(page * ADMIN_PAGE_SIZE, totalItems)
  const visiblePages = Array.from(
    { length: Math.max(0, Math.min(totalPages, page + 1) - Math.max(1, page - 1) + 1) },
    (_, index) => Math.max(1, page - 1) + index,
  )

  return (
    <nav className="admin-pagination" aria-label="Paginación de registros">
      <span>Mostrando <strong>{firstVisible}–{lastVisible}</strong> de <strong>{totalItems}</strong></span>
      <div className="admin-pagination-controls">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Anterior</button>
        {visiblePages[0] > 1 && <><button type="button" onClick={() => onPageChange(1)}>1</button>{visiblePages[0] > 2 && <span aria-hidden="true">…</span>}</>}
        {visiblePages.map((pageNumber) => <button type="button" key={pageNumber} className={pageNumber === page ? 'active' : ''} aria-current={pageNumber === page ? 'page' : undefined} onClick={() => onPageChange(pageNumber)}>{pageNumber}</button>)}
        {visiblePages.at(-1) < totalPages && <>{visiblePages.at(-1) < totalPages - 1 && <span aria-hidden="true">…</span>}<button type="button" onClick={() => onPageChange(totalPages)}>{totalPages}</button></>}
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Siguiente</button>
      </div>
    </nav>
  )
}

export default function AdminPage({
  user,
  adminTab,
  setAdminTab,
  adminPages,
  setAdminPages,
  adminFilters,
  setAdminFilters,
  adminReservations,
  adminPayments,
  adminUsers,
  auditEntries,
  auth,
  message,
  setMessage,
  showDemoControls,
  showSprint2,
  hourlyRate,
  rateForm,
  setRateForm,
  savingRate,
  saveRate,
  reviewAdminReservation,
  reviewAdminPayment,
  updateAdminUser,
  createAdminUser,
  deleteAdminUser,
  savingUser,
  showUserCreator,
  setShowUserCreator,
  reportSummary,
  reportFilters,
  setReportFilters,
  reportSections,
  setReportSections,
  places,
  spaces,
  downloadReservationsReport,
}) {
  const reportMonths = Object.entries(reportSummary.porMes || {})
  const topUsedSpaces = (reportSummary.espaciosUso || []).slice(0, 6)
  const topUsedPlaces = (reportSummary.lugaresUso || []).slice(0, 6)
  const maxSpaceHours = Math.max(0, ...topUsedSpaces.map((item) => Number(item.horas) || 0))
  const maxPlaceHours = Math.max(0, ...topUsedPlaces.map((item) => Number(item.horas) || 0))
  const seasonUsage = Object.entries(reportSummary.porTemporada || {})
  const maxSeasonHours = Math.max(0, ...seasonUsage.map(([, value]) => Number(value) || 0))
  const relativeBarWidth = (value, maximum) => Number(value) > 0
    ? `${Math.max(2, (Number(value) / Math.max(maximum, 1)) * 100)}%`
    : '0%'
  const activeReportMonths = reportMonths.filter(([, hours]) => hours > 0)
  const busiestMonth = activeReportMonths.reduce((best, current) => !best || current[1] > best[1] ? current : best, null)
  const quietestMonth = activeReportMonths.reduce((best, current) => !best || current[1] < best[1] ? current : best, null)
  const leastUsedSpace = reportSummary.espaciosUso?.at(-1)
  const busiestDay = Object.entries(reportSummary.porDiaSemana || {}).reduce((best, current) => !best || current[1] > best[1] ? current : best, null)
  const busiestHour = Object.entries(reportSummary.porHoraInicio || {}).reduce((best, current) => !best || current[1] > best[1] ? current : best, null)
  const variationLabel = (value) => reportSummary.tienePeriodoAnterior
    ? `${Number(value) > 0 ? '+' : ''}${Number(value || 0)}%`
    : 'Sin datos anteriores para comparar'
  const filteredAdminReservations = adminReservations.filter((reservation) => !adminFilters.reserva || [reservation.id, reservation.espacio, reservation.correoUsuario, reservation.estado].join(' ').toLowerCase().includes(adminFilters.reserva.toLowerCase()))
  const filteredAdminPayments = adminPayments.filter((payment) => !adminFilters.pago || [payment.referencia, payment.reservaId, payment.estado, payment.metodo].join(' ').toLowerCase().includes(adminFilters.pago.toLowerCase()))
  const filteredAdminUsers = adminUsers.filter((target) => !adminFilters.usuario || [target.nombre, target.correo, target.rol, target.estado].join(' ').toLowerCase().includes(adminFilters.usuario.toLowerCase()))
  const filteredAuditEntries = auditEntries.filter((entry) => !adminFilters.bitacora || [entry.actor, entry.accion, entry.recurso, entry.recursoId, entry.detalle].join(' ').toLowerCase().includes(adminFilters.bitacora.toLowerCase()))
  const paginateAdminRows = (items, section) => {
    const totalPages = Math.max(1, Math.ceil(items.length / ADMIN_PAGE_SIZE))
    const currentPage = Math.min(adminPages[section] || 1, totalPages)
    const startIndex = (currentPage - 1) * ADMIN_PAGE_SIZE
    return { items: items.slice(startIndex, startIndex + ADMIN_PAGE_SIZE), currentPage, totalPages, totalItems: items.length }
  }
  const reservationPage = paginateAdminRows(filteredAdminReservations, 'reservas')
  const paymentPage = paginateAdminRows(filteredAdminPayments, 'pagos')
  const userPage = paginateAdminRows(filteredAdminUsers, 'usuarios')
  const auditPage = paginateAdminRows(filteredAuditEntries, 'auditoria')
  return (
    <main className="page-container admin-page">
      <p className="eyebrow">Acceso administrativo</p>
      <h1>Administración</h1>
      <AdminTabs value={adminTab} showDemoControls={showDemoControls} onChange={(tab) => { setAdminTab(tab); setAdminPages((current) => ({ ...current, [tab]: 1 })); setMessage('') }} />
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
                  {
                    setAdminFilters({ ...adminFilters, reserva: e.target.value })
                    setAdminPages((current) => ({ ...current, reservas: 1 }))
                  }
                }
              />
            </label>
            <button type="button" onClick={() => { setAdminFilters({ ...adminFilters, reserva: '' }); setAdminPages((current) => ({ ...current, reservas: 1 })) }}>
              Limpiar
            </button>
          </div>
          <div className="admin-table-head">
            <span>Reserva</span>
            <span>Usuario</span>
            <span>Fecha</span>
            <span>Estado / Acciones</span>
          </div>
          {filteredAdminReservations.length === 0 ? (
            <p className="admin-empty">{adminReservations.length === 0 ? 'No hay reservas registradas.' : 'No hay reservas que coincidan con la búsqueda.'}</p>
          ) : (
            reservationPage.items.map((reservation) => (
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
          {filteredAdminReservations.length > 0 && <AdminPagination page={reservationPage.currentPage} totalPages={reservationPage.totalPages} totalItems={reservationPage.totalItems} onPageChange={(nextPage) => setAdminPages((current) => ({ ...current, reservas: nextPage }))} />}
        </div>
      )}
      {adminTab === 'pagos' && (
        <div className="admin-table payments-admin">
          <div className="admin-filter-bar">
            <label>
              Buscar pago o reserva
              <input value={adminFilters.pago} placeholder="Referencia, reserva o estado…" onChange={(e) => { setAdminFilters({ ...adminFilters, pago: e.target.value }); setAdminPages((current) => ({ ...current, pagos: 1 })) }} />
            </label>
            <button type="button" onClick={() => { setAdminFilters({ ...adminFilters, pago: '' }); setAdminPages((current) => ({ ...current, pagos: 1 })) }}>
              Limpiar
            </button>
          </div>
          <div className="admin-table-head">
            <span>Referencia</span>
            <span>Reserva</span>
            <span>Monto</span>
            <span>Estado / Acciones</span>
          </div>
          {filteredAdminPayments.length === 0 ? (
            <p className="admin-empty">{adminPayments.length === 0 ? 'No hay pagos registrados.' : 'No hay pagos que coincidan con la búsqueda.'}</p>
          ) : (
            paymentPage.items.map((payment) => (
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
          {filteredAdminPayments.length > 0 && <AdminPagination page={paymentPage.currentPage} totalPages={paymentPage.totalPages} totalItems={paymentPage.totalItems} onPageChange={(nextPage) => setAdminPages((current) => ({ ...current, pagos: nextPage }))} />}
        </div>
      )}
      {adminTab === 'usuarios' && (
        <div className="admin-table users-admin">
          <div className="admin-users-toolbar">
            <div>
              <strong>Usuarios registrados</strong>
              <small>Crea cuentas y administra sus permisos de acceso.</small>
            </div>
            <button className="primary-button" type="button" onClick={() => { setShowUserCreator((visible) => !visible); setMessage('') }}>
              {showUserCreator ? 'Cancelar' : '+ Registrar usuario'}
            </button>
          </div>
          {showUserCreator && (
            <form className="admin-user-form" onSubmit={createAdminUser}>
              <label>
                Nombre completo
                <input name="nombre" maxLength="120" required autoFocus placeholder="Ej. María Rodríguez" />
              </label>
              <label>
                Correo electrónico
                <input name="correo" type="email" maxLength="160" required placeholder="correo@ejemplo.com" />
              </label>
              <PasswordField label="Contraseña temporal" name="password" minLength="8" maxLength="72" required placeholder="Mayúscula, minúscula y número" />
              <label>
                Rol
                <select name="rol" defaultValue="USUARIO">
                  <option value="USUARIO">Usuario</option>
                  {user?.rol === 'SUPERADMIN' && <option value="ADMIN">Administrador</option>}
                </select>
              </label>
              <label>
                Estado inicial
                <select name="estado" defaultValue="ACTIVO">
                  <option value="ACTIVO">Activo</option>
                  <option value="INACTIVO">Inactivo</option>
                  <option value="BLOQUEADO">Bloqueado</option>
                </select>
              </label>
              <button className="primary-button" disabled={savingUser}>
                {savingUser ? 'Registrando…' : 'Crear cuenta'}
              </button>
            </form>
          )}
          <div className="admin-filter-bar">
            <label>
              Buscar usuario
              <input
                value={adminFilters.usuario}
                placeholder="Nombre, correo, rol…"
                onChange={(e) =>
                  {
                    setAdminFilters({ ...adminFilters, usuario: e.target.value })
                    setAdminPages((current) => ({ ...current, usuarios: 1 }))
                  }
                }
              />
            </label>
            <button type="button" onClick={() => { setAdminFilters({ ...adminFilters, usuario: '' }); setAdminPages((current) => ({ ...current, usuarios: 1 })) }}>
              Limpiar
            </button>
          </div>
          <div className="admin-table-head">
            <span>Usuario</span>
            <span>Correo</span>
            <span>Rol</span>
            <span>Estado</span>
          </div>
          {filteredAdminUsers.length === 0 ? (
            <p className="admin-empty">{adminUsers.length === 0 ? 'No hay usuarios registrados.' : 'No hay usuarios que coincidan con la búsqueda.'}</p>
          ) : userPage.items.map((target) => (
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
                {showSprint2 && <div className="admin-row-actions">
                  <button className="danger" disabled={target.id === user?.id || (user?.rol !== 'SUPERADMIN' && target.rol !== 'USUARIO')} onClick={() => deleteAdminUser(target)}>
                    Eliminar
                  </button>
                </div>}
              </article>
            ))}
          {filteredAdminUsers.length > 0 && <AdminPagination page={userPage.currentPage} totalPages={userPage.totalPages} totalItems={userPage.totalItems} onPageChange={(nextPage) => setAdminPages((current) => ({ ...current, usuarios: nextPage }))} />}
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
              <p className="chart-unit-note">Horas reservadas · barra relativa al máximo del panel</p>
              {topUsedSpaces.map((item) => (
                <div className="chart-row" key={item.id}>
                  <span title={item.nombre}>{item.nombre}</span>
                  <div>
                    <i style={{ width: relativeBarWidth(item.horas, maxSpaceHours) }} />
                  </div>
                  <strong>{item.horas} h</strong>
                </div>
              ))}
              {!reportSummary.espaciosUso?.length && <p>No hay datos todavía.</p>}
            </section>
            <section className="report-chart">
              <h2>Uso por lugar / oficina</h2>
              <p className="chart-unit-note">Horas reservadas · barra relativa al máximo del panel</p>
              {topUsedPlaces.map((item) => (
                <div className="chart-row" key={item.id}>
                  <span title={item.nombre}>{item.nombre}</span>
                  <div>
                    <i style={{ width: relativeBarWidth(item.horas, maxPlaceHours) }} />
                  </div>
                  <strong>{item.horas} h</strong>
                </div>
              ))}
              {!reportSummary.lugaresUso?.length && <p>No hay lugares para mostrar.</p>}
            </section>
            <section className="report-chart">
              <h2>Uso por temporada</h2>
              <p className="chart-unit-note">Horas reservadas · barra relativa al máximo del panel</p>
              {seasonUsage.map(([name, hours]) => (
                <div className="chart-row" key={name}>
                  <span>{name}</span>
                  <div>
                    <i style={{ width: relativeBarWidth(hours, maxSeasonHours) }} />
                  </div>
                  <strong>{hours} h</strong>
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
          <div className="admin-filter-bar">
            <label>
              Buscar en la bitácora
              <input value={adminFilters.bitacora} placeholder="Actor, acción, recurso o detalle…" onChange={(event) => { setAdminFilters({ ...adminFilters, bitacora: event.target.value }); setAdminPages((current) => ({ ...current, auditoria: 1 })) }} />
            </label>
            <button type="button" onClick={() => { setAdminFilters({ ...adminFilters, bitacora: '' }); setAdminPages((current) => ({ ...current, auditoria: 1 })) }}>Limpiar</button>
          </div>
          <div className="admin-table-head">
            <span>Fecha</span>
            <span>Actor</span>
            <span>Acción</span>
            <span>Recurso / Detalle</span>
          </div>
          {filteredAuditEntries.length === 0 ? (
            <p className="admin-empty">{auditEntries.length === 0 ? 'Aún no hay operaciones registradas en la bitácora.' : 'No hay registros que coincidan con la búsqueda.'}</p>
          ) : (
            auditPage.items.map((entry) => (
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
          {filteredAuditEntries.length > 0 && <AdminPagination page={auditPage.currentPage} totalPages={auditPage.totalPages} totalItems={auditPage.totalItems} onPageChange={(nextPage) => setAdminPages((current) => ({ ...current, auditoria: nextPage }))} />}
        </div>
      )}
      {adminTab === 'diagnostico' && <TroubleshootingPanel auth={auth} />}
    </main>
  )
}
