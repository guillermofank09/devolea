import type React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import screenshotDesktop from "../../assets/desktop-screenshot.png";
import "./Landing.css";

// ─── Sport ball SVGs ─────────────────────────────────────────────────────────

// Padel ball — warm yellow sphere, two C-curve seams (left & right), muted highlight
function PadelBall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <radialGradient id="padelBase" cx="33%" cy="27%" r="70%">
          <stop offset="0%"   stopColor="#fde868" />
          <stop offset="30%"  stopColor="#f5c228" />
          <stop offset="65%"  stopColor="#d48b00" />
          <stop offset="100%" stopColor="#7a4800" />
        </radialGradient>
        <radialGradient id="padelHi" cx="30%" cy="24%" r="24%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.48)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <clipPath id="padelClip"><circle cx="30" cy="30" r="28.5"/></clipPath>
      </defs>
      <circle cx="30" cy="30" r="29" fill="url(#padelBase)" />
      {/* Two C-curve seams: left side opens right, right side opens left */}
      <g clipPath="url(#padelClip)" fill="none" strokeLinecap="round">
        <path d="M22 4 Q6 30 22 56"  stroke="rgba(255,255,255,0.25)" strokeWidth="4"/>
        <path d="M22 4 Q6 30 22 56"  stroke="rgba(255,255,255,0.68)" strokeWidth="1.8"/>
        <path d="M38 4 Q54 30 38 56" stroke="rgba(255,255,255,0.25)" strokeWidth="4"/>
        <path d="M38 4 Q54 30 38 56" stroke="rgba(255,255,255,0.68)" strokeWidth="1.8"/>
      </g>
      <circle cx="30" cy="30" r="29" fill="url(#padelHi)" />
    </svg>
  );
}

// Basketball — orange sphere, dark crescent shading, 3 embossed seam lines
function BasketballBall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <radialGradient id="bballBase" cx="36%" cy="29%" r="68%">
          <stop offset="0%"   stopColor="#f97c20" />
          <stop offset="45%"  stopColor="#d45500" />
          <stop offset="100%" stopColor="#7a2c00" />
        </radialGradient>
        {/* Dark overlay bottom-right — simulates crescent shadow */}
        <radialGradient id="bballShadow" cx="72%" cy="72%" r="55%">
          <stop offset="0%"   stopColor="rgba(50,10,0,0.52)" />
          <stop offset="100%" stopColor="rgba(50,10,0,0)" />
        </radialGradient>
        <radialGradient id="bballHi" cx="28%" cy="22%" r="26%">
          <stop offset="0%"   stopColor="rgba(255,195,130,0.55)" />
          <stop offset="100%" stopColor="rgba(255,195,130,0)" />
        </radialGradient>
        <clipPath id="bballClip"><circle cx="30" cy="30" r="28.5"/></clipPath>
      </defs>
      <circle cx="30" cy="30" r="29" fill="url(#bballBase)" />
      <circle cx="30" cy="30" r="29" fill="url(#bballShadow)" />
      {/* 3 seam lines — each drawn twice: wide soft light + narrow dark (embossed groove) */}
      <g clipPath="url(#bballClip)" fill="none" strokeLinecap="round">
        <path d="M2 29 C15 22 45 22 58 29"  stroke="rgba(255,185,100,0.55)" strokeWidth="3.5"/>
        <path d="M2 29 C15 22 45 22 58 29"  stroke="#3a1200" strokeWidth="1.7"/>
        <path d="M21 1 C5 13 4 47 21 59"    stroke="rgba(255,185,100,0.55)" strokeWidth="3.5"/>
        <path d="M21 1 C5 13 4 47 21 59"    stroke="#3a1200" strokeWidth="1.7"/>
        <path d="M39 1 C55 13 56 47 39 59"  stroke="rgba(255,185,100,0.55)" strokeWidth="3.5"/>
        <path d="M39 1 C55 13 56 47 39 59"  stroke="#3a1200" strokeWidth="1.7"/>
      </g>
      <circle cx="30" cy="30" r="29" fill="url(#bballHi)" />
    </svg>
  );
}

