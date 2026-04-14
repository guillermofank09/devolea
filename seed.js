#!/usr/bin/env node
/**
 * Devolea — seed script
 * Genera jugadores y profesores de prueba para un club.
 *
 * Uso:
 *   node seed.js --url http://localhost:3001 --user demo@club.com --pass 123456
 *
 * Opciones:
 *   --url    Base URL del backend          (default: http://localhost:3001)
 *   --user   Email del club a poblar       (requerido)
 *   --pass   Password del club             (requerido)
 *   --players  Cantidad de jugadores       (default: 40)
 *   --profesores Cantidad de profesores    (default: 5)
 *   --dry    Solo muestra los datos, no los inserta
 */

const args = process.argv.slice(2);
const get = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : def;
};
const has = (flag) => args.includes(flag);

const BASE_URL   = get("--url", "http://localhost:3001");
const USERNAME   = get("--user", "");
const PASSWORD   = get("--pass", "");
const N_PLAYERS  = parseInt(get("--players", "40"), 10);
const N_PROF     = parseInt(get("--profesores", "5"), 10);
const DRY        = has("--dry");

if (!USERNAME || !PASSWORD) {
  console.error("❌  Falta --user y/o --pass\n");
  console.error("Uso: node seed.js --url http://localhost:3001 --user USERNAME --pass PASSWORD");
  process.exit(1);
}

// ── datos de muestra ──────────────────────────────────────────────────────────

const FIRST_M = ["Matías","Santiago","Nicolás","Facundo","Lucas","Ignacio","Tomás","Agustín","Franco","Ramiro","Ezequiel","Rodrigo","Leandro","Sebastián","Diego","Pablo","Martín","Gustavo","Emiliano","Fernando"];
const FIRST_F = ["Valentina","Sofía","Lucía","Camila","Florencia","Agustina","Micaela","Paula","Natalia","Carolina","Julieta","Romina","Vanesa","Daniela","Mariana","Cecilia","Jimena","Lorena","Rocío","Milagros"];
const LAST    = ["García","Rodríguez","González","Fernández","López","Martínez","Sánchez","Pérez","Romero","Díaz","Torres","Álvarez","Ruiz","Ramírez","Flores","Acosta","Benítez","Castro","Herrera","Medina","Morales","Ortiz","Silva","Vargas","Cabrera"];

