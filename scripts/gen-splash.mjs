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

// Logo (abgerundet) zentriert auf dunklem Hintergrund – passend zum Logo-Navy
import { readFileSync } from "node:fs";

const logoSvg = readFileSync("assets/logo.svg");

mkdirSync("public/splash", { recursive: true });
for (const [w, h] of sizes) {
  const logoSize = Math.round(w * 0.55);
  const radius = Math.round(logoSize * 0.22);
  const logo = await sharp(logoSvg)
    .resize(logoSize, logoSize)
    .composite([
      {
        input: Buffer.from(
          `<svg width="${logoSize}" height="${logoSize}"><rect width="${logoSize}" height="${logoSize}" rx="${radius}" fill="#fff"/></svg>`
        ),
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  await sharp({
    create: { width: w, height: h, channels: 4, background: "#1b2342" },
  })
    .composite([
      {
        input: logo,
        left: Math.round((w - logoSize) / 2),
        top: Math.round((h - logoSize) / 2) - Math.round(h * 0.03),
      },
    ])
    .png()
    .toFile(`public/splash/splash-${w}x${h}.png`);
  console.log(`splash-${w}x${h}.png erstellt`);
}
