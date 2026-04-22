#!/usr/bin/env node
/**
 * Devolea — seed script
 * Genera jugadores, profesores, equipos y torneos de prueba.
 *
 * Uso:
 *   node seed.js --url http://localhost:3001 --user demo@club.com --pass 123456
 *
 * Opciones:
 *   --url         Base URL del backend          (default: http://localhost:3001)
 *   --user        Email del club a poblar       (requerido)
 *   --pass        Password del club             (requerido)
 *   --players     Cantidad de jugadores         (default: 60)
 *   --profesores  Cantidad de profesores        (default: 5)
 *   --no-torneos  Omitir generación de torneos
 *   --dry         Solo muestra los datos, no los inserta
 */

const args = process.argv.slice(2);
const get  = (flag, def) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : def; };
const has  = (flag) => args.includes(flag);

const BASE_URL    = get("--url", "http://localhost:3001");
const USERNAME    = get("--user", "");
const PASSWORD    = get("--pass", "");
const N_PLAYERS   = parseInt(get("--players", "60"), 10);
const N_PROF      = parseInt(get("--profesores", "5"), 10);
const DRY         = has("--dry");
const NO_TORNEOS  = has("--no-torneos");

if (!USERNAME || !PASSWORD) {
  console.error("❌  Falta --user y/o --pass\n");
  console.error("Uso: node seed.js --url http://localhost:3001 --user EMAIL --pass PASSWORD");
  process.exit(1);
}

// ── datos de muestra ──────────────────────────────────────────────────────────

const FIRST_M = ["Matías","Santiago","Nicolás","Facundo","Lucas","Ignacio","Tomás","Agustín","Franco","Ramiro","Ezequiel","Rodrigo","Leandro","Sebastián","Diego","Pablo","Martín","Gustavo","Emiliano","Fernando","Cristian","Damián","Javier","Claudio","Adrián"];
const FIRST_F = ["Valentina","Sofía","Lucía","Camila","Florencia","Agustina","Micaela","Paula","Natalia","Carolina","Julieta","Romina","Vanesa","Daniela","Mariana","Cecilia","Jimena","Lorena","Rocío","Milagros","Sabrina","Verónica","Claudia","Aldana","Belén"];
const LAST    = ["García","Rodríguez","González","Fernández","López","Martínez","Sánchez","Pérez","Romero","Díaz","Torres","Álvarez","Ruiz","Ramírez","Flores","Acosta","Benítez","Castro","Herrera","Medina","Morales","Ortiz","Silva","Vargas","Cabrera","Ríos","Molina","Vega","Guerrero","Muñoz"];

const PADEL_CATEGORIES = ["PRIMERA","SEGUNDA","TERCERA","CUARTA","QUINTA","SEXTA","SEPTIMA"];
const TENIS_CATEGORIES = ["PRIMERA","SEGUNDA","TERCERA","CUARTA"];
const CITIES           = ["Buenos Aires","Córdoba","Rosario","Mendoza","La Plata","Mar del Plata","Tucumán","Salta","Quilmes","Bahía Blanca","Neuquén","Santa Fe","Posadas","Resistencia"];
const DAYS             = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

const TEAM_PREFIXES  = ["Club","Atlético","Deportivo","Unión","San","Real","FC","Racing","River","Boca","Independiente","Huracán","Ferro","Platense","Villa"];
const TEAM_SUFFIXES  = ["Norte","Sur","Central","Oeste","Junior","United","City","Stars","Lions","Eagles","Warriors","United","FC","Rovers","Rangers"];
const TEAM_CITIES    = ["Posadas","Oberá","Eldorado","Apóstoles","Montecarlo","Leandro N. Alem","Aristóbulo del Valle","San Vicente","Campo Grande"];

const rand    = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randPhone = () => `549${randInt(1100, 1199)}${randInt(1000000, 9999999)}`;
const randDate  = (minAge, maxAge) => {
  const y = new Date().getFullYear() - randInt(minAge, maxAge);
  return `${y}-${String(randInt(1,12)).padStart(2,"0")}-${String(randInt(1,28)).padStart(2,"0")}`;
};
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const pick    = (arr, n) => shuffle(arr).slice(0, n);

