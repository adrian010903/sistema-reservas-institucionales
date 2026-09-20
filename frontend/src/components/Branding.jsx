import { useEffect, useState } from 'react'

const HOME_SLIDES = [
  {
    image: '/assets/carousel/comunidad.webp',
    alt: 'Personas uniendo sus manos durante una actividad comunitaria',
    title: 'Espacios para compartir',
    text: 'Encuentra ambientes para reuniones, formación y convivencia.',
  },
  {
    image: '/assets/carousel/aventura.webp',
    alt: 'Grupo realizando una actividad al aire libre',
    title: 'Experiencias al aire libre',
    text: 'Explora zonas pensadas para campamentos y aventura.',
  },
  {
    image: '/assets/carousel/actividades.webp',
    alt: 'Grupo participando en una dinámica de equipo',
    title: 'Actividades en equipo',
    text: 'Descubre espacios para aprender, colaborar y crecer.',
  },
]

export function HomeCarousel() {
  const [activeSlide, setActiveSlide] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return undefined
    const timer = window.setInterval(() => setActiveSlide((current) => (current + 1) % HOME_SLIDES.length), 2000)
    return () => window.clearInterval(timer)
  }, [paused])

  const showSlide = (index) => setActiveSlide((index + HOME_SLIDES.length) % HOME_SLIDES.length)

  return (
    <section
      className="home-carousel"
      aria-label="Galería de espacios y actividades"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false)
      }}
    >
      <div className="home-carousel-stage">
        {HOME_SLIDES.map((slide, index) => (
          <article className={`home-carousel-slide ${index === activeSlide ? 'active' : ''}`} aria-hidden={index !== activeSlide} key={slide.image}>
            <img src={slide.image} alt={index === activeSlide ? slide.alt : ''} />
            <div className="home-carousel-overlay">
              <strong>{slide.title}</strong>
              <p>{slide.text}</p>
            </div>
          </article>
        ))}
        <button type="button" className="home-carousel-arrow previous" aria-label="Imagen anterior" onClick={() => showSlide(activeSlide - 1)}>‹</button>
        <button type="button" className="home-carousel-arrow next" aria-label="Imagen siguiente" onClick={() => showSlide(activeSlide + 1)}>›</button>
      </div>
      <div className="home-carousel-dots" aria-label="Elegir imagen">
        {HOME_SLIDES.map((slide, index) => (
          <button type="button" className={index === activeSlide ? 'active' : ''} aria-label={`Ver imagen ${index + 1}`} aria-current={index === activeSlide ? 'true' : undefined} key={slide.image} onClick={() => showSlide(index)} />
        ))}
      </div>
    </section>
  )
}

function SocialIcon({ name }) {
  if (name === 'Instagram') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><circle cx="12" cy="12" r="4" /><circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" /></svg>
  if (name === 'YouTube') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 8.2a2.8 2.8 0 0 0-2-2C17.2 5.7 12 5.7 12 5.7s-5.2 0-7 .5a2.8 2.8 0 0 0-2 2A29 29 0 0 0 2.5 12 29 29 0 0 0 3 15.8a2.8 2.8 0 0 0 2 2c1.8.5 7 .5 7 .5s5.2 0 7-.5a2.8 2.8 0 0 0 2-2 29 29 0 0 0 .5-3.8 29 29 0 0 0-.5-3.8Z" /><path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none" /></svg>
  if (name === 'Facebook') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 21v-8h2.7l.4-3H14V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V10H8.3v3h2.6v8Z" fill="currentColor" stroke="none" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.2 4c.3 1.8 1.3 3 3.1 3.2v2.7a6.3 6.3 0 0 1-3.1-.9v6.4a4.5 4.5 0 1 1-3.9-4.4v2.8a1.8 1.8 0 1 0 1.2 1.7V4Z" fill="currentColor" stroke="none" /></svg>
}

const SOCIAL_NETWORKS = [
  ['Instagram', 'https://www.instagram.com/guiasyscoutscr/'],
  ['YouTube', 'https://www.youtube.com/@guiasyscoutsdecostarica8833'],
  ['Facebook', 'https://www.facebook.com/GuiasyScoutsCR'],
  ['TikTok', 'https://www.tiktok.com/@guiasyscoutscr'],
]

export function SocialLinks({ compact = false }) {
  return (
    <div className={`social-links ${compact ? 'header-social-links' : ''}`} aria-label="Redes sociales oficiales">
      {SOCIAL_NETWORKS.map(([name, href]) => (
        <a href={href} target="_blank" rel="noreferrer" aria-label={`${name} de Guías y Scouts de Costa Rica`} key={name}>
          <SocialIcon name={name} />
        </a>
      ))}
    </div>
  )
}

export function SocialFooter() {
  return (
    <footer className="social-footer">
      <div className="social-footer-inner">
        <div>
          <p className="social-footer-kicker">Guías y Scouts de Costa Rica</p>
          <h2>Síguenos en nuestras redes sociales</h2>
          <p>Conoce nuestras actividades, noticias y comunidad.</p>
        </div>
        <SocialLinks />
      </div>
    </footer>
  )
}

export function SiempreListosRibbon() {
  return (
    <aside className="siempre-listos-ribbon" aria-label="Enlace a Siempre Listos">
      <div className="siempre-listos-ribbon-copy">
        <span>Siempre Listos</span>
        <p>Recursos y comunidad para seguir siempre preparados.</p>
      </div>
      <a className="siempre-listos-ribbon-link" href="https://siemprelistos.com" target="_blank" rel="noopener noreferrer">
        Visitar siemprelistos.com <span aria-hidden="true">↗</span>
      </a>
    </aside>
  )
}
