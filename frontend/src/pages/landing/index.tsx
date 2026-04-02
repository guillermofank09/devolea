import { useNavigate } from "react-router-dom";
import logoWhite from "../../assets/logo-white.png";
import "./Landing.css";

// ─── Padel ball SVG ──────────────────────────────────────────────────────────
function PadelBall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="30" cy="30" r="29" fill="#c8e63a" />
      <circle cx="30" cy="30" r="29" fill="url(#ballGrad)" />
      {/* Seam curves */}
      <path d="M8 20 Q30 14 52 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M8 40 Q30 46 52 40" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7"/>
      {/* Fuzz texture */}
      <circle cx="30" cy="30" r="29" fill="url(#fuzz)" />
      <defs>
        <radialGradient id="ballGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#d4f040" />
          <stop offset="100%" stopColor="#a8cc20" />
        </radialGradient>
        <radialGradient id="fuzz" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ─── Feature data ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "🗓️",
    title: "Canchas y horarios",
    desc: "Calendario visual para gestionar reservas, detectar conflictos automáticamente y configurar turnos fijos semanales.",
  },
  {
    icon: "🏆",
    title: "Torneos y fixtures",
    desc: "Creá torneos, generá el fixture, registrá resultados y llevá el seguimiento de posiciones en tiempo real.",
  },
  {
    icon: "👥",
    title: "Jugadores y profesores",
    desc: "Registrá jugadores con categoría y contacto. Visualizá los horarios de clases de cada profesor en su propio calendario.",
  },
  {
    icon: "🌐",
    title: "Información pública",
    desc: "Compartí horarios disponibles y torneos en curso con tus clientes sin que necesiten registrarse.",
  },
  {
    icon: "💰",
    title: "Precios e ingresos",
    desc: "Configurá tarifas por hora para jugadores y clases. Ajustá el precio por reserva y llevá el control de ingresos.",
  },
  {
    icon: "📊",
    title: "Estadísticas",
    desc: "Visualizá la ocupación de cada cancha y los ingresos del día, semana y mes con gráficos claros.",
  },
];

// ─── Landing page ────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="lp">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <img src={logoWhite} alt="Devolea" className="lp-nav-logo" />
          <button className="lp-btn-outline" onClick={() => navigate("/login")}>
            Iniciar sesión
          </button>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        {/* Animated padel balls */}
        <PadelBall className="lp-ball lp-ball-1" />
        <PadelBall className="lp-ball lp-ball-2" />
        <PadelBall className="lp-ball lp-ball-3" />
        <PadelBall className="lp-ball lp-ball-4" />

        {/* Court line decorations */}
        <div className="lp-court-lines" aria-hidden>
          <div className="lp-court-line lp-court-line-h" />
          <div className="lp-court-line lp-court-line-v" />
          <div className="lp-court-box" />
        </div>

        <div className="lp-hero-content">
          <h1 className="lp-hero-title">
            Gestioná tus canchas<br />
            <span className="lp-hero-accent">y torneos</span>{" "}
            <span className="lp-hero-light">más fácilmente</span>
          </h1>
          <p className="lp-hero-sub">
            Todo lo que necesitás para administrar tu complejo de pádel en un solo lugar.
            Reservas, torneos, jugadores y estadísticas.
          </p>
          <div className="lp-hero-cta">
            <button className="lp-btn-primary" onClick={() => navigate("/login")}>
              Comenzar ahora
            </button>
            <button
              className="lp-btn-ghost"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              Ver funcionalidades ↓
            </button>
          </div>
        </div>

        <div className="lp-hero-scroll-hint" aria-hidden>
          <div className="lp-scroll-mouse">
            <div className="lp-scroll-wheel" />
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-light" id="features">
        <div className="lp-container">
          <div className="lp-section-header">
            <p className="lp-eyebrow">Funcionalidades</p>
            <h2 className="lp-section-title">Todo lo que necesita tu complejo</h2>
            <p className="lp-section-sub">
              Diseñado específicamente para la gestión de canchas de pádel y tenis.
            </p>
          </div>

          <div className="lp-grid">
            {FEATURES.map((f, i) => (
              <div className="lp-card" key={f.title} style={{ animationDelay: `${i * 80}ms` }}>
                <span className="lp-card-emoji">{f.icon}</span>
                <h3 className="lp-card-title">{f.title}</h3>
                <p className="lp-card-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Public sharing highlight ────────────────────────────────────── */}
      <section className="lp-section lp-section-dark">
        <div className="lp-container lp-split">
          <div className="lp-split-copy">
            <p className="lp-eyebrow lp-eyebrow-light">Acceso público</p>
            <h2 className="lp-section-title lp-white">
              Compartí la disponibilidad<br />con tus clientes
            </h2>
            <p className="lp-section-sub lp-muted" style={{ textAlign: "left", margin: 0 }}>
              Activá el acceso público y tus clientes podrán consultar los horarios
              disponibles y torneos en curso sin necesidad de registrarse.
              Compartí el link y listo.
            </p>
            <ul className="lp-checklist">
              {[
                "Horarios disponibles en tiempo real",
                "Información de torneos y brackets",
                "Acceso desde cualquier dispositivo",
                "Sin necesidad de crear una cuenta",
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Animated phone mockup */}
          <div className="lp-mockup-wrap">
            <div className="lp-mockup">
              <div className="lp-mockup-notch" />
              <div className="lp-mockup-screen">
                {/* Screen header */}
                <div className="lp-ms-header">
                  <div className="lp-ms-dot" />
                  <div className="lp-ms-bar" style={{ width: "45%", background: "#F5AD27" }} />
                </div>
                {/* Schedule rows */}
                {[
                  { label: "10:00 – 11:00", color: "lp-slot-free" },
                  { label: "11:00 – 12:00", color: "lp-slot-busy" },
                  { label: "12:00 – 13:00", color: "lp-slot-free" },
                  { label: "13:00 – 14:00", color: "lp-slot-free" },
                  { label: "14:00 – 15:00", color: "lp-slot-busy" },
                  { label: "15:00 – 16:00", color: "lp-slot-free" },
                ].map((s) => (
                  <div className={`lp-slot ${s.color}`} key={s.label}>
                    <span className="lp-slot-label">{s.label}</span>
                    <span className="lp-slot-badge">
                      {s.color === "lp-slot-free" ? "Disponible" : "Reservada"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Floating ball on mockup */}
            <PadelBall className="lp-mockup-ball" />
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-light lp-cta-section">
        <div className="lp-container lp-cta">
          <h2 className="lp-section-title">Empezá hoy mismo</h2>
          <p className="lp-section-sub">
            Configurá tu complejo en minutos y comenzá a gestionar tus canchas de forma profesional.
          </p>
          <button className="lp-btn-primary lp-btn-xl" onClick={() => navigate("/login")}>
            Acceder a Devolea
          </button>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <img src={logoWhite} alt="Devolea" className="lp-footer-logo" />
          <p className="lp-footer-text">
            © {new Date().getFullYear()} Devolea · Software de Gestión de Canchas de Pádel y Torneos
          </p>
        </div>
      </footer>
    </div>
  );
}
