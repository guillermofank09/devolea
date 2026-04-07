/**
 * Generates pwa-192x192.png and pwa-512x512.png from public/favicon.ico.
 * Run automatically as "prebuild" before vite build.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseICO } from "icojs";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const icoPath = join(root, "public", "favicon.ico");

const icoBuffer = readFileSync(icoPath);
const images = await parseICO(icoBuffer, "image/png");

// Pick the largest available icon as source
const largest = images.sort((a, b) => b.width - a.width)[0];
const src = Buffer.from(largest.buffer);

await sharp(src).resize(512, 512).png().toFile(join(root, "public", "pwa-512x512.png"));
await sharp(src).resize(192, 192).png().toFile(join(root, "public", "pwa-192x192.png"));

console.log(
  `✓ PWA icons generated from favicon.ico (source: ${largest.width}×${largest.height})`
);