const CATEGORIES = ["PRIMERA","SEGUNDA","TERCERA","CUARTA","QUINTA","SEXTA","SEPTIMA"];
const CITIES     = ["Buenos Aires","Córdoba","Rosario","Mendoza","La Plata","Mar del Plata","Tucumán","Salta","Quilmes","Bahía Blanca"];
const DAYS       = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randPhone = () => `+549${randInt(1100,1199)}${randInt(1000000,9999999)}`;
const randDate = (minAge, maxAge) => {
  const y = new Date().getFullYear() - randInt(minAge, maxAge);
  const m = String(randInt(1, 12)).padStart(2, "0");
  const d = String(randInt(1, 28)).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

function makePlayer(i) {
  const sex = Math.random() < 0.55 ? "MASCULINO" : "FEMENINO";
  const firstName = rand(sex === "MASCULINO" ? FIRST_M : FIRST_F);
  const lastName  = rand(LAST);
  // distribute categories: more players in mid-low tiers
  const catWeights = [5,10,20,25,20,12,8]; // PRIMERA→SEPTIMA
  const roll = randInt(1, 100);
  let cum = 0, catIdx = 0;
  for (let w = 0; w < catWeights.length; w++) { cum += catWeights[w]; if (roll <= cum) { catIdx = w; break; } }
  return {
    name:     `${firstName} ${lastName}`,
    sex,
    category: CATEGORIES[catIdx],
    city:     rand(CITIES),
    birthDate: randDate(16, 55),
    phone:    Math.random() < 0.7 ? randPhone() : undefined,
  };
}

function makeProfesor(i) {
  const sex = Math.random() < 0.6 ? "MASCULINO" : "FEMENINO";
  const firstName = rand(sex === "MASCULINO" ? FIRST_M : FIRST_F);
  const lastName  = rand(LAST);
  const numDays   = randInt(3, 5);
  const pickedDays = [...DAYS].sort(() => Math.random() - 0.5).slice(0, numDays);
  const schedule  = pickedDays.map(day => ({
    day,
    isOpen:    true,
    openTime:  `${randInt(7, 10)}:00`,
    closeTime: `${randInt(17, 21)}:00`,
  }));
  return {
    name:       `${firstName} ${lastName}`,
    phone:      Math.random() < 0.8 ? randPhone() : undefined,
    hourlyRate: randInt(3000, 12000),
    schedule,
  };
}

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
        ...(token  ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    const req = lib.request(options, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        let json;
        try { json = JSON.parse(data); } catch { json = { raw: data }; }
        if (res.statusCode >= 400) {
          reject(new Error(`${method} ${path} → ${res.statusCode}: ${JSON.stringify(json)}`));
        } else {
          resolve(json);
        }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🎾  Devolea seed script`);
  console.log(`   Backend : ${BASE_URL}`);
  console.log(`   Club    : ${USERNAME}`);
  console.log(`   Jugadores a crear : ${N_PLAYERS}`);
  console.log(`   Profesores a crear: ${N_PROF}`);
  if (DRY) console.log("   Modo    : DRY RUN (no se insertan datos)\n");
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

  // 2. Generar jugadores
  console.log(`\n👥  Generando ${N_PLAYERS} jugadores...`);
  const players = Array.from({ length: N_PLAYERS }, (_, i) => makePlayer(i));

  // resumen por categoría/sexo
  const summary = {};
  for (const p of players) {
    const k = `${p.category} / ${p.sex}`;
    summary[k] = (summary[k] ?? 0) + 1;
  }
  const catOrder = [...CATEGORIES, "SIN_CATEGORIA"];
  const sexOrder = ["MASCULINO", "FEMENINO"];
  for (const cat of catOrder) {
    for (const sex of sexOrder) {
      const k = `${cat} / ${sex}`;
      if (summary[k]) console.log(`   ${k.padEnd(28)} × ${summary[k]}`);
    }
  }

  if (!DRY) {
    let ok = 0, fail = 0;
    for (const p of players) {
      try {
        await request("POST", "/api/players", p, token);
        ok++;
        process.stdout.write(`\r   ✓ ${ok}/${N_PLAYERS} insertados`);
      } catch (e) {
        fail++;
        console.error(`\n   ✗ Error: ${e.message}`);
      }
    }
    console.log(`\n   Total: ${ok} OK, ${fail} errores`);
  } else {
    console.log("   (dry run — datos no insertados)");
    console.log("\n   Muestra:");
    players.slice(0, 3).forEach(p => console.log("  ", JSON.stringify(p)));
  }

  // 3. Generar profesores
  console.log(`\n👨‍🏫  Generando ${N_PROF} profesores...`);
  const profes = Array.from({ length: N_PROF }, (_, i) => makeProfesor(i));

  if (!DRY) {
    let ok = 0, fail = 0;
    for (const p of profes) {
      try {
        await request("POST", "/api/profesores", p, token);
        ok++;
        process.stdout.write(`\r   ✓ ${ok}/${N_PROF} insertados`);
      } catch (e) {
        fail++;
        console.error(`\n   ✗ Error: ${e.message}`);
      }
    }
    console.log(`\n   Total: ${ok} OK, ${fail} errores`);
  } else {
    console.log("   (dry run — datos no insertados)");
    console.log("\n   Muestra:");
    profes.slice(0, 2).forEach(p => console.log("  ", JSON.stringify(p, null, 2)));
  }

  console.log("\n✅  Seed completado.\n");
}

main().catch(e => {
  console.error("\n❌ ", e.message);
  process.exit(1);
});
