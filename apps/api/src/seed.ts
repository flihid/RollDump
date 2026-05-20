import { eq, sql } from 'drizzle-orm';
import { brands, films, filmVariants, cameras, lenses, achievements } from '@rolldump/db';
import { slugify } from './lib/context';

/**
 * Real-world analog film catalog seed.
 * 12 brands · ~55 stocks · variants in 35mm / 120 / 4x5 sheet where applicable.
 */

const BRAND_DATA = [
  { name: 'Kodak', country: 'USA', founded: 1888, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Logo_of_the_Eastman_Kodak_Company.svg/320px-Logo_of_the_Eastman_Kodak_Company.svg.png', desc: 'Photography pioneer since 1888 — Portra, Gold, Tri-X, Ektachrome.' },
  { name: 'Ilford', country: 'UK', founded: 1879, logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bb/ILFORD_LOGO.svg/320px-ILFORD_LOGO.svg.png', desc: 'British black-and-white specialists. HP5 and the Delta line.' },
  { name: 'Fujifilm', country: 'Japan', founded: 1934, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Fujifilm_logo.svg/320px-Fujifilm_logo.svg.png', desc: 'Japanese color emulsion innovator — Velvia, Provia, Acros.' },
  { name: 'Cinestill', country: 'USA', founded: 2012, logo: '', desc: 'Repurposed Hollywood motion-picture stock for still photography.' },
  { name: 'Lomography', country: 'Austria', founded: 1992, logo: '', desc: 'Lo-fi, experimental, and creative emulsions for analog culture.' },
  { name: 'Kentmere', country: 'UK', founded: 1990, logo: '', desc: 'Budget black-and-white film made by Harman / Ilford.' },
  { name: 'Rollei', country: 'Germany', founded: 1920, logo: '', desc: 'German technical and surveillance films, plus classic B&W stocks.' },
  { name: 'Adox', country: 'Germany', founded: 1860, logo: '', desc: 'Oldest photo brand in the world — fine-grain B&W and revival color.' },
  { name: 'Foma', country: 'Czechia', founded: 1921, logo: '', desc: 'Czech analog institution — Fomapan classic and reversal B&W.' },
  { name: 'Bergger', country: 'France', founded: 1995, logo: '', desc: 'French boutique brand making dual-emulsion silver-rich B&W film.' },
  { name: 'Shanghai', country: 'China', founded: 1958, logo: '', desc: 'Chinese state photo brand — GP3 is a long-running B&W workhorse.' },
  { name: 'Ferrania', country: 'Italy', founded: 1923, logo: '', desc: 'Revived Italian heritage brand — P30 cinema-style B&W stock.' },
];

type Variant = {
  format: string;
  exposures: number;
  frameSize?: string;
  pushPullRange?: string;
  dxCoded?: boolean;
  msrpUsd?: number;
};

const FILM_DATA: Array<{
  brand: string;
  name: string;
  iso: number;
  colorType: 'color_negative' | 'bw' | 'slide_e6' | 'color_positive';
  year?: number;
  status?: 'active' | 'discontinued';
  cover: string;
  description: string;
  variants: Variant[];
}> = [
  // ─────── Kodak ───────
  {
    brand: 'Kodak', name: 'Portra 160', iso: 160, colorType: 'color_negative', year: 2010,
    cover: '', description: 'Professional color negative film prized for soft, accurate skin tones and exceptionally fine grain.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '-1..+2', dxCoded: true, msrpUsd: 17 },
      { format: '120', exposures: 16, frameSize: '6x4.5', pushPullRange: '-1..+2', msrpUsd: 13 },
      { format: '4x5', exposures: 10, frameSize: '4x5', msrpUsd: 80 },
    ],
  },
  {
    brand: 'Kodak', name: 'Portra 400', iso: 400, colorType: 'color_negative', year: 1998,
    cover: '', description: 'The most popular pro color negative film — natural skin tones with usable latitude from -1 to +2 stops.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '-1..+2', dxCoded: true, msrpUsd: 18 },
      { format: '120', exposures: 16, frameSize: '6x4.5', pushPullRange: '-1..+2', msrpUsd: 13 },
      { format: '4x5', exposures: 10, frameSize: '4x5', msrpUsd: 85 },
    ],
  },
  {
    brand: 'Kodak', name: 'Portra 800', iso: 800, colorType: 'color_negative', year: 1998,
    cover: '', description: 'Fast pro color negative with surprisingly fine grain — great for low light, indoor, and concerts.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 21 },
      { format: '120', exposures: 16, frameSize: '6x4.5', msrpUsd: 16 },
    ],
  },
  {
    brand: 'Kodak', name: 'Gold 200', iso: 200, colorType: 'color_negative', year: 1986,
    cover: '', description: 'Iconic warm color cast and rich saturation at a friendly consumer price.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 11 },
      { format: '120', exposures: 16, frameSize: '6x4.5', msrpUsd: 12 },
    ],
  },
  {
    brand: 'Kodak', name: 'ColorPlus 200', iso: 200, colorType: 'color_negative', year: 2008,
    cover: '', description: 'Budget consumer color negative with classic Kodak palette — vibrant and forgiving.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 9 }],
  },
  {
    brand: 'Kodak', name: 'UltraMax 400', iso: 400, colorType: 'color_negative', year: 1995,
    cover: '', description: 'High-speed consumer color negative with punchy saturation, perfect for vacation rolls.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 12 }],
  },
  {
    brand: 'Kodak', name: 'Ektar 100', iso: 100, colorType: 'color_negative', year: 2008,
    cover: '', description: 'Highest saturation and finest grain in any color negative — built for landscape and product work.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 17 },
      { format: '120', exposures: 16, frameSize: '6x4.5', msrpUsd: 14 },
    ],
  },
  {
    brand: 'Kodak', name: 'Tri-X 400', iso: 400, colorType: 'bw', year: 1954,
    cover: '', description: 'The legendary press-photography black-and-white film. Bulletproof, push-friendly, and full of character.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '-1..+3', dxCoded: true, msrpUsd: 12 },
      { format: '120', exposures: 12, frameSize: '6x6', pushPullRange: '-1..+3', msrpUsd: 9 },
    ],
  },
  {
    brand: 'Kodak', name: 'T-Max 100', iso: 100, colorType: 'bw', year: 1986,
    cover: '', description: 'Tabular-grain B&W with the finest grain Kodak has ever made — clinical sharpness and tonal range.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '-1..+2', dxCoded: true, msrpUsd: 11 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 8 },
    ],
  },
  {
    brand: 'Kodak', name: 'T-Max 400', iso: 400, colorType: 'bw', year: 1986,
    cover: '', description: 'Modern T-grain general-purpose B&W with cleaner shadows than Tri-X. Push-friendly.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '-1..+3', dxCoded: true, msrpUsd: 12 },
      { format: '120', exposures: 12, frameSize: '6x6', pushPullRange: '-1..+3', msrpUsd: 9 },
    ],
  },
  {
    brand: 'Kodak', name: 'T-Max P3200', iso: 3200, colorType: 'bw', year: 1988,
    cover: '', description: 'High-speed multi-speed B&W stock for available-light, concerts, and indoor sports.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '0..+2', dxCoded: true, msrpUsd: 16 }],
  },
  {
    brand: 'Kodak', name: 'Ektachrome E100', iso: 100, colorType: 'slide_e6', year: 2018,
    cover: '', description: 'Revived in 2018 — a clean, neutral E6 slide film with extremely fine grain. Perfect for projection.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 20 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 22 },
    ],
  },

  // ─────── Ilford ───────
  {
    brand: 'Ilford', name: 'HP5 Plus 400', iso: 400, colorType: 'bw', year: 1989,
    cover: '', description: 'Versatile, push-friendly British classic. The most forgiving B&W film for new shooters.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '-1..+3', dxCoded: true, msrpUsd: 10 },
      { format: '120', exposures: 12, frameSize: '6x6', pushPullRange: '-1..+3', msrpUsd: 8 },
      { format: '4x5', exposures: 25, frameSize: '4x5', msrpUsd: 95 },
    ],
  },
  {
    brand: 'Ilford', name: 'FP4 Plus 125', iso: 125, colorType: 'bw', year: 1990,
    cover: '', description: 'Medium-speed traditional grain — sharper than HP5 with classic British tonality.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '0..+2', dxCoded: true, msrpUsd: 10 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 8 },
    ],
  },
  {
    brand: 'Ilford', name: 'Delta 100', iso: 100, colorType: 'bw', year: 1992,
    cover: '', description: 'Modern tabular-grain B&W with excellent sharpness and extremely fine grain.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 11 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 9 },
    ],
  },
  {
    brand: 'Ilford', name: 'Delta 400', iso: 400, colorType: 'bw', year: 1990,
    cover: '', description: 'T-grain B&W competitor to T-Max 400 — cleaner shadows, modern look.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '-1..+2', dxCoded: true, msrpUsd: 11 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 9 },
    ],
  },
  {
    brand: 'Ilford', name: 'Delta 3200', iso: 3200, colorType: 'bw', year: 1998,
    cover: '', description: 'High-speed B&W for low light and night photography — distinctive bold grain.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '-1..+1', dxCoded: true, msrpUsd: 14 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 11 },
    ],
  },
  {
    brand: 'Ilford', name: 'Pan F Plus 50', iso: 50, colorType: 'bw', year: 1992,
    cover: '', description: 'Ultra-slow ultra-fine-grain B&W. Studio sharp — needs a tripod or bright sun.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 10 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 8 },
    ],
  },
  {
    brand: 'Ilford', name: 'XP2 Super 400', iso: 400, colorType: 'bw', year: 1992,
    cover: '', description: 'Chromogenic B&W processed in standard C-41 chemistry. Great latitude (ISO 50–800).',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 11 }],
  },
  {
    brand: 'Ilford', name: 'SFX 200', iso: 200, colorType: 'bw', year: 1996,
    cover: '', description: 'Near-infrared sensitive B&W stock. Use with a red filter for the classic IR look.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 13 }],
  },
  {
    brand: 'Ilford', name: 'Ortho Plus 80', iso: 80, colorType: 'bw', year: 2019,
    cover: '', description: 'Orthochromatic film — blind to red, ideal for old-school portrait and lab reproduction.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', msrpUsd: 12 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 10 },
    ],
  },

  // ─────── Fujifilm ───────
  {
    brand: 'Fujifilm', name: 'Velvia 50', iso: 50, colorType: 'slide_e6', year: 1990,
    cover: '', description: 'Legendary E6 slide film for landscape photography. Saturation that hits like a freight train.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 22 },
      { format: '120', exposures: 12, frameSize: '6x7', msrpUsd: 18 },
      { format: '4x5', exposures: 10, frameSize: '4x5', msrpUsd: 110 },
    ],
  },
  {
    brand: 'Fujifilm', name: 'Velvia 100', iso: 100, colorType: 'slide_e6', year: 2005,
    cover: '', description: 'Faster Velvia variant — still highly saturated but a stop more usable.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 22 },
      { format: '120', exposures: 12, frameSize: '6x7', msrpUsd: 19 },
    ],
  },
  {
    brand: 'Fujifilm', name: 'Provia 100F', iso: 100, colorType: 'slide_e6', year: 1996,
    cover: '', description: 'Neutral E6 slide film with truer color — Velvia\'s subtler sibling, popular for portraits and editorial.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 21 },
      { format: '120', exposures: 12, frameSize: '6x7', msrpUsd: 18 },
    ],
  },
  {
    brand: 'Fujifilm', name: 'Fujicolor 200', iso: 200, colorType: 'color_negative', year: 1986,
    cover: '', description: 'Budget consumer color negative — distinctive cool green and cyan cast unique to Fuji.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 9 }],
  },
  {
    brand: 'Fujifilm', name: 'Superia X-tra 400', iso: 400, colorType: 'color_negative', year: 1998,
    cover: '', description: 'Fast consumer color negative with classic green-leaning Fuji palette.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 11 }],
  },
  {
    brand: 'Fujifilm', name: 'Acros 100 II', iso: 100, colorType: 'bw', year: 2019,
    cover: '', description: 'Modern Japanese B&W with extraordinarily fine grain and excellent reciprocity for long exposures.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 13 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 11 },
    ],
  },
  {
    brand: 'Fujifilm', name: 'Pro 400H', iso: 400, colorType: 'color_negative', year: 2004,
    status: 'discontinued',
    cover: '', description: 'Discontinued pro color negative beloved by wedding photographers for its airy, pastel palette.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 30 },
      { format: '120', exposures: 16, frameSize: '6x4.5', msrpUsd: 28 },
    ],
  },

  // ─────── Cinestill ───────
  {
    brand: 'Cinestill', name: '50D', iso: 50, colorType: 'color_negative', year: 2015,
    cover: '', description: 'Daylight-balanced motion-picture stock for still photography. Smooth grain, clean highlights.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 18 },
      { format: '120', exposures: 16, frameSize: '6x4.5', msrpUsd: 21 },
    ],
  },
  {
    brand: 'Cinestill', name: '400D', iso: 400, colorType: 'color_negative', year: 2022,
    cover: '', description: 'Newest Cinestill — daylight-balanced ISO 400 with characteristic Kodak Vision3 latitude.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 19 },
      { format: '120', exposures: 16, frameSize: '6x4.5', msrpUsd: 22 },
    ],
  },
  {
    brand: 'Cinestill', name: '800T', iso: 800, colorType: 'color_negative', year: 2012,
    cover: '', description: 'Tungsten-balanced 800T with iconic red halation around bright lights. Made for neon and cyberpunk vibes.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 20 },
      { format: '120', exposures: 16, frameSize: '6x4.5', msrpUsd: 23 },
    ],
  },
  {
    brand: 'Cinestill', name: 'BwXX', iso: 250, colorType: 'bw', year: 2018,
    cover: '', description: 'Cinema-style B&W double-X. The film that shot Schindler\'s List — push to 800 or even 1600.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '-1..+3', dxCoded: true, msrpUsd: 14 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 12 },
    ],
  },

  // ─────── Lomography ───────
  {
    brand: 'Lomography', name: 'Color Negative 100', iso: 100, colorType: 'color_negative', year: 2007,
    cover: '', description: 'Vibrant, saturated consumer color negative — Lomography\'s entry-level color stock.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 11 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 10 },
    ],
  },
  {
    brand: 'Lomography', name: 'Color Negative 400', iso: 400, colorType: 'color_negative', year: 2007,
    cover: '', description: 'All-rounder Lomography color negative — versatile speed for street and travel.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 12 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 11 },
    ],
  },
  {
    brand: 'Lomography', name: 'Color Negative 800', iso: 800, colorType: 'color_negative', year: 2007,
    cover: '', description: 'Fast color negative with playful saturation — great for low light without going Cinestill.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 13 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 12 },
    ],
  },
  {
    brand: 'Lomography', name: 'LomoChrome Purple', iso: 400, colorType: 'color_negative', year: 2013,
    cover: '', description: 'Color-shifting emulsion that turns greens into purple. The defining Lomography aesthetic.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 16 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 14 },
    ],
  },
  {
    brand: 'Lomography', name: 'LomoChrome Turquoise', iso: 400, colorType: 'color_negative', year: 2014,
    cover: '', description: 'Shifts warm tones to teal and cyan — eerie underwater vibes from a regular C-41 process.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 16 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 14 },
    ],
  },
  {
    brand: 'Lomography', name: 'LomoChrome Metropolis', iso: 400, colorType: 'color_negative', year: 2019,
    cover: '', description: 'Desaturated, muted palette designed for urban scenes — the anti-Velvia.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 16 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 14 },
    ],
  },
  {
    brand: 'Lomography', name: 'Redscale XR 50-200', iso: 100, colorType: 'color_negative', year: 2008,
    cover: '', description: 'Color negative loaded backwards — exposes through the orange base for warm sunset tones.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 10 }],
  },
  {
    brand: 'Lomography', name: 'Berlin Kino 400', iso: 400, colorType: 'bw', year: 2018,
    cover: '', description: 'Rebadged ORWO cinema stock — moody, low-contrast B&W with German cinema character.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 11 }],
  },
  {
    brand: 'Lomography', name: 'Lady Grey 400', iso: 400, colorType: 'bw', year: 2010,
    cover: '', description: 'Classic medium-speed B&W rebadge — versatile and forgiving.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 9 }],
  },

  // ─────── Kentmere ───────
  {
    brand: 'Kentmere', name: 'Pan 100', iso: 100, colorType: 'bw', year: 2005,
    cover: '', description: 'Affordable B&W from the Harman/Ilford factory — surprisingly good tonality for the price.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 7 }],
  },
  {
    brand: 'Kentmere', name: 'Pan 400', iso: 400, colorType: 'bw', year: 2005,
    cover: '', description: 'Budget B&W for everyday shooting and experimentation.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '0..+2', dxCoded: true, msrpUsd: 7 }],
  },

  // ─────── Rollei ───────
  {
    brand: 'Rollei', name: 'RPX 25', iso: 25, colorType: 'bw', year: 2014,
    cover: '', description: 'Ultra-slow B&W for tripod work, alternative processes, and silver-rich enlargements.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 13 }],
  },
  {
    brand: 'Rollei', name: 'RPX 100', iso: 100, colorType: 'bw', year: 2012,
    cover: '', description: 'Classic-grain B&W with German technical precision.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 10 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 9 },
    ],
  },
  {
    brand: 'Rollei', name: 'RPX 400', iso: 400, colorType: 'bw', year: 2012,
    cover: '', description: 'Medium-speed traditional B&W — push-friendly and high acutance.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '-1..+3', dxCoded: true, msrpUsd: 10 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 9 },
    ],
  },
  {
    brand: 'Rollei', name: 'Retro 80S', iso: 80, colorType: 'bw', year: 2008,
    cover: '', description: 'Originally for aerial surveillance — extended red sensitivity and incredible sharpness.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 11 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 10 },
    ],
  },
  {
    brand: 'Rollei', name: 'Infrared 400', iso: 400, colorType: 'bw', year: 2010,
    cover: '', description: 'True infrared-sensitive B&W. Pair with an R72 filter for surreal white foliage and dark skies.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 15 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 13 },
    ],
  },

  // ─────── Adox ───────
  {
    brand: 'Adox', name: 'CHS 100 II', iso: 100, colorType: 'bw', year: 2017,
    cover: '', description: 'Resurrection of a 1950s classic — traditional silver-rich emulsion with vintage tonality.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 13 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 11 },
    ],
  },
  {
    brand: 'Adox', name: 'HR-50', iso: 50, colorType: 'bw', year: 2019,
    cover: '', description: 'Extended red sensitivity with extraordinary resolution — built on a Rollei surveillance base.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 12 }],
  },
  {
    brand: 'Adox', name: 'Color Mission 200', iso: 200, colorType: 'color_negative', year: 2022,
    cover: '', description: 'Limited-run revival color negative — small-batch artisanal C-41 stock.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 19 }],
  },

  // ─────── Foma ───────
  {
    brand: 'Foma', name: 'Fomapan 100 Classic', iso: 100, colorType: 'bw', year: 1990,
    cover: '', description: 'Czech traditional-grain B&W. Pleasant tonal scale and a budget price.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 7 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 6 },
      { format: '4x5', exposures: 50, frameSize: '4x5', msrpUsd: 38 },
    ],
  },
  {
    brand: 'Foma', name: 'Fomapan 200 Creative', iso: 200, colorType: 'bw', year: 1995,
    cover: '', description: 'Modern T-grain hybrid at a friendly price — sharper than the 100 with classic mood.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 8 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 7 },
    ],
  },
  {
    brand: 'Foma', name: 'Fomapan 400 Action', iso: 400, colorType: 'bw', year: 1993,
    cover: '', description: 'Fast traditional B&W. Beautifully grainy when developed in classic chemistry like Rodinal.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '-1..+2', dxCoded: true, msrpUsd: 8 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 7 },
    ],
  },
  {
    brand: 'Foma', name: 'Fomapan R100', iso: 100, colorType: 'bw', year: 2007,
    cover: '', description: 'Black-and-white reversal (slide) film — develops to positive B&W transparencies.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 14 }],
  },

  // ─────── Bergger ───────
  {
    brand: 'Bergger', name: 'Pancro 400', iso: 400, colorType: 'bw', year: 2017,
    cover: '', description: 'Dual-emulsion silver-rich B&W with exceptional shadow detail. Boutique French craft.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '-1..+2', dxCoded: true, msrpUsd: 13 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 11 },
      { format: '4x5', exposures: 25, frameSize: '4x5', msrpUsd: 82 },
    ],
  },

  // ─────── Shanghai ───────
  {
    brand: 'Shanghai', name: 'GP3 100', iso: 100, colorType: 'bw', year: 1958,
    cover: '', description: 'Long-running Chinese B&W with a unique tonal signature. Inexpensive and full of character.',
    variants: [
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 7 },
      { format: '35mm', exposures: 36, frameSize: '24x36', msrpUsd: 8 },
    ],
  },

  // ─────── Ferrania ───────
  {
    brand: 'Ferrania', name: 'P30 80', iso: 80, colorType: 'bw', year: 2017,
    cover: '', description: 'Cinema-style high-silver B&W revived in Italy — deep blacks and exceptional shadow detail.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 13 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 12 },
    ],
  },
];

