/**
 * Generates favicon.ico (16, 32, 48, 256px) from a source image using sharp.
 * Usage: node scripts/gen-favicon.mjs <source-png>
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = process.argv[2] ?? path.resolve(__dirname, "../src/assets/logo.png");
const PUB = path.resolve(__dirname, "../public");

async function resize(src, size) {
  return sharp(src)
    .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();
}

function packIco(pngs) {
  const count = pngs.length;
  const headerSize = 6;
  const entrySize = 16;
  const dataOffset = headerSize + entrySize * count;
  const offsets = [];
  let pos = dataOffset;
  for (const buf of pngs) { offsets.push(pos); pos += buf.length; }
  const ico = Buffer.alloc(pos);
  ico.writeUInt16LE(0, 0);
  ico.writeUInt16LE(1, 2);
  ico.writeUInt16LE(count, 4);
  for (let i = 0; i < count; i++) {
    const base = headerSize + i * entrySize;
    const w = pngs[i].readUInt32BE(16);
    const h = pngs[i].readUInt32BE(20);
    ico.writeUInt8(w >= 256 ? 0 : w, base);
    ico.writeUInt8(h >= 256 ? 0 : h, base + 1);
    ico.writeUInt8(0, base + 2);
    ico.writeUInt8(0, base + 3);
    ico.writeUInt16LE(1,  base + 4);
    ico.writeUInt16LE(32, base + 6);
    ico.writeUInt32LE(pngs[i].length, base + 8);
    ico.writeUInt32LE(offsets[i], base + 12);
  }
  let wp = dataOffset;
  for (const buf of pngs) { buf.copy(ico, wp); wp += buf.length; }
  return ico;
}

async function main() {
  console.log("Source:", SRC);
  const sizes = [16, 32, 48, 256];
  const pngs = await Promise.all(sizes.map(s => resize(SRC, s)));
  fs.writeFileSync(path.join(PUB, "favicon.ico"), packIco(pngs));
  console.log(`✓ favicon.ico (${sizes.join(", ")}px)`);
  const png32 = await resize(SRC, 32);
  fs.writeFileSync(path.join(PUB, "favicon-32x32.png"), png32);
  console.log("✓ favicon-32x32.png");
}

main().catch(e => { console.error(e); process.exit(1); });
