import { useNavigate } from "react-router-dom";
import "./Landing.css";

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <rect x="7" y="14" width="4" height="4" rx="0.5" fill="currentColor" stroke="none" opacity="0.5" />
      </svg>
    ),
    title: "Gestión de canchas y horarios",
    description:
      "Administrá tus canchas con un calendario visual. Creá reservas para jugadores o clases con profesores, configurá reservas fijas semanales y evitá conflictos de horarios automáticamente.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21l4-4 4 4" />
        <path d="M12 17V3" />
        <path d="M5 8l-2 2 2 2" />
        <path d="M19 8l2 2-2 2" />
        <path d="M3 10h4" />
        <path d="M17 10h4" />
        <path d="M6 3h12a1 1 0 0 1 1 1v4a7 7 0 0 1-14 0V4a1 1 0 0 1 1-1z" />
      </svg>
    ),
    title: "Torneos y competencias",
    description:
      "Creá y gestioná torneos fácilmente. Organizá grupos, genera el fixture automáticamente, registrá resultados y llevá el seguimiento de posiciones en tiempo real.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="7" r="4" />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <circle cx="18" cy="8" r="3" />
        <path d="M21 21v-1a3 3 0 0 0-3-3h-1" />
      </svg>
    ),
    title: "Jugadores y profesores",
    description:
      "Registrá a tus jugadores con sus categorías y datos de contacto. Administrá a tus profesores y visualizá sus horarios de clase en un calendario dedicado.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
    title: "Información pública",
    description:
      "Compartí los horarios disponibles de tus canchas y la información de torneos en curso con todos tus clientes. Sin login, acceso directo desde el celular.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: "Control de precios e ingresos",
    description:
      "Configurá tarifas por hora para jugadores y clases con profesor. Ajustá el precio por reserva si hace falta, y llevá estadísticas de ingresos diarios, semanales y mensuales.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h7v7H3z" />
        <path d="M14 3h7v7h-7z" />
        <path d="M14 14h7v7h-7z" />
        <path d="M3 14h7v7H3z" />
      </svg>
    ),
    title: "Panel de estadísticas",
    description:
      "Visualizá la ocupación de cada cancha, los ingresos del día, la semana y el mes, y analizá el rendimiento del complejo con gráficos claros e intuitivos.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <img src="/logo.png" alt="Devolea" className="landing-nav-logo" />
          <button className="landing-btn-outline" onClick={() => navigate("/login")}>
            Iniciar sesión
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-badge">Software de gestión deportiva</div>
          <h1 className="landing-hero-title">
            Gestioná tus canchas y torneos<br />
            <span className="landing-accent">más fácilmente</span>
          </h1>
          <p className="landing-hero-sub">
            Todo lo que necesitás para administrar tu complejo de pádel en un solo lugar.
            Reservas, torneos, jugadores, profesores y estadísticas.
          </p>
          <div className="landing-hero-actions">
            <button className="landing-btn-primary" onClick={() => navigate("/login")}>
              Comenzar ahora
            </button>
            <button
              className="landing-btn-ghost"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Ver funcionalidades
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="landing-hero-blob landing-hero-blob-1" />
        <div className="landing-hero-blob landing-hero-blob-2" />
      </section>

      {/* ── Features ── */}
      <section className="landing-section landing-section-light" id="features">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-label">Funcionalidades</span>
            <h2 className="landing-section-title">Todo lo que necesita tu complejo</h2>
            <p className="landing-section-sub">
              Diseñado especialmente para la gestión de canchas de pádel y tenis.
            </p>
          </div>

          <div className="landing-features-grid">
            {FEATURES.map((f) => (
              <div className="landing-feature-card" key={f.title}>
                <div className="landing-feature-icon">{f.icon}</div>
                <h3 className="landing-feature-title">{f.title}</h3>
                <p className="landing-feature-desc">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Public info highlight ── */}
      <section className="landing-section landing-section-dark">
        <div className="landing-container landing-split">
          <div className="landing-split-text">
            <span className="landing-label landing-label-light">Acceso público</span>
            <h2 className="landing-section-title landing-text-white">
              Compartí la disponibilidad<br />con tus clientes
            </h2>
            <p className="landing-section-sub landing-text-muted">
              Activá el acceso público y tus clientes podrán consultar los horarios
              disponibles de las canchas y los torneos en curso sin necesidad de registrarse.
              Compartí el link y listo.
            </p>
            <ul className="landing-check-list">
              <li>Horarios disponibles en tiempo real</li>
              <li>Información de torneos y brackets</li>
              <li>Acceso desde cualquier dispositivo</li>
              <li>Sin necesidad de crear una cuenta</li>
            </ul>
          </div>
          <div className="landing-split-visual">
            <div className="landing-phone-mockup">
              <div className="landing-phone-screen">
                <div className="landing-phone-header">
                  <div className="landing-phone-dot" />
                  <div className="landing-phone-bar" style={{ width: "50%" }} />
                </div>
                <div className="landing-phone-block landing-phone-block-accent" />
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div className="landing-phone-block" style={{ flex: 1 }} />
                  <div className="landing-phone-block landing-phone-block-green" style={{ flex: 1 }} />
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div className="landing-phone-block landing-phone-block-green" style={{ flex: 1 }} />
                  <div className="landing-phone-block" style={{ flex: 1 }} />
                </div>
                <div className="landing-phone-block" />
                <div style={{ display: "flex", gap: 8 }}>
                  <div className="landing-phone-block" style={{ flex: 2 }} />
                  <div className="landing-phone-block landing-phone-block-accent" style={{ flex: 1 }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-section landing-section-light">
        <div className="landing-container landing-cta">
          <h2 className="landing-section-title">Empezá a gestionar tu complejo hoy</h2>
          <p className="landing-section-sub">
            Configurá tu complejo en minutos y empezá a tomar reservas de forma organizada.
          </p>
          <button className="landing-btn-primary landing-btn-large" onClick={() => navigate("/login")}>
            Acceder a Devolea
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <img src="/logo.png" alt="Devolea" className="landing-footer-logo" />
          <p className="landing-footer-text">
            © {new Date().getFullYear()} Devolea · Software de Gestión de Canchas de Pádel y Torneos
          </p>
        </div>
      </footer>
    </div>
  );
}
