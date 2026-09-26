import { useEffect, useState } from 'react'
import { SocialLinks } from './Branding'

export default function Header({ user, page, navigate, logout, unreadCount, showDemoControls, onToggleDemoControls }) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    if (!menuOpen) return undefined
    const closeOnOutside = (event) => {
      if (!event.target?.closest?.('.module-menu')) setMenuOpen(false)
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  const items = user
    ? [['dashboard', 'Dashboard'], ['spaces', 'Espacios'], ['profile', 'Mi perfil']]
    : [['home', 'Inicio'], ['spaces', 'Espacios']]
  if (user && showDemoControls) items.push(
    ['reserve', 'Reservar'], ['reservations', 'Mis reservas'], ['payments', 'Pagos'],
    ['notifications', `Avisos${unreadCount ? ` (${unreadCount})` : ''}`],
  )
  if (user && ['ADMIN', 'SUPERADMIN'].includes(user.rol)) items.push(['admin', 'Administración'])
  const primaryItems = user ? items.slice(0, 2) : items
  const menuActive = items.some(([key]) => key === page) && !primaryItems.some(([key]) => key === page)
  const goTo = (key) => {
    setMenuOpen(false)
    navigate(key)
  }
  const renderNavItem = ([key, label]) => (
    <button className={`nav-link nav-${key} ${page === key ? 'active' : ''}`} key={key} onClick={() => goTo(key)}>
      <span className="nav-icon" aria-hidden="true">
        {key === 'home' && <svg viewBox="0 0 24 24" focusable="false"><path d="M3 10.8 12 3l9 7.8v9.2a1 1 0 0 1-1 1h-5.2v-6h-5.6v6H4a1 1 0 0 1-1-1z" /></svg>}
        {key === 'spaces' && <svg viewBox="0 0 24 24" focusable="false"><path d="M6 3.5h12v17l-6-3.4-6 3.4z" /></svg>}
      </span>
      <span>{label}</span>
      {key === 'spaces' && !user && <span className="nav-chevron" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="m6 9 6 6 6-6" /></svg></span>}
    </button>
  )

  return (
    <header className="app-nav">
      <button className="app-brand official-brand" aria-label="Ir al inicio" onClick={() => goTo(user ? 'dashboard' : 'home')}>
        <img src="/assets/logo-asociacion.png" alt="Guías y Scouts de Costa Rica — Institución Benemérita" />
      </button>
      <nav className={user ? 'authenticated-nav' : 'public-nav'}>
        {primaryItems.map(renderNavItem)}
        <div className="module-menu">
          <button className={`nav-link module-menu-trigger ${menuOpen || menuActive ? 'active' : ''}`} type="button" aria-haspopup="true" aria-expanded={menuOpen} onClick={() => setMenuOpen((current) => !current)}>
            <span>Menú</span><span className="nav-chevron" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="m6 9 6 6 6-6" /></svg></span>
          </button>
          {menuOpen && <div className="module-menu-panel" role="menu">{items.map(([key, label]) => <button type="button" className={page === key ? 'active' : ''} key={key} role="menuitem" onClick={() => goTo(key)}>{label}</button>)}</div>}
        </div>
      </nav>
      <SocialLinks compact />
      {user && <button type="button" className={`hidden-controls-toggle ${showDemoControls ? 'active' : ''}`} aria-label={showDemoControls ? 'Ocultar acciones de demostración' : 'Mostrar acciones de demostración'} title={showDemoControls ? 'Ocultar acciones de demostración' : 'Mostrar acciones de demostración'} onClick={onToggleDemoControls}>·</button>}
      {user ? <button className="nav-session" onClick={() => { setMenuOpen(false); logout() }}>Cerrar sesión</button> : <button className="nav-session public-login" onClick={() => { setMenuOpen(false); navigate('login', page) }}>Iniciar sesión</button>}
    </header>
  )
}
