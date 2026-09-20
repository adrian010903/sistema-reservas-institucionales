export default function ReportMetrics({ summary, leastUsedSpace }) {
  const metrics = [
    ['Total de reservas', summary.total || 0],
    ['Horas reservadas', `${summary.totalHoras || 0} h`],
    ['Ocupación estimada', `${summary.porcentajeOcupacion || 0}%`],
    ['Personas atendidas', summary.totalPersonas || 0],
    ['Reservas próximas', summary.proximas || 0],
    ['Menor demanda', leastUsedSpace?.nombre || 'Sin datos'],
    ['Promedio por reserva', `${summary.promedioPersonasPorReserva || 0} personas`],
    ['Porcentaje de cancelación', `${summary.porcentajeCancelacion || 0}%`],
  ]

  return <div className="report-metrics">{metrics.map(([label, value]) => <article key={label}><span>{label}</span><strong className={label === 'Menor demanda' ? 'metric-text' : undefined}>{value}</strong></article>)}</div>
}