const usedNames = new Set();
function uniqueName(sex) {
  for (let i = 0; i < 50; i++) {
    const first = rand(sex === "MASCULINO" ? FIRST_M : FIRST_F);
    const last  = rand(LAST);
    const name  = `${first} ${last}`;
    if (!usedNames.has(name)) { usedNames.add(name); return name; }
  }
  return `${rand(sex === "MASCULINO" ? FIRST_M : FIRST_F)} ${rand(LAST)} ${randInt(10,99)}`;
}

function makePadelPlayer() {
  const sex  = Math.random() < 0.55 ? "MASCULINO" : "FEMENINO";
  const name = uniqueName(sex);
  const catWeights = [5,10,20,25,20,12,8];
  const roll = randInt(1,100);
  let cum = 0, catIdx = 0;
  for (let w = 0; w < catWeights.length; w++) { cum += catWeights[w]; if (roll <= cum) { catIdx = w; break; } }
  return {
    name, sex,
    category: PADEL_CATEGORIES[catIdx],
    city: rand(CITIES),
    birthDate: randDate(16, 55),
    phone: Math.random() < 0.7 ? randPhone() : undefined,
    sports: ["PADEL"],
  };
}

function makeTenisPlayer() {
  const sex  = Math.random() < 0.5 ? "MASCULINO" : "FEMENINO";
  const name = uniqueName(sex);
  const catWeights = [15, 30, 35, 20]; // PRIMERA→CUARTA
  const roll = randInt(1,100);
  let cum = 0, catIdx = 0;
  for (let w = 0; w < catWeights.length; w++) { cum += catWeights[w]; if (roll <= cum) { catIdx = w; break; } }
  return {
    name, sex,
    category: "SIN_CATEGORIA",
    tenisCategory: TENIS_CATEGORIES[catIdx],
    city: rand(CITIES),
    birthDate: randDate(14, 50),
    phone: Math.random() < 0.7 ? randPhone() : undefined,
    sports: ["TENIS"],
  };
}

function makeGenericPlayer(sport) {
  const sex  = Math.random() < 0.5 ? "MASCULINO" : "FEMENINO";
  const name = uniqueName(sex);
  return {
    name, sex,
    category: "SIN_CATEGORIA",
    city: rand(CITIES),
    birthDate: randDate(15, 45),
    phone: Math.random() < 0.6 ? randPhone() : undefined,
    sports: [sport],
  };
}

function makeProfesor() {
  const sex       = Math.random() < 0.6 ? "MASCULINO" : "FEMENINO";
  const name      = uniqueName(sex);
  const numDays   = randInt(3, 5);
  const pickedDays = pick(DAYS, numDays);
  const schedule  = pickedDays.map(day => ({
    day, isOpen: true,
    openTime:  `${randInt(7,10)}:00`,
    closeTime: `${randInt(17,21)}:00`,
  }));
  return { name, phone: Math.random() < 0.8 ? randPhone() : undefined, hourlyRate: randInt(3000,12000), schedule };
}

function makeEquipo(sport) {
  const usedEquipoNames = makeEquipo._used ??= new Set();
  for (let i = 0; i < 30; i++) {
    const name = `${rand(TEAM_PREFIXES)} ${rand(TEAM_SUFFIXES)}`;
    if (!usedEquipoNames.has(name)) { usedEquipoNames.add(name); return { name, sport, city: rand(TEAM_CITIES), sex: "" }; }
  }
  return { name: `Equipo ${randInt(100,999)}`, sport, city: rand(TEAM_CITIES), sex: "" };
}

// Tournaments config
const today = new Date();
const dateStr = (offsetDays) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
};

