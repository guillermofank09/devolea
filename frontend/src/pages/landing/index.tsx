import type React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import screenshotDesktop from "../../assets/desktop-screenshot.png";
import "./Landing.css";

// ─── Sport ball SVGs ─────────────────────────────────────────────────────────

// Padel ball — warm yellow gradient, seam shape from SVGRepo icon, no specular highlight
function PadelBall({ className }: { className?: string }) {
  const ballPath = "M3.33995 16.9997C6.10137 21.7826 12.2173 23.4214 17.0002 20.66C18.9498 19.5344 20.377 17.8514 21.1967 15.9286C22.388 13.1341 22.2963 9.83304 20.6605 6.99972C19.0246 4.1664 16.2117 2.43642 13.196 2.07088C11.1209 1.81935 8.94981 2.21386 7.00021 3.33946C2.21728 6.10089 0.578527 12.2168 3.33995 16.9997Z";
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <radialGradient id="padelBase" cx="33%" cy="27%" r="70%">
          <stop offset="0%"   stopColor="#fde868" />
          <stop offset="30%"  stopColor="#f5c228" />
          <stop offset="65%"  stopColor="#d48b00" />
          <stop offset="100%" stopColor="#7a4800" />
        </radialGradient>
        <clipPath id="padelClip"><path d={ballPath}/></clipPath>
      </defs>
      {/* Ball filled with gradient */}
      <path d={ballPath} fill="url(#padelBase)" stroke="rgba(100,60,0,0.25)" strokeWidth="0.3"/>
      {/* Two diagonal seam curves */}
      <path
        d="M13.196 2.07129C12.9643 5.67 15.4643 10.0001 17.9643 14.3303C19.6 17.1 21.1967 15.929 21.1967 15.929M2.80371 8.07129C6.03613 9.67 8.53613 14.0001 11.0361 18.3303C11.9 19.9 10.8044 21.929 10.8044 21.929"
        stroke="rgba(255,255,255,0.62)"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
        clipPath="url(#padelClip)"
      />
    </svg>
  );
}

// Basketball — orange gradient sphere + compound seam path (outer circle + panel holes)
function BasketballBall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <radialGradient id="bballBase" cx="36%" cy="29%" r="68%">
          <stop offset="0%"   stopColor="#f97c20" />
          <stop offset="45%"  stopColor="#d45500" />
          <stop offset="100%" stopColor="#7a2c00" />
        </radialGradient>
        <radialGradient id="bballShadow" cx="72%" cy="72%" r="55%">
          <stop offset="0%"   stopColor="rgba(50,10,0,0.52)" />
          <stop offset="100%" stopColor="rgba(50,10,0,0)" />
        </radialGradient>
        <radialGradient id="bballHi" cx="28%" cy="22%" r="26%">
          <stop offset="0%"   stopColor="rgba(255,195,130,0.55)" />
          <stop offset="100%" stopColor="rgba(255,195,130,0)" />
        </radialGradient>
      </defs>
      {/* Orange sphere base + crescent shadow */}
      <circle cx="32" cy="32" r="32" fill="url(#bballBase)" />
      <circle cx="32" cy="32" r="32" fill="url(#bballShadow)" />
      {/* Compound path: outer circle filled dark, panel sub-paths wound opposite → create seam bands */}
      <path fillRule="evenodd" fill="#3a1200" opacity="0.82" d="M54.627,9.373c-12.496-12.495-32.758-12.495-45.254,0c-12.497,12.496-12.497,32.758,0,45.255 c12.496,12.496,32.758,12.496,45.254,0C67.124,42.131,67.124,21.869,54.627,9.373z M53.213,10.787 c4.428,4.428,7.179,9.895,8.261,15.615c-9.549-0.729-19.344,2.539-26.646,9.84c-1.283,1.283-2.437,2.646-3.471,4.066 c-2.487-1.862-4.873-3.926-7.136-6.188c-0.568-0.568-1.106-1.156-1.648-1.74c1.785-2.346,3.748-4.602,5.892-6.744 c7.077-7.078,15.369-12.184,24.198-15.373C52.847,10.438,53.033,10.606,53.213,10.787z M50.973,8.76 c-8.719,3.308-16.901,8.44-23.922,15.462c-2.117,2.117-4.065,4.34-5.845,6.65c-2.224-2.542-4.227-5.21-5.993-7.985 c4.333-5.684,6.633-12.416,6.904-19.218C31.742,0.319,42.732,2.016,50.973,8.76z M10.787,10.787 c2.755-2.756,5.915-4.854,9.285-6.312c-0.395,5.848-2.387,11.605-5.978,16.566c-1.728-2.922-3.208-5.945-4.448-9.047 C10.014,11.585,10.393,11.182,10.787,10.787z M8.193,13.755c1.291,3.084,2.818,6.087,4.582,8.989 c-0.625,0.75-1.285,1.481-1.988,2.185c-2.626,2.626-5.599,4.687-8.766,6.208C2.196,24.985,4.254,18.882,8.193,13.755z M2.031,33.34 c3.688-1.646,7.145-3.972,10.17-6.996c0.588-0.589,1.142-1.199,1.678-1.819c1.809,2.778,3.848,5.447,6.104,7.993 c-4.463,6.175-7.752,12.933-9.889,19.967C5.03,47.076,2.34,40.253,2.031,33.34z M11.712,54.093 c2.021-7.069,5.231-13.87,9.654-20.074c0.479,0.507,0.945,1.021,1.441,1.517c2.351,2.352,4.832,4.487,7.419,6.422 c-3.73,5.818-5.498,12.526-5.329,19.193C20.114,59.99,15.563,57.635,11.712,54.093z M53.213,53.213 c-7.156,7.157-17.028,9.934-26.299,8.347c-0.253-6.388,1.382-12.835,4.933-18.423c6.625,4.654,13.896,7.979,21.445,9.994 C53.265,53.157,53.24,53.187,53.213,53.213z M32.979,41.482c0.974-1.337,2.057-2.619,3.263-3.826 c6.99-6.989,16.407-10.049,25.538-9.219c0.961,8.076-1.356,16.463-6.953,23.016C47.13,49.531,39.712,46.213,32.979,41.482z"/>
      {/* Specular highlight */}
      <circle cx="32" cy="32" r="32" fill="url(#bballHi)" />
    </svg>
  );
}

