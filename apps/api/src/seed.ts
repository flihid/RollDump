import { eq, sql } from 'drizzle-orm';
import { brands, films, filmVariants, cameras, lenses, achievements } from '@rolldump/db';
import { slugify } from './lib/context';

const BRAND_DATA = [
  { name: 'Kodak', country: 'USA', founded: 1888, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Logo_of_the_Eastman_Kodak_Company.svg/320px-Logo_of_the_Eastman_Kodak_Company.svg.png', desc: 'Pionir fotografi sejak 1888.' },
  { name: 'Ilford', country: 'UK', founded: 1879, logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/bb/ILFORD_LOGO.svg/320px-ILFORD_LOGO.svg.png', desc: 'Spesialis film hitam-putih premium.' },
  { name: 'Fujifilm', country: 'Japan', founded: 1934, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Fujifilm_logo.svg/320px-Fujifilm_logo.svg.png', desc: 'Inovator emulsi warna Jepang.' },
  { name: 'Cinestill', country: 'USA', founded: 2012, logo: '', desc: 'Film Hollywood motion-picture untuk fotografi still.' },
  { name: 'Lomography', country: 'Austria', founded: 1992, logo: '', desc: 'Estetika lo-fi & eksperimental.' },
  { name: 'Kentmere', country: 'UK', founded: 1990, logo: '', desc: 'Film B&W ekonomis dari Harman/Ilford.' },
];

const FILM_DATA: Array<{
  brand: string;
  name: string;
  iso: number;
  colorType: string;
  cover: string;
  description: string;
  variants: Array<{ format: string; exposures: number; frameSize?: string; pushPullRange?: string; dxCoded?: boolean; msrpUsd?: number }>;
}> = [
  {
    brand: 'Kodak',
    name: 'Portra 400',
    iso: 400,
    colorType: 'color_negative',
    cover: 'https://images.unsplash.com/photo-1502136969935-8d8eef54d77b?w=800',
    description: 'Negative warna profesional dengan tone kulit yang sangat halus, fleksibel di pencahayaan beragam.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '-1..+2', dxCoded: true, msrpUsd: 18 },
      { format: '120', exposures: 16, frameSize: '6x4.5', pushPullRange: '-1..+2', msrpUsd: 13 },
    ],
  },
  {
    brand: 'Kodak',
    name: 'Gold 200',
    iso: 200,
    colorType: 'color_negative',
    cover: 'https://images.unsplash.com/photo-1554136545-7eaa3eb9b58a?w=800',
    description: 'Warna hangat ikonik dengan harga terjangkau — favorit Gen Z.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 11 },
      { format: '120', exposures: 16, frameSize: '6x4.5', msrpUsd: 12 },
    ],
  },
  {
    brand: 'Kodak',
    name: 'Ektar 100',
    iso: 100,
    colorType: 'color_negative',
    cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800',
    description: 'Saturasi tinggi, butir terhalus di kelas color negative.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 17 },
      { format: '120', exposures: 16, frameSize: '6x4.5', msrpUsd: 14 },
    ],
  },
  {
    brand: 'Kodak',
    name: 'Tri-X 400',
    iso: 400,
    colorType: 'bw',
    cover: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
    description: 'Standar emas film B&W dengan grain karakteristik.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '-1..+3', dxCoded: true, msrpUsd: 12 },
      { format: '120', exposures: 12, frameSize: '6x6', pushPullRange: '-1..+3', msrpUsd: 9 },
    ],
  },
  {
    brand: 'Ilford',
    name: 'HP5 Plus',
    iso: 400,
    colorType: 'bw',
    cover: 'https://images.unsplash.com/photo-1604881991720-f91add269bed?w=800',
    description: 'Versatile, push-friendly hingga +3 stop. Klasik UK.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '-1..+3', dxCoded: true, msrpUsd: 10 },
      { format: '120', exposures: 12, frameSize: '6x6', pushPullRange: '-1..+3', msrpUsd: 8 },
    ],
  },
  {
    brand: 'Ilford',
    name: 'Delta 3200',
    iso: 3200,
    colorType: 'bw',
    cover: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=800',
    description: 'Push speed B&W untuk low-light dan night photography.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', pushPullRange: '-1..+1', dxCoded: true, msrpUsd: 14 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 11 },
    ],
  },
  {
    brand: 'Fujifilm',
    name: 'Fujicolor 200',
    iso: 200,
    colorType: 'color_negative',
    cover: 'https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?w=800',
    description: 'Ekonomis dengan tone hijau-biru khas Fuji.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 9 }],
  },
  {
    brand: 'Fujifilm',
    name: 'Velvia 50',
    iso: 50,
    colorType: 'slide_e6',
    cover: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800',
    description: 'Slide E6 legendaris untuk landscape — saturasi mengagumkan.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 22 },
      { format: '120', exposures: 12, frameSize: '6x7', msrpUsd: 18 },
    ],
  },
  {
    brand: 'Cinestill',
    name: '800T',
    iso: 800,
    colorType: 'color_negative',
    cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    description: 'Tungsten-balanced 800T dengan halation merah ikonik.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 20 },
      { format: '120', exposures: 16, frameSize: '6x4.5', msrpUsd: 21 },
    ],
  },
  {
    brand: 'Cinestill',
    name: '50D',
    iso: 50,
    colorType: 'color_negative',
    cover: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800',
    description: 'Daylight, halus, untuk siang hari yang cerah.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 18 }],
  },
  {
    brand: 'Lomography',
    name: 'Color 800',
    iso: 800,
    colorType: 'color_negative',
    cover: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800',
    description: 'Color 800 dengan vibrancy lo-fi yang fun.',
    variants: [
      { format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 13 },
      { format: '120', exposures: 12, frameSize: '6x6', msrpUsd: 11 },
    ],
  },
  {
    brand: 'Kentmere',
    name: 'Pan 400',
    iso: 400,
    colorType: 'bw',
    cover: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=800',
    description: 'B&W ekonomis untuk eksplorasi dan latihan.',
    variants: [{ format: '35mm', exposures: 36, frameSize: '24x36', dxCoded: true, msrpUsd: 7 }],
  },
];

