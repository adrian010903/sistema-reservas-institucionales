import PasswordField from '../components/PasswordField'

export default function ProfilePage({ user, message, onUpdateProfile, onChangePassword }) {
  return (
    <main className="page-container profile-page">
      <p className="eyebrow">Cuenta personal</p>
      <h1>Mi perfil</h1>
      <div className="profile-layout">
        <form className="profile-card" onSubmit={onUpdateProfile}>
          <h2>Información personal</h2><p>Actualiza el nombre y correo asociados a tu cuenta.</p>
          <label>Nombre<input name="nombre" required maxLength="120" defaultValue={user?.nombre} /></label>
          <label>Correo<input name="correo" type="email" required maxLength="160" defaultValue={user?.correo} /></label>
          <div className="profile-meta"><span>Rol</span><strong>{user?.rol}</strong><span>Estado</span><strong>{user?.estado}</strong></div>
          <button className="primary-button">Guardar perfil</button>
        </form>
        <form className="profile-card" onSubmit={onChangePassword}>
          <h2>Cambiar contraseña</h2><p>Utiliza al menos 8 caracteres y no repitas tu contraseña actual.</p>
          <PasswordField label="Contraseña actual" name="passwordActual" required />
          <PasswordField label="Nueva contraseña" name="passwordNuevo" minLength="8" maxLength="72" required />
          <PasswordField label="Confirmar contraseña" name="confirmacion" minLength="8" maxLength="72" required />
          <button className="primary-button">Actualizar contraseña</button>
        </form>
      </div>
      {message && <p className={message.includes('correct') || message.includes('actualiz') ? 'form-message' : 'form-error'}>{message}</p>}
    </main>
  )
}
