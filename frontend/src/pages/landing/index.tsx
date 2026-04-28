import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import screenshotDesktop from "../../assets/desktop-screenshot.png";
import screenshotMobile from "../../assets/mobile-screenshot.png";
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

const C = "#F5AD27";

// Canchas y horarios — top-down court view with a clock badge
const IconCourt = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
    {/* Court outline */}
    <rect x="3" y="9" width="26" height="22" rx="3" fill={C} opacity="0.1" stroke={C} strokeWidth="2"/>
    {/* Center horizontal line */}
    <line x1="3" y1="20" x2="29" y2="20" stroke={C} strokeWidth="1.5"/>
    {/* Center vertical line */}
    <line x1="16" y1="9" x2="16" y2="31" stroke={C} strokeWidth="1.5"/>
    {/* Left service lines */}
    <line x1="3" y1="14" x2="16" y2="14" stroke={C} strokeWidth="1" opacity="0.5"/>
    <line x1="3" y1="26" x2="16" y2="26" stroke={C} strokeWidth="1" opacity="0.5"/>
    {/* Clock badge */}
    <circle cx="33" cy="10" r="7" fill="white" stroke={C} strokeWidth="2.2"/>
    <path d="M33 7.5V11l2 1.5" stroke={C} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Torneos y fixtures — tournament bracket diagram
const IconBracket = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
    {/* 4 team bars */}
    <line x1="2" y1="8"  x2="13" y2="8"  stroke={C} strokeWidth="3.5" strokeLinecap="round"/>
    <line x1="2" y1="17" x2="13" y2="17" stroke={C} strokeWidth="3.5" strokeLinecap="round"/>
    <line x1="2" y1="26" x2="13" y2="26" stroke={C} strokeWidth="3.5" strokeLinecap="round"/>
    <line x1="2" y1="35" x2="13" y2="35" stroke={C} strokeWidth="3.5" strokeLinecap="round"/>
    {/* Vertical joins R1 */}
    <path d="M13 8v9M13 26v9" stroke={C} strokeWidth="1.8" strokeLinecap="round"/>
    {/* Semi bars */}
    <line x1="13" y1="12.5" x2="26" y2="12.5" stroke={C} strokeWidth="3.5" strokeLinecap="round"/>
    <line x1="13" y1="30.5" x2="26" y2="30.5" stroke={C} strokeWidth="3.5" strokeLinecap="round"/>
    {/* Vertical join R2 */}
    <path d="M26 12.5v18" stroke={C} strokeWidth="1.8" strokeLinecap="round"/>
    {/* Final bar */}
    <line x1="26" y1="21.5" x2="36" y2="21.5" stroke={C} strokeWidth="3.5" strokeLinecap="round"/>
    {/* Gold star at finish */}
    <circle cx="36" cy="21.5" r="3.5" fill={C}/>
  </svg>
);

// Jugadores y profesores — sports jersey (very specific to sports context)
const IconJersey = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
    {/* Jersey body */}
    <path d="M13 6h14l4 8H31v20H9V14H5l4-8z" fill={C} opacity="0.2" stroke={C} strokeWidth="2.2" strokeLinejoin="round"/>
    {/* Collar */}
    <path d="M14 6c0 3 3 5 6 5s6-2 6-5" stroke={C} strokeWidth="2" strokeLinecap="round" fill="none"/>
    {/* Jersey number */}
    <text x="20" y="27" textAnchor="middle" fontSize="10" fontWeight="800" fill={C} fontFamily="Inter,Roboto,sans-serif">10</text>
  </svg>
);

