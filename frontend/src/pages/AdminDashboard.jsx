export default function AdminDashboard({
  user,
  adminReservations,
  adminPayments,
  adminUsers,
  spaces,
  places,
  showDemoControls,
  reportSummary,
  message,
  reportSections,
  spaceUsageSlide,
  autoRotateCharts,
  setAdminTab,
  navigate,
  setReportSections,
  setAutoRotateCharts,
  setSpaceUsageSlide,
}) {
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
          <p>Hola, {user?.nombre?.trim()}. Supervisa reservas, pagos y capacidad desde un solo lugar.</p>
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
