// Ventanas emergentes del catálogo: crear o editar espacios y lugares, y confirmar su desactivación.

export function SpaceEditorModal({ space, places, types, categories, imagePreview, message, saving, onChange, onImageChange, onClose, onSubmit }) {
  return (
    <div className="custom-modal-overlay">
      <form className="custom-modal space-editor media-editor" onSubmit={onSubmit}>
        <button type="button" className="custom-modal-close" onClick={onClose}>
          ×
        </button>
        <p className="eyebrow">Administración</p>
        <h2>{space.id ? 'Editar espacio' : 'Crear espacio'}</h2>
        <div
          className="editor-media-preview"
          style={
            imagePreview
              ? {
                  backgroundImage: `linear-gradient(0deg,rgba(33,11,77,.55),transparent),url(${imagePreview})`,
                }
              : undefined
          }
        >
          <span>{imagePreview ? 'Vista previa' : 'Agrega una fotografía del espacio'}</span>
        </div>
        <div className="space-editor-grid">
          <label>
            Nombre
            <input required maxLength="120" value={space.nombre} onChange={(e) => onChange({ ...space, nombre: e.target.value })} />
          </label>
          <label>
            Capacidad
            <input
              required
              type="number"
              min="1"
              value={space.capacidad}
              onChange={(e) =>
                onChange({
                  ...space,
                  capacidad: e.target.value,
                })
              }
            />
          </label>
          <label className="full-field">
            Descripción
            <textarea
              maxLength="500"
              rows="3"
              value={space.descripcion || ''}
              onChange={(e) =>
                onChange({
                  ...space,
                  descripcion: e.target.value,
                })
              }
            />
          </label>
          <label>
            Lugar
            <select
              required
              value={space.lugarId}
              onChange={(e) =>
                onChange({
                  ...space,
                  lugarId: e.target.value,
                })
              }
            >
              <option value="">Seleccionar lugar</option>
              {places
                .filter((place) => place.estado === 'ACTIVO')
                .map((place) => (
                  <option key={place.id} value={place.id}>
                    {place.nombre}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Tipo
            <select required value={space.tipoId} onChange={(e) => onChange({ ...space, tipoId: e.target.value })}>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Categoría
            <select
              required
              value={space.categoriaId}
              onChange={(e) =>
                onChange({
                  ...space,
                  categoriaId: e.target.value,
                })
              }
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nombre}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select value={space.estado} onChange={(e) => onChange({ ...space, estado: e.target.value })}>
              <option value="DISPONIBLE">Disponible</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </label>
          <label className="file-field">
            Fotografía
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onImageChange(e.target.files[0] || null)} />
            <small>JPG, PNG o WEBP · máximo 5 MB</small>
          </label>
        </div>
        {message && <p className="form-error">{message}</p>}
        <div className="custom-modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-button" disabled={saving}>
            {saving ? 'Guardando…' : space.id ? 'Guardar cambios' : 'Crear espacio'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function PlaceEditorModal({ placeId, placeForm, imagePreview, message, saving, onChange, onImageChange, onClose, onSubmit }) {
  return (
    <div className="custom-modal-overlay">
      <form className="custom-modal media-editor" onSubmit={onSubmit}>
        <button type="button" className="custom-modal-close" onClick={onClose}>
          ×
        </button>
        <p className="eyebrow">Administración</p>
        <h2>{placeId ? 'Editar lugar' : 'Crear lugar'}</h2>
        <div
          className="editor-media-preview place-preview"
          style={
            imagePreview
              ? {
                  backgroundImage: `linear-gradient(0deg,rgba(33,11,77,.55),transparent),url(${imagePreview})`,
                }
              : undefined
          }
        >
          <span>{imagePreview ? 'Vista previa de portada' : 'Agrega una portada del lugar'}</span>
        </div>
        <div className="space-editor-grid">
          <label>
            Nombre
            <input required maxLength="120" placeholder="Ej. Hostel" value={placeForm.nombre} onChange={(e) => onChange({ ...placeForm, nombre: e.target.value })} />
          </label>
          <label>
            Estado
            <select value={placeForm.estado} onChange={(e) => onChange({ ...placeForm, estado: e.target.value })}>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
            </select>
          </label>
          <label className="full-field">
            Descripción
            <textarea rows="3" maxLength="500" value={placeForm.descripcion} onChange={(e) => onChange({ ...placeForm, descripcion: e.target.value })} />
          </label>
          <label className="full-field">
            Dirección
            <input maxLength="250" value={placeForm.direccion} onChange={(e) => onChange({ ...placeForm, direccion: e.target.value })} />
          </label>
          <label className="full-field file-field">
            Fotografía de portada
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onImageChange(e.target.files[0] || null)} />
            <small>JPG, PNG o WEBP · máximo 5 MB</small>
          </label>
        </div>
        {message && <p className="form-error">{message}</p>}
        <div className="custom-modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="primary-button" disabled={saving}>
            {saving ? 'Guardando…' : placeId ? 'Guardar cambios' : 'Crear lugar'}
          </button>
        </div>
      </form>
    </div>
  )
}

export function DeleteConfirmationModal({ target, onCancel, onConfirm }) {
  return (
    <div className="custom-modal-overlay">
      <section className="custom-modal confirmation-dialog">
        <div className="confirmation-icon">!</div>
        <p className="eyebrow">Confirmar acción</p>
        <h2>Desactivar {target.type === 'place' ? 'lugar' : 'espacio'}</h2>
        <p>
          ¿Deseas desactivar <strong>{target.item.nombre}</strong>? {target.type === 'place' ? 'Sus espacios dejarán de mostrarse públicamente.' : 'Ya no podrá reservarse mientras permanezca inactivo.'}
        </p>
        <div className="custom-modal-actions">
          <button className="secondary-button" onClick={onCancel}>
            Conservar
          </button>
          <button className="danger-confirm" onClick={onConfirm}>
            Sí, desactivar
          </button>
        </div>
      </section>
    </div>
  )
}
