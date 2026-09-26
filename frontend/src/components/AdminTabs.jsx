const ADMIN_SECTIONS = [
  ['reservas', 'Reservas'],
  ['pagos', 'Pagos'],
  ['usuarios', 'Usuarios'],
  ['precios', 'Precios'],
  ['reportes', 'Reportes'],
  ['auditoria', 'Bitácora'],
]

export default function AdminTabs({ value, onChange, showDemoControls }) {
  const sections = showDemoControls ? ADMIN_SECTIONS : ADMIN_SECTIONS.filter(([key]) => key === 'usuarios')
  return (
    <div className="admin-tabs">
      <select className="admin-tabs-mobile" aria-label="Sección de administración" value={value} onChange={(event) => onChange(event.target.value)}>
        {sections.map(([key, label]) => <option value={key} key={key}>{label}</option>)}
      </select>
      {sections.map(([key, label]) => <button className={value === key ? 'active' : ''} key={key} onClick={() => onChange(key)}>{label}</button>)}
    </div>
  )
}
