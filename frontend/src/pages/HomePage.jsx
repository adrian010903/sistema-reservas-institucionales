import { HomeCarousel, SocialFooter } from '../components/Branding'

export default function HomePage({ onExploreSpaces }) {
  return (
    <>
      <main className="new-hero home-with-carousel">
        <div className="home-intro">
          <h1>Reserva espacios institucionales con claridad.</h1>
          <p>Consulta disponibilidad, crea solicitudes y da seguimiento desde una sola plataforma.</p>
          <button className="primary-button" onClick={onExploreSpaces}>Explorar espacios</button>
        </div>
        <HomeCarousel />
      </main>
      <SocialFooter />
    </>
  )
}
