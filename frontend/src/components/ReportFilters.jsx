const EMPTY_FILTERS = { desde: '', hasta: '', estado: '', lugarId: '', espacioId: '' }
const RESERVATION_STATES = ['PENDIENTE', 'APROBADA', 'CONFIRMADA', 'CANCELADA', 'RECHAZADA']

export default function ReportFilters({ filters, places, spaces, onChange }) {
  const update = (changes) => onChange({ ...filters, ...changes })
  const filteredSpaces = spaces.filter((space) => !filters.lugarId || String(space.lugarId) === String(filters.lugarId))

  return (
    <section className="report-filter-panel">
      <div><p className="eyebrow">Análisis institucional</p><h2>Filtrar estadísticas</h2><p>Los indicadores y las descargas utilizan el mismo período y selección.</p></div>
      <div className="report-filter-grid">
        <label>Desde<input type="date" value={filters.desde} onChange={(event) => update({ desde: event.target.value })} /></label>
        <label>Hasta<input type="date" value={filters.hasta} onChange={(event) => update({ hasta: event.target.value })} /></label>
        <label>Estado<select value={filters.estado} onChange={(event) => update({ estado: event.target.value })}><option value="">Todos</option>{RESERVATION_STATES.map((state) => <option key={state}>{state}</option>)}</select></label>
        <label>Lugar<select value={filters.lugarId} onChange={(event) => update({ lugarId: event.target.value, espacioId: '' })}><option value="">Todos los lugares</option>{places.map((place) => <option key={place.id} value={place.id}>{place.nombre}</option>)}</select></label>
        <label>Espacio<select value={filters.espacioId} onChange={(event) => update({ espacioId: event.target.value })}><option value="">Todos los espacios</option>{filteredSpaces.map((space) => <option key={space.id} value={space.id}>{space.nombre}</option>)}</select></label>
        <button type="button" className="secondary-button" onClick={() => onChange(EMPTY_FILTERS)}>Limpiar filtros</button>
      </div>
      {filters.desde && filters.hasta && filters.desde > filters.hasta && <p className="form-error">La fecha inicial no puede ser posterior a la fecha final.</p>}
    </section>
  )
}