const CAMERA_DATA = [
  { brand: 'Canon', model: 'AE-1 Program', type: 'slr', formats: ['35mm'], year: 1981 },
  { brand: 'Canon', model: 'A-1', type: 'slr', formats: ['35mm'], year: 1978 },
  { brand: 'Canon', model: 'EOS 1V', type: 'slr', formats: ['35mm'], year: 2000 },
  { brand: 'Nikon', model: 'FM2', type: 'slr', formats: ['35mm'], year: 1982 },
  { brand: 'Nikon', model: 'F3', type: 'slr', formats: ['35mm'], year: 1980 },
  { brand: 'Nikon', model: 'F100', type: 'slr', formats: ['35mm'], year: 1999 },
  { brand: 'Pentax', model: 'K1000', type: 'slr', formats: ['35mm'], year: 1976 },
  { brand: 'Pentax', model: 'MX', type: 'slr', formats: ['35mm'], year: 1976 },
  { brand: 'Pentax', model: '67', type: 'medium_format', formats: ['120'], year: 1969 },
  { brand: 'Olympus', model: 'OM-1', type: 'slr', formats: ['35mm'], year: 1972 },
  { brand: 'Olympus', model: 'OM-2', type: 'slr', formats: ['35mm'], year: 1975 },
  { brand: 'Olympus', model: 'XA', type: 'point_shoot', formats: ['35mm'], year: 1979 },
  { brand: 'Olympus', model: 'Stylus Epic', type: 'point_shoot', formats: ['35mm'], year: 1997 },
  { brand: 'Leica', model: 'M6', type: 'rangefinder', formats: ['35mm'], year: 1984 },
  { brand: 'Leica', model: 'M3', type: 'rangefinder', formats: ['35mm'], year: 1954 },
  { brand: 'Contax', model: 'T2', type: 'point_shoot', formats: ['35mm'], year: 1990 },
  { brand: 'Contax', model: 'G2', type: 'rangefinder', formats: ['35mm'], year: 1996 },
  { brand: 'Yashica', model: 'Mat-124G', type: 'tlr', formats: ['120'], year: 1970 },
  { brand: 'Yashica', model: 'T4', type: 'point_shoot', formats: ['35mm'], year: 1990 },
  { brand: 'Mamiya', model: 'RB67', type: 'medium_format', formats: ['120'], year: 1970 },
  { brand: 'Mamiya', model: '7II', type: 'rangefinder', formats: ['120'], year: 1999 },
  { brand: 'Hasselblad', model: '500C/M', type: 'medium_format', formats: ['120'], year: 1970 },
  { brand: 'Rolleiflex', model: '2.8F', type: 'tlr', formats: ['120'], year: 1960 },
  { brand: 'Bronica', model: 'SQ-A', type: 'medium_format', formats: ['120'], year: 1982 },
  { brand: 'Polaroid', model: 'SX-70', type: 'instant', formats: ['instant'], year: 1972 },
  { brand: 'Fujifilm', model: 'Instax Mini 11', type: 'instant', formats: ['instant'], year: 2020 },
];