// Volleyball — Twemoji design adapted: white/gray sphere + blue-gray seam bands
function VolleyballBall({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <circle fill="#E6E7E8" cx="18" cy="18" r="18"/>
      <path fill="#99AAB5" d="M32.809 7.779c-2.156-.087-5.324.186-8.21 1.966c-.009.005-.019.004-.028.009c-.02.011-.031.03-.05.042c-2.148 1.348-4.131 3.539-5.411 7.054c-2.395-.049-4.569-.286-6.488-.715C16.789 4.13 25.77 3.83 29.699 4.337a18.025 18.025 0 0 0-2.948-2.061c-5.071.24-12.398 2.611-16.065 13.335c-1.797-.578-3.319-1.35-4.534-2.312a.99.99 0 0 0 .128-.246C9.604 2.972 18.478.735 21.108.286A18.079 18.079 0 0 0 18 0c-1.037 0-2.046.107-3.035.275C11.227 2.109 6.884 5.52 4.609 11.794C3.499 10.42 3.071 9.078 2.91 8.206a17.92 17.92 0 0 0-1.323 2.43a10.564 10.564 0 0 0 2.096 3.137c3.168 3.307 8.495 5.01 15.807 5.088c.641 2.235.969 4.287 1.064 6.152c-11.714.419-17.645-4.414-20.49-8.277C.035 17.155 0 17.573 0 18c0 .589.033 1.171.088 1.746c3.422 3.627 9.303 7.297 19.114 7.297c.445 0 .907-.016 1.368-.032a20.453 20.453 0 0 1-.817 5.094c-9.528-.256-14.941-3.361-17.932-6.255a18.022 18.022 0 0 0 3.698 5.102c3.275 1.666 7.681 2.906 13.566 3.029a17.868 17.868 0 0 1-.99 2.014c.8-.004 1.583-.076 2.356-.181c1.828-3.749 3.305-9.756.842-17.938l-.197-.613c.91-2.363 2.181-4.011 3.592-5.144c4.465 9.084 2.105 17.699-.101 22.62c.94-.37 1.837-.82 2.692-1.336c2.027-5.501 3.435-13.744-.906-22.383c1.404-.729 2.848-1.075 4.144-1.213c.008.014.008.031.017.045c4.295 6.693 2.406 15.067-.073 21.119a18.025 18.025 0 0 0 3.853-5.399c1.399-6.064.893-11.461-1.516-15.822c.486.027.91.073 1.248.122a18.034 18.034 0 0 0-1.237-2.093z"/>
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