const CAMERA_DATA = [
  { brand: 'Canon', model: 'AE-1 Program', type: 'slr', formats: ['35mm'], year: 1981 },
  { brand: 'Nikon', model: 'FM2', type: 'slr', formats: ['35mm'], year: 1982 },
  { brand: 'Pentax', model: 'K1000', type: 'slr', formats: ['35mm'], year: 1976 },
  { brand: 'Olympus', model: 'OM-1', type: 'slr', formats: ['35mm'], year: 1972 },
  { brand: 'Leica', model: 'M6', type: 'rangefinder', formats: ['35mm'], year: 1984 },
  { brand: 'Contax', model: 'T2', type: 'point_shoot', formats: ['35mm'], year: 1990 },
  { brand: 'Yashica', model: 'Mat-124G', type: 'tlr', formats: ['120'], year: 1970 },
  { brand: 'Mamiya', model: 'RB67', type: 'medium_format', formats: ['120'], year: 1970 },
  { brand: 'Hasselblad', model: '500C/M', type: 'medium_format', formats: ['120'], year: 1970 },
  { brand: 'Pentax', model: '67', type: 'medium_format', formats: ['120'], year: 1969 },
  { brand: 'Polaroid', model: 'SX-70', type: 'instant', formats: ['instant'], year: 1972 },
  { brand: 'Fujifilm', model: 'Instax Mini 11', type: 'instant', formats: ['instant'], year: 2020 },
];

const LENS_DATA = [
  { brand: 'Canon', model: 'FD 50mm f/1.4', mount: 'FD', focal: 50, aperture: 1.4 },
  { brand: 'Nikon', model: 'AI-S 50mm f/1.4', mount: 'F', focal: 50, aperture: 1.4 },
  { brand: 'Carl Zeiss', model: 'Planar 80mm f/2.8', mount: 'Hasselblad V', focal: 80, aperture: 2.8 },
  { brand: 'Mamiya', model: 'Sekor C 90mm f/3.8', mount: 'RB67', focal: 90, aperture: 3.8 },
  { brand: 'Leica', model: 'Summicron 35mm f/2', mount: 'M', focal: 35, aperture: 2 },
];

const ACHIEVEMENTS = [
  { key: 'first_review', name: 'Roll Pioneer', description: 'Tulis review pertama Anda', points: 10 },
  { key: 'photo_10', name: 'Frame Maker', description: 'Unggah 10 foto', points: 20 },
  { key: 'list_5', name: 'Curator', description: 'Buat 5 list publik', points: 30 },
  { key: 'tip_helpful', name: 'Mentor', description: 'Tip dengan score positif', points: 25 },
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
          countryOfOrigin: BRAND_DATA.find((b) => b.name === f.brand)?.country,
          yearIntroduced: 2000,
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
