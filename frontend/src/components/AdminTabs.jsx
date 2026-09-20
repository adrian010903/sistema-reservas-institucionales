const ADMIN_SECTIONS = [
  ['reservas', 'Reservas'],
  ['pagos', 'Pagos'],
  ['usuarios', 'Usuarios'],
  ['precios', 'Precios'],
  ['reportes', 'Reportes'],
  ['auditoria', 'Bitácora'],
]

export default function AdminTabs({ value, onChange }) {
  return (
    <div className="admin-tabs">
      <select className="admin-tabs-mobile" aria-label="Sección de administración" value={value} onChange={(event) => onChange(event.target.value)}>
        {ADMIN_SECTIONS.map(([key, label]) => <option value={key} key={key}>{label}</option>)}
      </select>
      {ADMIN_SECTIONS.map(([key, label]) => <button className={value === key ? 'active' : ''} key={key} onClick={() => onChange(key)}>{label}</button>)}
    </div>
  )
}