// Volleyball — 5-seam layout matching clipart reference:
// 2 vertical arcs (left/right) + 3 horizontal arcs (upper/equator/lower) → 6 panels
function VolleyballBall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <radialGradient id="volleyBase" cx="34%" cy="27%" r="68%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="50%"  stopColor="#e8ebf0" />
          <stop offset="85%"  stopColor="#c6cdd6" />
          <stop offset="100%" stopColor="#a0aab6" />
        </radialGradient>
        {/* Subtle tint for bottom-right panels */}
        <radialGradient id="vShade" cx="75%" cy="70%" r="55%">
          <stop offset="0%"   stopColor="rgba(100,118,140,0.2)" />
          <stop offset="100%" stopColor="rgba(100,118,140,0)" />
        </radialGradient>
        <radialGradient id="volleyHi" cx="27%" cy="20%" r="30%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.92)" />
          <stop offset="70%"  stopColor="rgba(255,255,255,0.2)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
        <clipPath id="volleyClip"><circle cx="30" cy="30" r="28.5"/></clipPath>
      </defs>

      {/* Base sphere */}
      <circle cx="30" cy="30" r="29" fill="url(#volleyBase)" stroke="#8a96a4" strokeWidth="1"/>
      <circle cx="30" cy="30" r="29" fill="url(#vShade)" />

      {/* 5 seams — each: wide soft halo first, then narrow sharp line on top */}
      <g clipPath="url(#volleyClip)" fill="none" strokeLinecap="round">

        {/* ── Vertical seam LEFT — bulges to the left ── */}
        <path d="M20 4 C6 16 6 44 20 56"   stroke="rgba(70,88,110,0.28)" strokeWidth="4.5"/>
        <path d="M20 4 C6 16 6 44 20 56"   stroke="#728090"              strokeWidth="1.8"/>

        {/* ── Vertical seam RIGHT — bulges to the right ── */}
        <path d="M40 4 C54 16 54 44 40 56"  stroke="rgba(70,88,110,0.28)" strokeWidth="4.5"/>
        <path d="M40 4 C54 16 54 44 40 56"  stroke="#728090"              strokeWidth="1.8"/>

        {/* ── Upper horizontal arc — bows upward ── */}
        <path d="M5 20 C18 13 42 13 55 20"  stroke="rgba(70,88,110,0.28)" strokeWidth="4.5"/>
        <path d="M5 20 C18 13 42 13 55 20"  stroke="#728090"              strokeWidth="1.8"/>

        {/* ── Equatorial arc — gentle curve ── */}
        <path d="M1 30 C15 26 45 26 59 30"  stroke="rgba(70,88,110,0.28)" strokeWidth="4.5"/>
        <path d="M1 30 C15 26 45 26 59 30"  stroke="#728090"              strokeWidth="1.8"/>

        {/* ── Lower horizontal arc — bows downward ── */}
        <path d="M5 40 C18 47 42 47 55 40"  stroke="rgba(70,88,110,0.28)" strokeWidth="4.5"/>
        <path d="M5 40 C18 47 42 47 55 40"  stroke="#728090"              strokeWidth="1.8"/>

      </g>

      {/* Specular highlight */}
      <circle cx="30" cy="30" r="29" fill="url(#volleyHi)" />
    </svg>
  );
}

