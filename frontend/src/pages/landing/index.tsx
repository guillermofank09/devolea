import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import screenshotDesktop from "../../assets/desktop-screenshot.png";
import screenshotMobile from "../../assets/mobile-screenshot.png";
import "./Landing.css";

// ─── Padel ball SVG ──────────────────────────────────────────────────────────
function PadelBall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle cx="30" cy="30" r="29" fill="#F5AD27" />
      <circle cx="30" cy="30" r="29" fill="url(#ballGrad)" />
      {/* Seam curves */}
      <path d="M8 20 Q30 14 52 20" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M8 40 Q30 46 52 40" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.7"/>
      {/* Fuzz texture */}
      <circle cx="30" cy="30" r="29" fill="url(#fuzz)" />
      <defs>
        <radialGradient id="ballGrad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#fcc44a" />
          <stop offset="100%" stopColor="#e09800" />
        </radialGradient>
        <radialGradient id="fuzz" cx="50%" cy="50%" r="50%">
          <stop offset="70%" stopColor="transparent" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// ─── Padel net SVG ──────────────────────────────────────────────────────────
function CourtNet() {
  const W = 800;
  const PL = 40;        // post left X
  const PR = 760;       // post right X
  const TOP = 20;       // top cable Y
  const BOT = 90;       // bottom of net Y
  const COLS = 36;
  const ROWS = 8;
  const nw = PR - PL;
  const nh = BOT - TOP;

  const vLines = Array.from({ length: COLS + 1 }, (_, i) => PL + (i / COLS) * nw);
  const hLines = Array.from({ length: ROWS + 1 }, (_, i) => TOP + (i / ROWS) * nh);

  return (
    <svg
      className="lp-footer-net"
      viewBox={`0 0 ${W} 110`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      {/* Floor shadow */}
      <ellipse cx={W / 2} cy={BOT + 14} rx={nw * 0.52} ry={5} fill="rgba(0,0,0,0.35)" />

      {/* Post left */}
      <rect x={PL - 4} y={TOP - 12} width={8} height={nh + 20} rx="3" fill="rgba(255,255,255,0.28)" />
      <rect x={PL - 10} y={BOT + 8} width={20} height={5} rx="2" fill="rgba(255,255,255,0.18)" />

      {/* Post right */}
      <rect x={PR - 4} y={TOP - 12} width={8} height={nh + 20} rx="3" fill="rgba(255,255,255,0.28)" />
      <rect x={PR - 10} y={BOT + 8} width={20} height={5} rx="2" fill="rgba(255,255,255,0.18)" />

      {/* Top cable */}
      <line x1={PL} y1={TOP} x2={PR} y2={TOP} stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" />

      {/* Sway group — origin at top cable */}
      <g className="lp-net-sway" style={{ transformOrigin: `${W / 2}px ${TOP}px` }}>
        {/* Vertical strings */}
        {vLines.map((x, i) => (
          <line key={`v${i}`} x1={x} y1={TOP} x2={x} y2={BOT}
            stroke="rgba(255,255,255,0.16)" strokeWidth="0.9" />
        ))}

        {/* Horizontal strings */}
        {hLines.map((y, i) => (
          <line key={`h${i}`} x1={PL} y1={y} x2={PR} y2={y}
            stroke={i === 0 ? "rgba(255,255,255,0.0)" : "rgba(255,255,255,0.14)"}
            strokeWidth="0.9" />
        ))}

        {/* White bottom band */}
        <rect x={PL} y={BOT - 9} width={nw} height={9} fill="rgba(255,255,255,0.13)" />

        {/* Center strap */}
        <rect x={W / 2 - 3} y={TOP} width={6} height={nh} rx="2" fill="rgba(255,255,255,0.32)" />

        {/* Shimmer overlay — moves across the net */}
        <rect x={PL} y={TOP} width={nw} height={nh} fill="url(#shimmer)" />
      </g>

      <defs>
        <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="transparent" />
          <stop offset="45%"  stopColor="transparent" />
          <stop offset="50%"  stopColor="rgba(255,255,255,0.06)" />
          <stop offset="55%"  stopColor="transparent" />
          <stop offset="100%" stopColor="transparent">
            <animate attributeName="offset" values="100%;-10%" dur="4s" repeatCount="indefinite" />
          </stop>
          <stop offset="45%" stopColor="transparent">
            <animate attributeName="offset" values="90%;-20%" dur="4s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
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
          <img src={logo} alt="Devolea" className="lp-nav-logo" />
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

          {/* Screenshots */}
          <div className="lp-screens-wrap">
            {/* Laptop frame */}
            <div className="lp-laptop">
              <div className="lp-laptop-top">
                <div className="lp-laptop-cam" />
                <div className="lp-laptop-screen">
                  <img src={screenshotDesktop} alt="Vista de escritorio" className="lp-screenshot" />
                </div>
              </div>
              <div className="lp-laptop-base">
                <div className="lp-laptop-notch" />
              </div>
            </div>

            {/* Phone frame */}
            <div className="lp-phone">
              <div className="lp-phone-notch" />
              <div className="lp-phone-screen">
                <img src={screenshotMobile} alt="Vista móvil" className="lp-screenshot" />
              </div>
              <div className="lp-phone-home" />
            </div>
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
        <CourtNet />
        <div className="lp-container lp-footer-inner">
          <p className="lp-footer-text">
            © {new Date().getFullYear()} Devolea · Software de Gestión de Canchas de Pádel y Torneos
          </p>
        </div>
      </footer>
    </div>
  );
}