const LENS_DATA = [
  { brand: 'Canon', model: 'FD 50mm f/1.4', mount: 'FD', focal: 50, aperture: 1.4 },
  { brand: 'Canon', model: 'FD 24mm f/2.8', mount: 'FD', focal: 24, aperture: 2.8 },
  { brand: 'Nikon', model: 'AI-S 50mm f/1.4', mount: 'F', focal: 50, aperture: 1.4 },
  { brand: 'Nikon', model: 'AI-S 28mm f/2.8', mount: 'F', focal: 28, aperture: 2.8 },
  { brand: 'Carl Zeiss', model: 'Planar 80mm f/2.8', mount: 'Hasselblad V', focal: 80, aperture: 2.8 },
  { brand: 'Mamiya', model: 'Sekor C 90mm f/3.8', mount: 'RB67', focal: 90, aperture: 3.8 },
  { brand: 'Leica', model: 'Summicron 35mm f/2', mount: 'M', focal: 35, aperture: 2 },
  { brand: 'Leica', model: 'Summilux 50mm f/1.4', mount: 'M', focal: 50, aperture: 1.4 },
  { brand: 'Pentax', model: 'SMC 105mm f/2.4', mount: '67', focal: 105, aperture: 2.4 },
];

const ACHIEVEMENTS = [
  { key: 'first_review', name: 'Roll Pioneer', description: 'Write your first review.', points: 10 },
  { key: 'photo_10', name: 'Frame Maker', description: 'Upload 10 photos.', points: 20 },
  { key: 'list_5', name: 'Curator', description: 'Create 5 public lists.', points: 30 },
  { key: 'tip_helpful', name: 'Mentor', description: 'Earn a positive score on a tip.', points: 25 },
  { key: 'shoot_10_stocks', name: 'Stockpiler', description: 'Shoot 10 different film stocks.', points: 40 },
  { key: 'first_roll', name: 'First Roll', description: 'Log your first roll.', points: 5 },
];