// Football/Soccer — Wikimedia CC0 geometry (viewBox -2500 -2500 5000 5000),
// light-gray base + dark patches + specular highlight
function FootballBall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-2500 -2500 5000 5000" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        {/* 3-stop radial gradient in user-space coords (center of ball = 0,0) */}
        <radialGradient id="fbBase" cx="-650" cy="-750" r="2600" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#e8ecf0" />
          <stop offset="52%"  stopColor="#cdd2d9" />
          <stop offset="100%" stopColor="#96a0ac" />
        </radialGradient>
        <radialGradient id="fbHi" cx="-950" cy="-950" r="950" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.6)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      {/* Ball sphere */}
      <circle r="2376" fill="url(#fbBase)" stroke="#8a949e" strokeWidth="32"/>
      {/* Seam lines between patches (Wikimedia Soccerball.svg, CC0) */}
      <path fill="none" stroke="#1a1d22" strokeWidth="30" strokeLinecap="round"
        d="m-1643-1716 155 158
           m-550 2364c231 231 538 195 826 202
           m-524-2040c-491 351-610 1064-592 1060
           m1216-1008c-51 373 84 783 364 1220
           m-107-2289c157-157 466-267 873-329
           m-528 4112c-50 132-37 315-8 510
           m62-3883c282 32 792 74 1196 303
           m-404 2644c310 173 649 247 1060 180
           m-340-2008c-242 334-534 645-872 936
           m1109-2119c-111-207-296-375-499-534
           m1146 1281c100 3 197 44 290 141
           m-438 495c158 297 181 718 204 1140"/>
      {/* Black pentagonal patches (Wikimedia Soccerball.svg, CC0) */}
      <path fill="#1a1d22" stroke="#1a1d22" strokeWidth="20"
        d="m-1624-1700c243-153 498-303 856-424
           141 117 253 307 372 492
           -288 275-562 544-724 756
           -274-25-410-2-740-60
           3-244 84-499 236-764z
           m2904-40c271 248 537 498 724 788
           -55 262-105 553-180 704
           -234-35-536-125-820-200
           -138-357-231-625-340-924
           210-156 417-296 616-368z
           m-3273 3033a2376 2376 0 0 1-378-1392
           l59-7c54 342 124 674 311 928
           -36 179-2 323 51 458z
           m1197-1125c365 60 717 120 1060 180
           106 333 120 667 156 1000
           -263 218-625 287-944 420
           -372-240-523-508-736-768
           122-281 257-561 464-832z
           m3013 678a2376 2376 0 0 1-925 1147
           l-116-5c84-127 114-297 118-488
           232-111 464-463 696-772
           86 30 159 72 227 118z
           m-2287 1527a2376 2376 0 0 1-993-251
           c199 74 367 143 542 83
           53 75 176 134 451 168z"/>
      {/* Specular highlight */}
      <circle r="2376" fill="url(#fbHi)" />
    </svg>
  );
}

// ─── Feature icons ────────────────────────────────────────────────────────────
const IC = "#F5AD27";
const SW = "1.75";

const IconCalendar = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="3" y="4" width="18" height="17" rx="2.5" stroke={IC} strokeWidth={SW}/>
    <path d="M3 9h18" stroke={IC} strokeWidth={SW}/>
    <path d="M8 2v4M16 2v4" stroke={IC} strokeWidth={SW} strokeLinecap="round"/>
    <rect x="7" y="13" width="3" height="3" rx="0.75" fill={IC}/>
    <rect x="14" y="13" width="3" height="3" rx="0.75" fill={IC}/>
    <rect x="7" y="17" width="3" height="2" rx="0.75" fill={IC} opacity="0.45"/>
  </svg>
);

const IconTrophy = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M8 3h8v7a4 4 0 01-8 0V3z" stroke={IC} strokeWidth={SW} strokeLinejoin="round"/>
    <path d="M8 6H5a2 2 0 100 4h3M16 6h3a2 2 0 010 4h-3" stroke={IC} strokeWidth={SW} strokeLinecap="round"/>
    <path d="M12 14v4" stroke={IC} strokeWidth={SW} strokeLinecap="round"/>
    <path d="M9 21h6" stroke={IC} strokeWidth={SW} strokeLinecap="round"/>
    <circle cx="12" cy="10" r="1.5" fill={IC} opacity="0.6"/>
  </svg>
);

const IconPeople = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="8.5" cy="7" r="3" stroke={IC} strokeWidth={SW}/>
    <path d="M2 20c0-3.5 2.9-6.5 6.5-6.5S15 16.5 15 20" stroke={IC} strokeWidth={SW} strokeLinecap="round"/>
    <circle cx="17" cy="8" r="2.5" stroke={IC} strokeWidth={SW} opacity="0.7"/>
    <path d="M19.5 20c0-2.8-1.5-5-3.5-6" stroke={IC} strokeWidth={SW} strokeLinecap="round" opacity="0.7"/>
  </svg>
);

const IconGlobe = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke={IC} strokeWidth={SW}/>
    <path d="M12 3c-2.8 3.2-4 6-4 9s1.2 5.8 4 9" stroke={IC} strokeWidth={SW}/>
    <path d="M12 3c2.8 3.2 4 6 4 9s-1.2 5.8-4 9" stroke={IC} strokeWidth={SW}/>
    <path d="M3.5 9.5h17M3.5 14.5h17" stroke={IC} strokeWidth={SW} opacity="0.7"/>
  </svg>
);