const TOURNAMENTS = [
  {
    name: "Torneo Pádel Mixto 2026",
    sport: "PADEL",
    category: "SIN_CATEGORIA",
    sex: "MIXTO",
    startDate: dateStr(7),
    endDate: dateStr(60),
    pairsCount: randInt(14, 20),
    type: "padel",
  },
  {
    name: "Torneo Pádel Masculino 3ra",
    sport: "PADEL",
    category: "TERCERA",
    sex: "MASCULINO",
    startDate: dateStr(14),
    endDate: dateStr(75),
    pairsCount: randInt(12, 18),
    type: "padel",
  },
  {
    name: "Torneo Pádel Femenino 4ta",
    sport: "PADEL",
    category: "CUARTA",
    sex: "FEMENINO",
    startDate: dateStr(21),
    endDate: dateStr(80),
    pairsCount: randInt(12, 16),
    type: "padel",
  },
  {
    name: "Torneo Tenis Open 2026",
    sport: "TENIS",
    category: "SIN_CATEGORIA",
    sex: "MIXTO",
    startDate: dateStr(10),
    endDate: dateStr(55),
    playersCount: randInt(12, 20),
    type: "tenis",
  },
  {
    name: "Torneo Fútbol 7 Apertura",
    sport: "FUTBOL7",
    category: "SIN_CATEGORIA",
    sex: "MASCULINO",
    startDate: dateStr(5),
    endDate: dateStr(90),
    teamsCount: randInt(10, 12),
    type: "equipo",
    equipoSport: "FUTBOL7",
  },
  {
    name: "Torneo Vóley Copa Verano",
    sport: "VOLEY",
    category: "SIN_CATEGORIA",
    sex: "MIXTO",
    startDate: dateStr(3),
    endDate: dateStr(70),
    teamsCount: randInt(10, 12),
    type: "equipo",
    equipoSport: "VOLEY",
  },
  {
    name: "Torneo Básquet Clausura",
    sport: "BASQUET",
    category: "SIN_CATEGORIA",
    sex: "MASCULINO",
    startDate: dateStr(12),
    endDate: dateStr(85),
    teamsCount: randInt(10, 12),
    type: "equipo",
    equipoSport: "BASQUET",
  },
];

// ── HTTP helpers ──────────────────────────────────────────────────────────────

