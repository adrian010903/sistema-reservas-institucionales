import { useState } from 'react'

export default function PasswordField({ label, ...inputProps }) {
  const [visible, setVisible] = useState(false)

  return (
    <label className="password-field">
      <span>{label}</span>
      <span className="password-control">
        <input {...inputProps} type={visible ? 'text' : 'password'} />
        <button
          type="button"
          className="password-visibility"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.2A10.8 10.8 0 0112 4c5.5 0 9 5 9 5a15.7 15.7 0 01-2.2 2.6M6.2 6.2C4.2 7.5 3 9 3 9s3.5 5 9 5c1 0 1.9-.2 2.8-.4" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5z" /><circle cx="12" cy="12" r="2.5" /></svg>
          )}
        </button>
      </span>
    </label>
  )
}
