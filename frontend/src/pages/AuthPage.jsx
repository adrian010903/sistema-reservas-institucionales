import PasswordField from '../components/PasswordField'

export default function AuthPage({
  authMode,
  message,
  recoveryToken,
  returnPage,
  onLogin,
  onRegister,
  onRequestRecovery,
  onConfirmRecovery,
  onModeChange,
  onMessageChange,
  onBack,
}) {
  const clearAndChangeMode = (mode) => {
    onModeChange(mode)
    onMessageChange('')
  }

  return (
    <main className="auth-shell">
      {authMode === 'login' && (
        <form className="auth-card" onSubmit={onLogin}>
          <button className="link-button auth-back-link" type="button" onClick={() => onBack(returnPage)}>Volver</button>
          <p className="eyebrow">Acceso institucional</p>
          <h1>Iniciar sesión</h1>
          <label>Correo<input name="correo" type="email" required /></label>
          <PasswordField label="Contraseña" name="password" required />
          {message && <p className={message.includes('exitoso') || message.includes('restablecida') ? 'form-message' : 'form-error'}>{message}</p>}
          <button className="primary-button">Entrar</button>
          <div className="auth-links">
            <button type="button" onClick={() => clearAndChangeMode('register')}>Crear cuenta</button>
            <button type="button" onClick={() => clearAndChangeMode('recover')}>Olvidé mi contraseña</button>
          </div>
        </form>
      )}
      {authMode === 'register' && (
        <form className="auth-card" onSubmit={onRegister}>
          <p className="eyebrow">Nueva cuenta</p>
          <h1>Registrarse</h1>
          <label>Nombre<input name="nombre" required maxLength="120" /></label>
          <label>Correo<input name="correo" type="email" required /></label>
          <PasswordField label="Contraseña" name="password" minLength="8" maxLength="72" required />
          <PasswordField label="Confirmar contraseña" name="confirmacion" minLength="8" maxLength="72" required />
          {message && <p className="form-error">{message}</p>}
          <button className="primary-button">Crear cuenta</button>
          <button className="link-button" type="button" onClick={() => clearAndChangeMode('login')}>Ya tengo una cuenta</button>
        </form>
      )}
      {authMode === 'recover' && (
        <form className="auth-card" onSubmit={onRequestRecovery}>
          <p className="eyebrow">Recuperación</p>
          <h1>Recuperar acceso</h1>
          <p>Ingresa el correo asociado a tu cuenta.</p>
          <label>Correo<input name="correo" type="email" required /></label>
          {message && <p className="form-error">{message}</p>}
          <button className="primary-button">Generar solicitud</button>
          <button className="link-button" type="button" onClick={() => onModeChange('login')}>Volver al acceso</button>
        </form>
      )}
      {authMode === 'reset' && (
        <form className="auth-card" onSubmit={onConfirmRecovery}>
          <p className="eyebrow">Nueva contraseña</p>
          <h1>Restablecer</h1>
          <label>Token<input name="token" required defaultValue={recoveryToken} /></label>
          <PasswordField label="Nueva contraseña" name="passwordNuevo" minLength="8" maxLength="72" required />
          <PasswordField label="Confirmar contraseña" name="confirmacion" minLength="8" maxLength="72" required />
          {message && <p className={recoveryToken ? 'form-message' : 'form-error'}>{message}</p>}
          <button className="primary-button">Guardar contraseña</button>
          <button className="link-button" type="button" onClick={() => onModeChange('login')}>Cancelar</button>
        </form>
      )}
    </main>
  )
}