// Información pública — megaphone / announcement
const IconMegaphone = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
    {/* Speaker grille */}
    <rect x="4" y="15" width="8" height="11" rx="2.5" fill={C} opacity="0.25" stroke={C} strokeWidth="2"/>
    {/* Horn body */}
    <path d="M12 15L30 7v27L12 26z" fill={C} opacity="0.15" stroke={C} strokeWidth="2.2" strokeLinejoin="round"/>
    {/* Sound waves */}
    <path d="M33 13.5c2 2.5 2 11 0 13.5" stroke={C} strokeWidth="2.2" strokeLinecap="round" fill="none"/>
    <path d="M36 10c3.5 4 3.5 16.5 0 21" stroke={C} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.45"/>
    {/* Handle */}
    <path d="M8 26l-2 6" stroke={C} strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);

// Precios e ingresos — banknote with upward arrow
const IconBanknote = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
    {/* Bill */}
    <rect x="3" y="13" width="34" height="20" rx="4" fill={C} opacity="0.12" stroke={C} strokeWidth="2.2"/>
    {/* Coin circle */}
    <circle cx="20" cy="23" r="5.5" fill={C} opacity="0.2" stroke={C} strokeWidth="2"/>
    {/* $ sign */}
    <path d="M20 19v8M18.2 21h3a1.5 1.5 0 010 3h-2.2a1.5 1.5 0 000 3H21" stroke={C} strokeWidth="1.8" strokeLinecap="round"/>
    {/* Corner dots */}
    <circle cx="9" cy="23" r="2" fill={C} opacity="0.4"/>
    <circle cx="31" cy="23" r="2" fill={C} opacity="0.4"/>
    {/* Rising arrow (income) */}
    <path d="M30 9l3-4 3 4" stroke={C} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="33" y1="5" x2="33" y2="13" stroke={C} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Estadísticas — dashboard with multiple KPI tiles
const IconDashboard = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
    {/* Outer dashboard frame */}
    <rect x="3" y="5" width="34" height="30" rx="4" fill={C} opacity="0.08" stroke={C} strokeWidth="2"/>
    {/* Top bar */}
    <rect x="3" y="5" width="34" height="7" rx="4" fill={C} opacity="0.2"/>
    {/* Three KPI tiles */}
    <rect x="7" y="16" width="8" height="7" rx="2" fill={C} opacity="0.35"/>
    <rect x="17" y="16" width="8" height="7" rx="2" fill={C} opacity="0.6"/>
    <rect x="27" y="16" width="8" height="7" rx="2" fill={C}/>
    {/* Sparkline / trend */}
    <path d="M7 29l5-3 6 2 6-5 8-2" stroke={C} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Feature data ────────────────────────────────────────────────────────────
const FEATURES: { icon: ReactNode; title: string; desc: string; color: string }[] = [
  {
    icon: <IconCourt />,
    color: "#F5AD27",
    title: "Canchas y horarios",
    desc: "Vista de cancha con horarios disponibles, detección de conflictos y turnos fijos semanales.",
  },
  {
    icon: <IconBracket />,
    color: "#F5AD27",
    title: "Torneos y fixtures",
    desc: "Generá el fixture automáticamente, registrá resultados y seguí posiciones en tiempo real.",
  },
  {
    icon: <IconJersey />,
    color: "#F5AD27",
    title: "Jugadores y profesores",
    desc: "Registrá jugadores con categoría y contacto. Visualizá los horarios de clases de cada profesor.",
  },
  {
    icon: <IconMegaphone />,
    color: "#F5AD27",
    title: "Información pública",
    desc: "Compartí horarios disponibles y torneos en curso con tus clientes sin que necesiten registrarse.",
  },
  {
    icon: <IconBanknote />,
    color: "#F5AD27",
    title: "Precios e ingresos",
    desc: "Configurá tarifas por cancha y clase. Ajustá el precio por reserva y controlá tus ingresos.",
  },
  {
    icon: <IconDashboard />,
    color: "#F5AD27",
    title: "Estadísticas",
    desc: "Visualizá la ocupación de cada cancha y los ingresos del día, semana y mes con gráficos claros.",
  },
];

