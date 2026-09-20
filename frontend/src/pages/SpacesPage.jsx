import { BACKEND } from '../services/api'
import { AvailabilityDateStrip } from '../components/ReservationSchedule'

export default function SpacesPage({
  user, places, spaces, selectedPlaceId, availabilityForm, availabilityTypeId, availableSpaceIds, types, message, showDemoControls,
  onPlaceChange, onAvailabilityChange, onTypeChange, onCheckAvailability, onClearAvailability, onCreatePlace, onCreateSpace,
  onEditPlace, onDeletePlace, onEditSpace, onDeleteSpace, onReserve,
}) {
  const isAdmin = user && ['ADMIN', 'SUPERADMIN'].includes(user.rol)
  const currentPlace = places.find((place) => String(place.id) === String(selectedPlaceId))
  const visibleSpaces = (selectedPlaceId === 'sin-lugar' ? spaces.filter((space) => !space.lugarId) : spaces.filter((space) => String(space.lugarId) === String(selectedPlaceId))).filter((space) => availableSpaceIds === null || availableSpaceIds.includes(space.id))
  const updateAvailability = (field, value) => onAvailabilityChange({ ...availabilityForm, [field]: value })

  return (
    <main className="page-container">
      <p className="eyebrow">Catálogo institucional</p>
      <div className="catalog-title"><div><h1>Lugares y espacios</h1><p>Primero selecciona un lugar para consultar sus espacios reservables.</p></div>
        {isAdmin && <div className="catalog-admin-actions"><button className="secondary-button" onClick={onCreatePlace}>+ Crear lugar</button><button className="primary-button" disabled={!places.some((place) => place.estado === 'ACTIVO')} onClick={onCreateSpace}>+ Crear espacio</button></div>}
      </div>
      {message && <p className="form-message">{message}</p>}
      <div className="place-selector">
        {places.map((place, index) => <article className={`place-card place-tone-${index % 3} ${String(selectedPlaceId) === String(place.id) ? 'selected' : ''} ${place.estado === 'INACTIVO' ? 'inactive' : ''}`} style={place.imagenUrl ? { backgroundImage: `linear-gradient(0deg,rgba(35,13,75,.88),rgba(35,13,75,.2)),url(${BACKEND}${place.imagenUrl})` } : undefined} key={place.id}>
          <button className="place-select-button" onClick={() => onPlaceChange(place.id)}><span>⌂</span><strong>{place.nombre}</strong><small>{place.descripcion || place.direccion || 'Lugar institucional'}</small><b>{spaces.filter((space) => space.lugarId === place.id).length} espacios</b></button>
          {isAdmin && <div className="card-admin-actions"><button onClick={() => onEditPlace(place)}>Editar</button>{showDemoControls && <button className="danger" disabled={place.estado === 'INACTIVO'} onClick={() => onDeletePlace(place)}>Eliminar</button>}</div>}
        </article>)}
        {isAdmin && spaces.some((space) => !space.lugarId) && <article className={`place-card unassigned ${selectedPlaceId === 'sin-lugar' ? 'selected' : ''}`}><button className="place-select-button" onClick={() => onPlaceChange('sin-lugar')}><span>!</span><strong>Sin lugar asignado</strong><small>Espacios que debes organizar</small><b>{spaces.filter((space) => !space.lugarId).length} espacios</b></button></article>}
      </div>
      {places.length === 0 && !(isAdmin && spaces.some((space) => !space.lugarId)) ? <div className="catalog-empty"><strong>Aún no hay lugares registrados</strong><span>Un administrador debe crear primero Sede Nacional, Campo Escuela, Hostel u otro lugar.</span></div> : (
        <section className="place-section">
          <div className="place-heading"><div className="place-symbol">⌂</div><div><h2>{selectedPlaceId === 'sin-lugar' ? 'Sin lugar asignado' : currentPlace?.nombre || 'Selecciona un lugar'}</h2><span>{visibleSpaces.length} espacio(s)</span></div>{isAdmin && currentPlace && <div className="place-heading-actions"><button onClick={() => onEditPlace(currentPlace)}>Editar lugar</button>{showDemoControls && <button className="danger" disabled={currentPlace.estado === 'INACTIVO'} onClick={() => onDeletePlace(currentPlace)}>Eliminar lugar</button>}</div>}</div>
          {selectedPlaceId !== 'sin-lugar' && <><AvailabilityDateStrip value={availabilityForm.fecha} onChange={(fecha) => { updateAvailability('fecha', fecha); onClearAvailability(false) }} />
            <form className="availability-bar" onSubmit={onCheckAvailability}>
              <label className="availability-date-input">Fecha<input type="date" required value={availabilityForm.fecha} onChange={(event) => updateAvailability('fecha', event.target.value)} /></label>
              <label>Desde<input type="time" min="08:00" max="17:00" required value={availabilityForm.horaInicio} onChange={(event) => updateAvailability('horaInicio', event.target.value)} /></label>
              <label>Hasta<input type="time" min="08:00" max="17:00" required value={availabilityForm.horaFin} onChange={(event) => updateAvailability('horaFin', event.target.value)} /></label>
              <label>Tipo<select value={availabilityTypeId} onChange={(event) => onTypeChange(event.target.value)}><option value="">Todos</option>{types.map((type) => <option key={type.id} value={type.id}>{type.nombre}</option>)}</select></label>
              <label>Personas<input type="number" min="1" required value={availabilityForm.cantidadPersonas} onChange={(event) => updateAvailability('cantidadPersonas', event.target.value)} /></label>
              <button className="primary-button">Consultar disponibilidad</button>
              {availableSpaceIds !== null && <button type="button" className="secondary-button" onClick={() => onClearAvailability(true)}>Limpiar</button>}
            </form></>}
          {visibleSpaces.length === 0 ? <div className="catalog-empty"><strong>{availableSpaceIds === null ? 'Este lugar todavía no tiene espacios' : 'No hay espacios disponibles'}</strong><span>{availableSpaceIds === null ? (isAdmin ? 'Usa “Crear espacio” para agregar el primero.' : 'Pronto se agregarán espacios reservables.') : 'Prueba otra fecha, horario o cantidad de personas.'}</span></div> : <div className="space-list">{visibleSpaces.map((space, index) => <article className={`space-card space-tone-${index % 3} ${space.estado === 'INACTIVO' ? 'inactive' : ''}`} key={space.id}>
            <div className="space-image" style={space.imagenUrl ? { backgroundImage: `linear-gradient(0deg, rgba(19,24,43,.5), rgba(19,24,43,.08)), url(${BACKEND}${space.imagenUrl})` } : undefined}><span>{space.tipo}</span>{space.estado !== 'DISPONIBLE' && <b>{space.estado}</b>}</div>
            <div className="space-info"><h3>{space.nombre}</h3><p>{space.descripcion}</p><small>Capacidad: {space.capacidad} · {space.categoria}</small><div className="space-actions"><button className="primary-button" disabled={space.estado !== 'DISPONIBLE'} onClick={() => onReserve(space)}>{space.estado === 'DISPONIBLE' ? 'Reservar' : 'No disponible'}</button>{isAdmin && <><button className="edit-space-button" onClick={() => onEditSpace(space)}>Editar</button>{showDemoControls && <button className="delete-space-button" disabled={space.estado === 'INACTIVO'} onClick={() => onDeleteSpace(space)}>Eliminar</button>}</>}</div></div>
          </article>)}</div>}
        </section>
      )}
    </main>
  )
}
