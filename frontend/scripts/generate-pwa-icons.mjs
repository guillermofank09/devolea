/**
 * Generates PWA icons from public/favicon.png using sharp.
 * Run automatically as "prebuild" before vite build.
 */
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "public", "favicon.png");

await sharp(src).resize(512, 512).png().toFile(join(root, "public", "pwa-512x512.png"));
await sharp(src).resize(192, 192).png().toFile(join(root, "public", "pwa-192x192.png"));
await sharp(src).resize(180, 180).png().toFile(join(root, "public", "apple-touch-icon.png"));
await sharp(src).resize(32, 32).png().toFile(join(root, "public", "favicon-32x32.png"));

console.log("✓ PWA icons generated from favicon.png");