// ─── Shared WhatsApp URL ──────────────────────────────────────────────────────
const WA_URL = `https://wa.me/${import.meta.env.VITE_CONTACT_PHONE}?text=${encodeURIComponent("Hola! Me gustaría iniciar el período de prueba con Devolea para ver como funciona la aplicación en mi Club")}`;

// ─── How it works steps ───────────────────────────────────────────────────────
const STEPS = [
  {
    title: "Registrá tu complejo",
    desc: "Creá tu cuenta en minutos, configurá el nombre, los deportes que ofrecés y agregá tus canchas.",
  },
  {
    title: "Configurá horarios y precios",
    desc: "Definí los turnos disponibles, las tarifas por cancha y los horarios de clases con profesores.",
  },
  {
    title: "Empezá a gestionar",
    desc: "Tomá reservas, creá torneos y compartí la disponibilidad con tus clientes desde el día uno.",
  },
];

// ─── Landing page ────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();

  // Cambio 6 — animate cards when they enter the viewport
  useEffect(() => {
    const cards = document.querySelectorAll(".lp-card");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("lp-card--visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="lp">
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <img src={logo} alt="Devolea" className="lp-nav-logo" />
          {/* Cambio 11 — anchor links in desktop nav */}
          <div className="lp-nav-links">
            <a href="#features">Funcionalidades</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#precios">Precios</a>
          </div>
          <div className="lp-nav-actions">
            <a
              className="lp-btn-primary lp-btn-wa"
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Prueba Devolea
            </a>
            <button className="lp-btn-outline lp-nav-login" onClick={() => navigate("/login")}>
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
            <a
              className="lp-btn-primary lp-btn-xl"
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Quiero una prueba gratuita
            </a>
            <button className="lp-btn-ghost" onClick={() => navigate("/login")}>
              Ya tengo cuenta →
            </button>
          </div>
          <p className="lp-hero-note">Sin tarjeta de crédito · Configuración en minutos</p>
        </div>

        <div className="lp-hero-scroll-hint" aria-hidden>
          <div className="lp-scroll-mouse">
            <div className="lp-scroll-wheel" />
          </div>
        </div>
      </section>

      {/* ── Trust strip ────────────────────────────────────────────────── */}
      <div className="lp-trust-strip">
        <div className="lp-container">
          <div className="lp-trust-row">
            <div className="lp-trust-stat">
              <span className="lp-trust-num">5 min</span>
              <span className="lp-trust-desc">para empezar</span>
            </div>
            <div className="lp-trust-vline" />
            <div className="lp-trust-stat">
              <span className="lp-trust-num">Multiples</span>
              <span className="lp-trust-desc">
                <span className="lp-hide-mobile">deportes soportados</span>
                <span className="lp-show-mobile">deportes</span>
              </span>
            </div>
            <div className="lp-trust-vline" />
            <div className="lp-trust-stat">
              <span className="lp-trust-num">100%</span>
              <span className="lp-trust-desc">desde el celular</span>
            </div>
            <div className="lp-trust-vline" />
            <div className="lp-trust-stat">
              <span className="lp-trust-num">Gratis</span>
              <span className="lp-trust-desc">para probar</span>
            </div>
          </div>
        </div>
      </div>

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
              <div className="lp-card" key={f.title} style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="lp-card-icon" style={{ background: f.color + "18", border: `1.5px solid ${f.color}30` }}>{f.icon}</div>
                <h3 className="lp-card-title">{f.title}</h3>
                <p className="lp-card-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="lp-section" id="como-funciona">
        <div className="lp-container">
          <div className="lp-section-header">
            <p className="lp-eyebrow">¿Cómo funciona?</p>
            <h2 className="lp-section-title">Configurá tu complejo en 3 pasos</h2>
            <p className="lp-section-sub">Sin instalaciones ni configuraciones complejas.</p>
          </div>
          <div className="lp-steps">
            {STEPS.map((step, i) => (
              <div className="lp-step" key={i}>
                <div className="lp-step-num">{i + 1}</div>
                <div className="lp-step-copy">
                  <h3 className="lp-step-title">{step.title}</h3>
                  <p className="lp-step-desc">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────── */}
      <section className="lp-section lp-section-light" id="precios">
        <div className="lp-container">
          <div className="lp-section-header">
            <p className="lp-eyebrow">Precios</p>
            <h2 className="lp-section-title">Elegí tu plan</h2>
            <p className="lp-section-sub">Todos los planes incluyen 2 semanas de prueba gratuita. Sin tarjeta de crédito.</p>
          </div>
          <div className="lp-pricing-grid">
            {[
              {
                name: "Starter",
                courts: "Hasta 2 canchas",
                price: "29.999",
                desc: "Para complejos pequeños que quieren empezar a organizarse.",
                featured: false,
              },
              {
                name: "Pro",
                courts: "Hasta 5 canchas",
                price: "49.999",
                desc: "El más elegido. Ideal para complejos medianos en crecimiento.",
                featured: true,
              },
              {
                name: "Full",
                courts: "8 canchas o más",
                price: "69.000",
                desc: "Para grandes complejos con alta demanda y múltiples deportes.",
                featured: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`lp-pricing-card${plan.featured ? " lp-pricing-card--featured" : ""}`}
              >
                {plan.featured && <span className="lp-pricing-badge">Más popular</span>}
                <p className="lp-pricing-courts">{plan.courts}</p>
                <h3 className="lp-pricing-name">{plan.name}</h3>
                <div className="lp-pricing-amount">
                  <span className="lp-pricing-currency">$</span>
                  <span className="lp-pricing-price">{plan.price}</span>
                  <span className="lp-pricing-period">ARS/mes</span>
                </div>
                <p className="lp-pricing-sub">{plan.desc}</p>
                <ul className="lp-pricing-features">
                  {[
                    "Reservas y turnos fijos",
                    "Torneos y fixtures",
                    "Jugadores y profesores",
                    "Estadísticas e informes",
                    "Acceso público para clientes",
                    "Soporte personalizado",
                  ].map((feat) => (
                    <li key={feat}>{feat}</li>
                  ))}
                </ul>
                <a
                  className={plan.featured ? "lp-btn-primary lp-pricing-cta" : "lp-btn-outline lp-pricing-cta"}
                  href={WA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Empezar prueba gratis
                </a>
              </div>
            ))}
          </div>
          <p className="lp-pricing-note">Todos los planes incluyen 2 semanas de prueba · Sin permanencia · Cancelás cuando quieras</p>
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
            <a
              className="lp-btn-primary"
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginTop: 24, alignSelf: "flex-start" }}
            >
              Probá gratis →
            </a>
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
              <div className="lp-phone-island" />
              <div className="lp-phone-screen">
                <img src={screenshotMobile} alt="Vista mobile" className="lp-screenshot" />
              </div>
              <div className="lp-phone-home" />
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="lp-cta-section">
        <div className="lp-container lp-cta">
          <p className="lp-eyebrow">Sin compromisos</p>
          <h2 className="lp-section-title">Empezá tu prueba gratuita hoy</h2>
          <p className="lp-section-sub">
            Sin tarjeta de crédito. Sin contratos. Probá todas las funciones durante el período de prueba y decidís después.
          </p>
          <div className="lp-cta-actions">
            <a
              className="lp-btn-primary lp-btn-xl"
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Escribinos por WhatsApp
            </a>
            <button className="lp-btn-outline lp-btn-xl" onClick={() => navigate("/login")}>
              Ya tengo cuenta →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="lp-footer">
          <div className="lp-footer-bottom">
            <p className="lp-footer-text">© {new Date().getFullYear()} Devolea · Todos los derechos reservados</p>
          </div>
      </footer>
    </div>
  );
}
