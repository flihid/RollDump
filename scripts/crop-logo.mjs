import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';

const src = 'apps/web/public/logo.png';
const out = 'apps/web/public/logo.png';
const outMark = 'apps/web/public/logo-mark.png';

// Background color from the original render (sampled rgb(49,50,54) corner)
const r = 49, g = 50, b = 54;
console.log('Target background color:', `rgb(${r},${g},${b})`);

// 1. Cover the AI sparkle watermark (bottom-right corner) with background-color rectangle
const meta = await sharp(src).metadata();
console.log('Original:', meta.width, 'x', meta.height);

const coverW = Math.round(meta.width * 0.1);   // ~10% of width
const coverH = Math.round(meta.height * 0.12); // ~12% of height
const coverLeft = meta.width - coverW;
const coverTop = meta.height - coverH;

const cleaned = await sharp(src)
  .composite([{
    input: {
      create: {
        width: coverW,
        height: coverH,
        channels: 3,
        background: { r, g, b },
      },
    },
    left: coverLeft,
    top: coverTop,
  }])
  .png()
  .toBuffer();

// 2. Tight-trim the dark padding around the logo
// Threshold needs to be loose enough to ignore the gradient background variation
const trimmed = await sharp(cleaned).trim({ threshold: 25 }).png().toBuffer();

const tmeta = await sharp(trimmed).metadata();
console.log('Trimmed:', tmeta.width, 'x', tmeta.height);

// 3. Knock out background — convert the dark grey bg pixels to alpha.
// Build alpha mask: opaque where pixel distance from bg color > 35, transparent otherwise.
const raw = await sharp(trimmed).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { data, info } = raw;
const px = Buffer.from(data); // RGBA
const FUZZ = 60; // distance threshold; bg + grain knocked out below this
const FEATHER = 22; // soft alpha fade over this many distance units
for (let i = 0; i < px.length; i += 4) {
  const dr = px[i] - r;
  const dg = px[i + 1] - g;
  const db = px[i + 2] - b;
  const dist = Math.sqrt(dr * dr + dg * dg + db * db);
  if (dist <= FUZZ) {
    px[i + 3] = 0; // fully transparent
  } else if (dist < FUZZ + FEATHER) {
    // soft alpha edge for anti-aliasing
    px[i + 3] = Math.round(((dist - FUZZ) / FEATHER) * 255);
  }
}
const knocked = await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png()
  .toBuffer();

// 4. Add a small breathing-room padding (4% on each side)
const kmeta = await sharp(knocked).metadata();
const pad = Math.round(Math.max(kmeta.width, kmeta.height) * 0.04);
const padded = await sharp(knocked)
  .extend({
    top: pad, bottom: pad, left: pad, right: pad,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

const pmeta = await sharp(padded).metadata();
console.log('Padded:', pmeta.width, 'x', pmeta.height);

writeFileSync(out, padded);
console.log('Wrote', out);

// 5. Also export a small square "mark" version (200x200) for favicon-ish use
const size = Math.max(pmeta.width, pmeta.height);
const square = await sharp(padded)
  .extend({
    top: Math.floor((size - pmeta.height) / 2),
    bottom: Math.ceil((size - pmeta.height) / 2),
    left: Math.floor((size - pmeta.width) / 2),
    right: Math.ceil((size - pmeta.width) / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
writeFileSync(outMark, square);
console.log('Wrote', outMark, '(512x512 transparent square)');