const https = require("https");
const http  = require("http");

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url     = new URL(`${BASE_URL}${path}`);
    const lib     = url.protocol === "https:" ? https : http;
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port:     url.port || (url.protocol === "https:" ? 443 : 80),
      path:     url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        ...(token   ? { Authorization: `Bearer ${token}` }            : {}),
      },
    };
    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        let json;
        try { json = JSON.parse(data); } catch { json = { raw: data }; }
        if (res.statusCode >= 400) reject(new Error(`${method} ${path} → ${res.statusCode}: ${JSON.stringify(json)}`));
        else resolve(json);
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function insertMany(label, items, endpoint, token) {
  let ok = 0, fail = 0;
  const results = [];
  for (const item of items) {
    try {
      const res = await request("POST", endpoint, item, token);
      results.push(res);
      ok++;
      process.stdout.write(`\r   ✓ ${ok}/${items.length} ${label}`);
    } catch (e) {
      fail++;
      process.stdout.write(`\r   ✗ error (${e.message.slice(0,60)})`);
    }
  }
  console.log(`\n   Total: ${ok} OK${fail ? `, ${fail} errores` : ""}`);
  return results;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n⚽🎾  Devolea seed script`);
  console.log(`   Backend  : ${BASE_URL}`);
  console.log(`   Club     : ${USERNAME}`);
  if (DRY) console.log("   Modo     : DRY RUN\n");
  else console.log();

  // 1. Login
  process.stdout.write("🔐  Autenticando... ");
  let token;
  if (!DRY) {
    const auth = await request("POST", "/api/auth/login", { username: USERNAME, password: PASSWORD });
    token = auth.token;
    console.log("OK");
  } else {
    console.log("(saltado en dry run)");
  }

  // 2. Jugadores de Pádel
  const nPadel = Math.ceil(N_PLAYERS * 0.5);
  console.log(`\n🎾  Generando ${nPadel} jugadores de Pádel...`);
  const padelPlayers = Array.from({ length: nPadel }, makePadelPlayer);
  let createdPadelPlayers = [];
  if (!DRY) createdPadelPlayers = await insertMany("jugadores pádel", padelPlayers, "/api/players", token);
  else { console.log("   (dry run)"); padelPlayers.slice(0,2).forEach(p => console.log("  ", JSON.stringify(p))); }

  // 3. Jugadores de Tenis
  const nTenis = Math.ceil(N_PLAYERS * 0.25);
  console.log(`\n🎾  Generando ${nTenis} jugadores de Tenis...`);
  const tenisPlayers = Array.from({ length: nTenis }, makeTenisPlayer);
  let createdTenisPlayers = [];
  if (!DRY) createdTenisPlayers = await insertMany("jugadores tenis", tenisPlayers, "/api/players", token);
  else { console.log("   (dry run)"); }

  // 4. Profesores
  console.log(`\n👨‍🏫  Generando ${N_PROF} profesores...`);
  const profes = Array.from({ length: N_PROF }, makeProfesor);
  if (!DRY) await insertMany("profesores", profes, "/api/profesores", token);
  else { console.log("   (dry run)"); }

  if (NO_TORNEOS) {
    console.log("\n⏭️   Torneos omitidos (--no-torneos)\n");
    console.log("✅  Seed completado.\n");
    return;
  }

  // 5. Equipos y torneos
  for (const t of TOURNAMENTS) {
    console.log(`\n🏆  Torneo: ${t.name}`);

    let tournamentId;
    if (!DRY) {
      const { sport, category, sex, name, startDate, endDate } = t;
      const created = await request("POST", "/api/tournaments", { name, sport, category, sex, startDate, endDate }, token);
      tournamentId = created.id;
      console.log(`   → Creado con ID ${tournamentId}`);
    } else {
      console.log(`   → (dry run) ${JSON.stringify({ name: t.name, sport: t.sport, sex: t.sex })}`);
    }

    // Pádel: agregar parejas
    if (t.type === "padel") {
      const n = t.pairsCount;
      console.log(`   → Agregando ${n} parejas...`);
      if (!DRY) {
        // shuffle para variedad, filtrar por sexo si aplica
        let pool = [...createdPadelPlayers];
        if (t.sex === "MASCULINO") pool = pool.filter(p => p.sex === "MASCULINO");
        if (t.sex === "FEMENINO")  pool = pool.filter(p => p.sex === "FEMENINO");
        pool = shuffle(pool);

        const used = new Set();
        let pairs = 0, attempts = 0;
        while (pairs < n && attempts < pool.length - 1) {
          const p1 = pool[attempts * 2 % pool.length];
          const p2 = pool[(attempts * 2 + 1) % pool.length];
          if (!p1 || !p2 || p1.id === p2.id || used.has(p1.id) || used.has(p2.id)) { attempts++; continue; }
          try {
            await request("POST", `/api/tournaments/${tournamentId}/pairs`, { player1Id: p1.id, player2Id: p2.id }, token);
            used.add(p1.id); used.add(p2.id);
            pairs++;
            process.stdout.write(`\r   ✓ ${pairs}/${n} parejas`);
          } catch (e) {
            process.stdout.write(`\r   ✗ pareja error`);
          }
          attempts++;
        }
        console.log(`\n   Total: ${pairs} parejas agregadas`);
      } else {
        console.log(`   → (dry run) ${n} parejas`);
      }
    }

    // Tenis: agregar jugadores individuales (player2Id = null / omitido)
    if (t.type === "tenis") {
      const n = t.playersCount;
      console.log(`   → Agregando ${n} jugadores de tenis...`);
      if (!DRY) {
        const pool = shuffle([...createdTenisPlayers]);
        let added = 0;
        for (let i = 0; i < Math.min(n, pool.length); i++) {
          try {
            await request("POST", `/api/tournaments/${tournamentId}/pairs`, { player1Id: pool[i].id }, token);
            added++;
            process.stdout.write(`\r   ✓ ${added}/${n} jugadores`);
          } catch (e) {
            process.stdout.write(`\r   ✗ error`);
          }
        }
        console.log(`\n   Total: ${added} jugadores agregados`);
      } else {
        console.log(`   → (dry run) ${n} jugadores`);
      }
    }

    // Equipos: crear equipos y agregarlos al torneo
    if (t.type === "equipo") {
      const n = t.teamsCount;
      console.log(`   → Creando ${n} equipos de ${t.equipoSport}...`);
      if (!DRY) {
        let addedTeams = 0;
        for (let i = 0; i < n; i++) {
          try {
            const equipo = makeEquipo(t.equipoSport);
            const created = await request("POST", "/api/equipos", equipo, token);
            await request("POST", `/api/tournaments/${tournamentId}/teams`, { equipoId: created.id }, token);
            addedTeams++;
            process.stdout.write(`\r   ✓ ${addedTeams}/${n} equipos`);
          } catch (e) {
            process.stdout.write(`\r   ✗ error: ${e.message.slice(0,50)}`);
          }
        }
        console.log(`\n   Total: ${addedTeams} equipos agregados`);
      } else {
        console.log(`   → (dry run) ${n} equipos`);
        for (let i = 0; i < 2; i++) console.log("    ", JSON.stringify(makeEquipo(t.equipoSport)));
      }
    }
  }

  console.log("\n✅  Seed completado.\n");
}

main().catch(e => {
  console.error("\n❌ ", e.message);
  process.exit(1);
});
