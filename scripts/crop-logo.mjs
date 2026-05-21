/**
 * Crop the source logo render (apps/web/public/logo_asli.png) into:
 *   - apps/web/public/logo.png      (tight transparent-bg, used in header)
 *   - apps/web/public/logo-mark.png (512x512 square, used as favicon / app icon)
 *
 * Steps:
 *   1. Extract the main hero region (drops the small "01" badge at top and the
 *      two thumbnail variants + watermark at the bottom).
 *   2. Sample background color from a known dark area, then knock it out
 *      (alpha=0) with a soft feathered edge.
 *   3. Trim transparent border, compute alpha-weighted center of mass,
 *      then build a square canvas where the CoM is dead center.
 *
 * Run with:  pnpm dlx tsx scripts/crop-logo.mjs   (or: node scripts/crop-logo.mjs)
 */
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const src = 'apps/web/public/logo_asli.png';
const out = 'apps/web/public/logo.png';
const outMark = 'apps/web/public/logo-mark.png';

const meta = await sharp(src).metadata();
console.log('Source:', meta.width, 'x', meta.height);

// 1. Manual hero crop — exclude top "01" pill, bottom thumbnails, watermark
//    Tuned for the 1254x1254 source; ratios make it robust if size changes.
const heroTop = Math.round(meta.height * 0.14);    // skip "01" badge
const heroBottom = Math.round(meta.height * 0.69); // skip thumbnails + watermark
const heroLeft = Math.round(meta.width * 0.05);
const heroRight = Math.round(meta.width * 0.95);
const hero = await sharp(src)
  .extract({
    left: heroLeft,
    top: heroTop,
    width: heroRight - heroLeft,
    height: heroBottom - heroTop,
  })
  .png()
  .toBuffer();
const hmeta = await sharp(hero).metadata();
console.log('Hero region:', hmeta.width, 'x', hmeta.height);

// 2. Sample background color from a top-left corner pixel of the hero crop
const probe = await sharp(hero).extract({ left: 4, top: 4, width: 1, height: 1 }).raw().toBuffer();
const [r, g, b] = probe;
console.log(`Background sample: rgb(${r},${g},${b})`);

// 3. Knock out background — pure black-ish bg goes to alpha 0, soft feather on edges
const heroRaw = await sharp(hero).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const px = Buffer.from(heroRaw.data);
const FUZZ = 24;     // distance threshold
const FEATHER = 18;  // soft alpha edge band
for (let i = 0; i < px.length; i += 4) {
  const dr = px[i] - r;
  const dg = px[i + 1] - g;
  const db = px[i + 2] - b;
  const dist = Math.sqrt(dr * dr + dg * dg + db * db);
  if (dist <= FUZZ) {
    px[i + 3] = 0;
  } else if (dist < FUZZ + FEATHER) {
    px[i + 3] = Math.round(((dist - FUZZ) / FEATHER) * 255);
  }
}
const knocked = await sharp(px, {
  raw: { width: heroRaw.info.width, height: heroRaw.info.height, channels: 4 },
}).png().toBuffer();

// 4. Trim alpha border
const tight = await sharp(knocked).trim({ threshold: 5 }).png().toBuffer();
const tmeta = await sharp(tight).metadata();
console.log('Tight bbox:', tmeta.width, 'x', tmeta.height);

// 5. Compute alpha-weighted center of mass
const tightRaw = await sharp(tight).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const td = tightRaw.data;
const tw = tightRaw.info.width;
const th = tightRaw.info.height;
let sumX = 0, sumY = 0, sumA = 0;
for (let y = 0; y < th; y++) {
  for (let x = 0; x < tw; x++) {
    const a = td[(y * tw + x) * 4 + 3];
    if (a < 12) continue;
    sumX += x * a;
    sumY += y * a;
    sumA += a;
  }
}
const cx = sumX / sumA;
const cy = sumY / sumA;
console.log(`Center of mass: (${cx.toFixed(0)}, ${cy.toFixed(0)})  bbox center: (${(tw / 2) | 0}, ${(th / 2) | 0})`);

// 6. Build square canvas with CoM at center + small breathing-room padding
const halfSide = Math.max(cx, tw - cx, cy, th - cy);
const breathing = halfSide * 0.06;
const side = Math.round((halfSide + breathing) * 2);
const padLeft = Math.round(side / 2 - cx);
const padTop = Math.round(side / 2 - cy);
const padRight = side - tw - padLeft;
const padBottom = side - th - padTop;

const padded = await sharp(tight)
  .extend({
    top: padTop, bottom: padBottom, left: padLeft, right: padRight,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

const pmeta = await sharp(padded).metadata();
console.log(`Padded square: ${pmeta.width}x${pmeta.height} (offsets t${padTop} r${padRight} b${padBottom} l${padLeft})`);

// 7. Write outputs
writeFileSync(out, padded);
console.log('Wrote', out);

// 8. Also export a 512x512 mark for favicon/app-icon use
const mark = await sharp(padded)
  .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();
writeFileSync(outMark, mark);
console.log('Wrote', outMark, '(512x512)');