const IconMoney = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="2" y="6" width="20" height="13" rx="2.5" stroke={IC} strokeWidth={SW}/>
    <path d="M2 10.5h20" stroke={IC} strokeWidth={SW} opacity="0.7"/>
    <circle cx="12" cy="15" r="2.2" stroke={IC} strokeWidth={SW}/>
    <circle cx="6" cy="15" r="1" fill={IC} opacity="0.5"/>
    <circle cx="18" cy="15" r="1" fill={IC} opacity="0.5"/>
  </svg>
);

const IconChart = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M3 20h18" stroke={IC} strokeWidth={SW} strokeLinecap="round"/>
    <rect x="4.5" y="12" width="4" height="8" rx="1" fill={IC} opacity="0.5"/>
    <rect x="10" y="6.5" width="4" height="13.5" rx="1" fill={IC}/>
    <rect x="15.5" y="9.5" width="4" height="10.5" rx="1" fill={IC} opacity="0.7"/>
  </svg>
);

// ─── Feature data ────────────────────────────────────────────────────────────
const FEATURES: { icon: React.ReactNode; title: string; desc: string }[] = [
  {
    icon: <IconCalendar />,
    title: "Canchas y horarios",
    desc: "Calendario visual para gestionar reservas, detectar conflictos automáticamente y configurar turnos fijos semanales.",
  },
  {
    icon: <IconTrophy />,
    title: "Torneos y fixtures",
    desc: "Creá torneos, generá el fixture, registrá resultados y llevá el seguimiento de posiciones en tiempo real.",
  },
  {
    icon: <IconPeople />,
    title: "Jugadores y profesores",
    desc: "Registrá jugadores con categoría y contacto. Visualizá los horarios de clases de cada profesor en su propio calendario.",
  },
  {
    icon: <IconGlobe />,
    title: "Información pública",
    desc: "Compartí horarios disponibles y torneos en curso con tus clientes sin que necesiten registrarse.",
  },
  {
    icon: <IconMoney />,
    title: "Precios e ingresos",
    desc: "Configurá tarifas por hora para jugadores y clases. Ajustá el precio por reserva y llevá el control de ingresos.",
  },
  {
    icon: <IconChart />,
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
          <div className="lp-nav-actions">
            <a
              className="lp-btn-primary lp-btn-wa"
              href={`https://wa.me/${import.meta.env.VITE_CONTACT_PHONE}?text=${encodeURIComponent("Hola! Me gustaría iniciar el período de prueba con Devolea para ver como funciona la aplicación en mi Club")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Prueba Devolea
            </a>
            <button className="lp-btn-outline" onClick={() => navigate("/login")}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="lp-hero">
        {/* Animated sport balls */}
        <PadelBall className="lp-ball lp-ball-1" />
        <BasketballBall className="lp-ball lp-ball-2" />
        <VolleyballBall className="lp-ball lp-ball-3" />
        <FootballBall className="lp-ball lp-ball-4" />

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
            Todo lo que necesitás para administrar tu complejo deportivo en un solo lugar.
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
              Diseñado específicamente para la gestión de canchas y torneos deportivos.
            </p>
          </div>

          <div className="lp-grid">
            {FEATURES.map((f, i) => (
              <div className="lp-card" key={f.title} style={{ animationDelay: `${i * 80}ms` }}>
                <div className="lp-card-icon">{f.icon}</div>
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

          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="lp-cta-section">
        <div className="lp-container lp-cta">
          <h2 className="lp-section-title">Empezá hoy mismo</h2>
          <p className="lp-section-sub">
            Configurá tu complejo en minutos y comenzá a gestionar tus canchas de forma profesional.
          </p>
          <button className="lp-btn-primary lp-btn-xl" onClick={() => navigate("/login")}>
            Prueba Devolea
          </button>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <p className="lp-footer-text">
            © {new Date().getFullYear()} Devolea · Software de Gestión de Canchas y Torneos
          </p>
        </div>
      </footer>
    </div>
  );
}
