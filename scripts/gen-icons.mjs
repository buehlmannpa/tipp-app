// Erzeugt App-Icons und Favicon aus assets/logo.svg. Einmalig: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";

const svg = readFileSync("assets/logo.svg");

mkdirSync("public/icons", { recursive: true });
for (const size of [180, 192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(`public/icons/icon-${size}.png`);
  console.log(`icon-${size}.png erstellt`);
}

// Favicon: Next.js liefert src/app/icon.png automatisch als Favicon aus
await sharp(svg).resize(128, 128).png().toFile("src/app/icon.png");
console.log("src/app/icon.png (Favicon) erstellt");
