import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Encuentra tu espacio",
    description:
      "Explora escritorios, salas de reuniones y espacios privados según tus necesidades.",
  },
  {
    number: "02",
    title: "Reserva en minutos",
    description:
      "Elige la fecha y el horario que mejor se adapten a tu jornada.",
  },
  {
    number: "03",
    title: "Trabaja a tu manera",
    description:
      "Organiza tus reuniones y sesiones de trabajo desde un solo lugar.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <Link href="/" className="brand">
          <span className="brand-mark">C</span>
          CoSpace
        </Link>

        <nav className="nav-links">
          <a href="#como-funciona">Cómo funciona</a>
          <Link href="/spaces">Espacios</Link>
        </nav>

        <div className="header-actions">
          <Link href="/login" className="button button-ghost">
            Iniciar sesión
          </Link>
          <Link href="/register" className="button button-dark">
            Crear cuenta
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">
            TU ESPACIO. TU RITMO. TU FORMA DE TRABAJAR.
          </span>

          <h1>
            Un mejor lugar
            <br />
            para hacer
            <br />
            <span>grandes cosas.</span>
          </h1>

          <p className="hero-description">
            Encuentra y reserva espacios de coworking que se adaptan a tus
            ideas, tus reuniones y tu forma de trabajar.
          </p>

          <div className="hero-actions">
            <Link href="/spaces" className="button button-dark button-large">
              Explorar espacios <span aria-hidden="true">↗</span>
            </Link>
            <a href="#como-funciona" className="text-link">
              Descubre cómo funciona ↓
            </a>
          </div>

          <div className="hero-note">
            <span className="status-dot" />
            Tu próximo lugar de trabajo está aquí.
          </div>
        </div>

        <div className="hero-visual" aria-label="Espacio de trabajo moderno">
          <div className="visual-topline">
            <span>ESPACIOS PARA CRECER</span>
            <span>CO / 001</span>
          </div>

          <div className="visual-art">
            <div className="sun" />
            <div className="window window-one" />
            <div className="window window-two" />
            <div className="plant plant-one">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="desk">
              <div className="desk-top" />
              <div className="desk-leg desk-leg-one" />
              <div className="desk-leg desk-leg-two" />
              <div className="laptop">
                <div />
              </div>
              <div className="mug" />
            </div>
            <div className="chair">
              <div className="chair-back" />
              <div className="chair-seat" />
              <div className="chair-base" />
            </div>
          </div>

          <div className="visual-caption">
            <div>
              <span className="caption-label">EL LUGAR IDEAL PARA</span>
              <strong>Tu próxima gran idea.</strong>
            </div>
            <span className="caption-symbol">✳</span>
          </div>
        </div>

        <div className="hero-index">ESPACIOS QUE INSPIRAN · 2026</div>
      </section>

      <section className="intro-section" id="como-funciona">
        <div className="section-heading">
          <span className="eyebrow">MENOS COMPLICACIONES, MÁS IDEAS</span>
          <h2>
            Trabajar bien
            <br />
            empieza por <span>el lugar.</span>
          </h2>
        </div>

        <div className="feature-list">
          {features.map((feature) => (
            <article className="feature" key={feature.number}>
              <span className="feature-number">{feature.number}</span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
              <span className="feature-arrow" aria-hidden="true">
                ↗
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <div>
          <span className="eyebrow">TU SIGUIENTE JORNADA COMIENZA AQUÍ</span>
          <h2>Encuentra tu lugar.</h2>
          <p>Descubre espacios pensados para que puedas concentrarte.</p>
        </div>
        <Link href="/spaces" className="button button-light button-large">
          Ver espacios <span aria-hidden="true">↗</span>
        </Link>
      </section>

      <footer className="site-footer">
        <Link href="/" className="brand">
          <span className="brand-mark">C</span>
          CoSpace
        </Link>
        <span>Un espacio para cada idea.</span>
        <span>© 2026 CoSpace</span>
      </footer>
    </main>
  );
}