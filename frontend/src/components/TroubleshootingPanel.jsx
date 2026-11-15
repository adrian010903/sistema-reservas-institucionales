import { useCallback, useEffect, useState } from 'react'
import { API, readJson } from '../services/api'

const STATE_LABELS = {
  OK: 'Operativo',
  ALERTA: 'Requiere atención',
  OPCIONAL: 'Opcional',
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-CR', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function TroubleshootingPanel({ auth }) {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [resolvingId, setResolvingId] = useState(null)

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true)
    try {
      const response = await fetch(`${API}/admin/diagnostico`, { headers: auth })
      const data = await readJson(response)
      setSummary(data)
      setError('')
    } catch (requestError) {
      setError(requestError.message || 'No se pudo consultar el diagnóstico')
    } finally {
      setLoading(false)
      if (!silent) setRefreshing(false)
    }
  }, [auth])

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => refresh(), 0)
    const interval = window.setInterval(() => refresh(true), 30_000)
    return () => {
      window.clearTimeout(initialRefresh)
      window.clearInterval(interval)
    }
  }, [refresh])

  async function resolveIncident(id) {
    setResolvingId(id)
    try {
      const response = await fetch(`${API}/admin/diagnostico/incidentes/${id}/resolver`, {
        method: 'PATCH',
        headers: auth,
      })
      if (!response.ok) await readJson(response)
      await refresh(true)
    } catch (requestError) {
      setError(requestError.message || 'No se pudo cerrar el incidente')
    } finally {
      setResolvingId(null)
    }
  }

  const incidents = summary?.incidentes || []
  const openIncidents = incidents.filter((incident) => incident.estado === 'ABIERTO')
  const resolvedIncidents = incidents.filter((incident) => incident.estado === 'RESUELTO')

  return (
    <section className="troubleshooting-panel" aria-labelledby="troubleshooting-title">
      <header className="troubleshooting-header">
        <div>
          <p className="eyebrow">Operación del sistema</p>
          <h2 id="troubleshooting-title">Diagnóstico y soporte</h2>
          <p>Revisa el estado de servicios, incidentes recientes y recomendaciones para resolverlos.</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => refresh()} disabled={refreshing}>
          {refreshing ? 'Revisando…' : 'Actualizar ahora'}
        </button>
      </header>

      {error && <p className="diagnostic-error" role="alert">{error}</p>}
      {openIncidents.length > 0 && (
        <div className="diagnostic-alert" role="alert">
          <strong>{openIncidents.length} {openIncidents.length === 1 ? 'incidente abierto' : 'incidentes abiertos'}</strong>
          <span>El panel se actualiza automáticamente cada 30 segundos mientras permanezca abierto.</span>
        </div>
      )}

      <div className="diagnostic-summary-row">
        <article><small>Incidentes abiertos</small><strong>{summary?.incidentesAbiertos ?? '—'}</strong></article>
        <article><small>Verificaciones</small><strong>{summary?.verificaciones?.length ?? '—'}</strong></article>
        <article><small>Tiempo activo</small><strong>{summary ? `${Math.floor(summary.tiempoActivoSegundos / 3600)} h ${Math.floor((summary.tiempoActivoSegundos % 3600) / 60)} min` : '—'}</strong></article>
        <article><small>Última revisión</small><strong>{summary ? formatDate(summary.revisadoEn) : '—'}</strong></article>
      </div>

      <section className="diagnostic-section" aria-labelledby="diagnostic-checks-title">
        <div className="diagnostic-section-heading"><h3 id="diagnostic-checks-title">Estado de componentes</h3><span>Comprobaciones de solo lectura</span></div>
        {loading && !summary ? <p className="admin-empty">Consultando componentes…</p> : (
          <div className="diagnostic-check-grid">
            {(summary?.verificaciones || []).map((check) => (
              <article className="diagnostic-check" key={check.codigo}>
                <div><strong>{check.componente}</strong><span className={`diagnostic-state ${check.estado.toLowerCase()}`}>{STATE_LABELS[check.estado] || check.estado}</span></div>
                <p>{check.resumen}</p>
                {check.recomendacion && <small>{check.recomendacion}</small>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="diagnostic-section" aria-labelledby="diagnostic-open-title">
        <div className="diagnostic-section-heading"><h3 id="diagnostic-open-title">Incidentes abiertos</h3><span>Al corregir la causa, ciérralo para dejar constancia.</span></div>
        {openIncidents.length === 0 ? <p className="admin-empty">No hay incidentes abiertos.</p> : (
          <div className="diagnostic-incident-list">
            {openIncidents.map((incident) => (
              <article className="diagnostic-incident" key={incident.id}>
                <div className="diagnostic-incident-heading">
                  <div><span className="diagnostic-state alerta">{incident.severidad}</span><strong>{incident.titulo}</strong></div>
                  <small>{formatDate(incident.ultimaVez)} · {incident.ocurrencias} {incident.ocurrencias === 1 ? 'ocurrencia' : 'ocurrencias'}</small>
                </div>
                <p>{incident.componente}: {incident.resumen}</p>
                <p className="diagnostic-recommendation"><strong>Siguiente paso:</strong> {incident.recomendacion}</p>
                {incident.correlationId && <small className="diagnostic-reference">Referencia: <code>{incident.correlationId}</code>{incident.tipoTecnico && ` · ${incident.tipoTecnico}`}</small>}
                <button type="button" className="secondary-button" disabled={resolvingId === incident.id} onClick={() => resolveIncident(incident.id)}>
                  {resolvingId === incident.id ? 'Guardando…' : 'Marcar como resuelto'}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <details className="diagnostic-history" open={resolvedIncidents.length > 0}>
        <summary>Historial reciente ({resolvedIncidents.length} resueltos)</summary>
        {resolvedIncidents.length === 0 ? <p className="admin-empty">Los incidentes resueltos aparecerán aquí.</p> : (
          <div className="diagnostic-history-list">
            {resolvedIncidents.map((incident) => (
              <article key={incident.id}>
                <div><strong>{incident.titulo}</strong><span>{incident.codigo}</span></div>
                <small>{formatDate(incident.primeraVez)} – {formatDate(incident.resueltaEn)} · Resuelto por {incident.resueltaPor || 'Sistema'}</small>
                {incident.correlationId && <code>{incident.correlationId}</code>}
              </article>
            ))}
          </div>
        )}
      </details>

      <p className="diagnostic-privacy-note">Este panel nunca muestra claves ni guarda contraseñas, tokens o contenido de solicitudes. Si la base de datos está totalmente caída, revisa también los logs del servicio en Render porque el sistema no podrá guardar ese incidente.</p>
    </section>
  )
}
