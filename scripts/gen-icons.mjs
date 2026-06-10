// Erzeugt die PWA-Icons (PNG) aus einem Inline-SVG. Einmalig: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a84ff"/>
      <stop offset="1" stop-color="#0040dd"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <circle cx="512" cy="470" r="260" fill="#ffffff"/>
  <polygon points="512,330 380,426 430,580 594,580 644,426" fill="#1c1c1e" transform="rotate(8 512 470)"/>
  <text x="512" y="870" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="150" font-weight="bold" fill="#ffffff">WM 26</text>
</svg>`;

mkdirSync("public/icons", { recursive: true });
const buf = Buffer.from(svg);
for (const size of [180, 192, 512]) {
  await sharp(buf).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
  console.log(`icon-${size}.png erstellt`);
}
