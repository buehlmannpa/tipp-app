// Erzeugt iOS-Startbilder (apple-touch-startup-image). Einmalig: node scripts/gen-splash.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

// [Breite, Höhe, Gerätegruppe] in Geräte-Pixeln (Portrait)
const sizes = [
  [1290, 2796], // iPhone 15/16 Pro Max, 14 Pro Max
  [1179, 2556], // iPhone 15/16 Pro, 14 Pro
  [1170, 2532], // iPhone 12/13/14
  [1125, 2436], // iPhone X/XS/11 Pro
  [828, 1792], // iPhone XR/11
  [750, 1334], // iPhone SE 2/3, 8
];

const svg = (w, h) => {
  const cx = w / 2;
  const cy = h / 2 - w * 0.05;
  const r = w * 0.13;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a84ff"/>
      <stop offset="1" stop-color="#0040dd"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f2f2f7"/>
  <rect x="${cx - r * 1.55}" y="${cy - r * 1.55}" width="${r * 3.1}" height="${r * 3.1}"
        rx="${r * 0.7}" fill="url(#bg)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff"/>
  <polygon fill="#1c1c1e" transform="rotate(8 ${cx} ${cy})"
           points="${cx},${cy - r * 0.55} ${cx - r * 0.52},${cy - r * 0.17} ${cx - r * 0.32},${cy + r * 0.45} ${cx + r * 0.32},${cy + r * 0.45} ${cx + r * 0.52},${cy - r * 0.17}"/>
  <text x="${cx}" y="${cy + r * 2.2}" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-size="${w * 0.045}"
        font-weight="bold" fill="#000000">WM Tippspiel 2026</text>
</svg>`;
};

mkdirSync("public/splash", { recursive: true });
for (const [w, h] of sizes) {
  await sharp(Buffer.from(svg(w, h))).png().toFile(`public/splash/splash-${w}x${h}.png`);
  console.log(`splash-${w}x${h}.png erstellt`);
}