export async function seed(db: any) {
  // brands
  for (const b of BRAND_DATA) {
    await db
      .insert(brands)
      .values({
        slug: slugify(b.name),
        name: b.name,
        country: b.country,
        foundedYear: b.founded,
        logoUrl: b.logo,
        description: b.desc,
      })
      .onConflictDoNothing();
  }
  const brandRows = await db.select().from(brands);
  const byBrand = new Map(brandRows.map((b: any) => [b.name, b.id]));

  // films + variants
  for (const f of FILM_DATA) {
    const slug = slugify(`${f.brand}-${f.name}`);
    const existing = await db.select().from(films).where(eq(films.slug, slug));
    let filmId: string;
    if (existing.length) {
      filmId = existing[0].id;
    } else {
      const [row] = await db
        .insert(films)
        .values({
          slug,
          name: f.name,
          brandId: byBrand.get(f.brand),
          description: f.description,
          coverUrl: f.cover,
          iso: f.iso,
          colorType: f.colorType,
          status: f.status ?? 'active',
          countryOfOrigin: BRAND_DATA.find((b) => b.name === f.brand)?.country,
          yearIntroduced: f.year ?? 2000,
        })
        .returning();
      filmId = row.id;
    }
    for (const v of f.variants) {
      const variantsExisting = await db
        .select()
        .from(filmVariants)
        .where(sql`${filmVariants.filmId} = ${filmId} and ${filmVariants.format} = ${v.format}`);
      if (variantsExisting.length) continue;
      await db.insert(filmVariants).values({
        filmId,
        format: v.format,
        exposures: v.exposures,
        frameSize: v.frameSize,
        pushPullRange: v.pushPullRange,
        dxCoded: v.dxCoded,
        msrpUsd: v.msrpUsd,
      });
    }
  }

  // cameras
  for (const c of CAMERA_DATA) {
    await db
      .insert(cameras)
      .values({
        brand: c.brand,
        model: c.model,
        slug: slugify(`${c.brand}-${c.model}`),
        type: c.type,
        formatsSupported: c.formats,
        yearIntroduced: c.year,
      })
      .onConflictDoNothing();
  }
  // lenses
  for (const l of LENS_DATA) {
    await db
      .insert(lenses)
      .values({
        brand: l.brand,
        model: l.model,
        slug: slugify(`${l.brand}-${l.model}`),
        mount: l.mount,
        focalLengthMm: l.focal,
        maxAperture: l.aperture,
      })
      .onConflictDoNothing();
  }
  // achievements
  for (const a of ACHIEVEMENTS) {
    await db.insert(achievements).values(a).onConflictDoNothing();
  }

  return {
    brands: BRAND_DATA.length,
    films: FILM_DATA.length,
    cameras: CAMERA_DATA.length,
    lenses: LENS_DATA.length,
  };
}
