import { createDatabase, films, film_variants, reviews } from './index';

async function seed() {
  const dbUrl = 'postgresql://postgres.bmgqijrdlzuubcpmjewa:rollfilmaja2247@aws-1-ap-south-1.pooler.supabase.com:5432/postgres';
  const db = createDatabase(dbUrl);

  console.log('🌱 Seeding film catalog data...');

  const filmData = [
    {
      name: 'Kodak Portra 400',
      slug: 'kodak-portra-400',
      brand: 'Kodak',
      iso: 400,
      type: 'color',
      description: 'Film favorit fotografer portrait dan pernikahan. Rendisi warna kulit yang lembut dan natural, latitude eksposur yang sangat lebar. Grain halus dengan tonal range yang luas.',
      imageUrl: 'https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=400',
    },
    {
      name: 'Kodak Gold 200',
      slug: 'kodak-gold-200',
      brand: 'Kodak',
      iso: 200,
      type: 'color',
      description: 'Film consumer klasik dengan warna hangat khas Kodak. Cocok untuk outdoor dan cahaya siang hari. Harga terjangkau dengan hasil yang konsisten.',
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
    },
    {
      name: 'Fujifilm Superia X-TRA 400',
      slug: 'fujifilm-superia-x-tra-400',
      brand: 'Fujifilm',
      iso: 400,
      type: 'color',
      description: 'Film serbaguna dari Fujifilm dengan reproduksi warna yang tajam. Cocok untuk segala kondisi pencahayaan, mulai dari outdoor cerah hingga indoor.',
      imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400',
    },
    {
      name: 'Ilford HP5 Plus',
      slug: 'ilford-hp5-plus',
      brand: 'Ilford',
      iso: 400,
      type: 'bw',
      description: 'Film hitam putih serbaguna dengan grain medium. Sangat toleran terhadap push processing, bisa di-push hingga ISO 3200. Pilihan klasik untuk street photography.',
      imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400',
    },
    {
      name: 'Kodak Tri-X 400',
      slug: 'kodak-tri-x-400',
      brand: 'Kodak',
      iso: 400,
      type: 'bw',
      description: 'Film hitam putih legendaris sejak 1954. Kontras tinggi dengan grain yang artistik. Digunakan oleh fotografer ikonik seperti Garry Winogrand dan Diane Arbus.',
      imageUrl: 'https://images.unsplash.com/photo-1495745966610-2a67f2297e5e?w=400',
    },
    {
      name: 'Kodak Ektar 100',
      slug: 'kodak-ektar-100',
      brand: 'Kodak',
      iso: 100,
      type: 'color',
      description: 'Film negatif warna grain terhalus di dunia. Saturasi warna yang kaya dan tajam. Ideal untuk landscape dan arsitektur.',
      imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    },
    {
      name: 'Fujifilm Pro 400H',
      slug: 'fujifilm-pro-400h',
      brand: 'Fujifilm',
      iso: 400,
      type: 'color',
      description: 'Film profesional dengan rendisi warna yang lembut dan pastel. Sangat populer di kalangan fotografer wedding dan portrait. Tone hijau-biru yang khas.',
      imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
    },
    {
      name: 'Ilford Delta 3200',
      slug: 'ilford-delta-3200',
      brand: 'Ilford',
      iso: 3200,
      type: 'bw',
      description: 'Film hitam putih high-speed untuk kondisi cahaya minim. Grain dramatis yang artistik. Pilihan utama untuk konser, street night photography, dan indoor tanpa flash.',
      imageUrl: 'https://images.unsplash.com/photo-1519638399535-1b036603ac77?w=400',
    },
    {
      name: 'CineStill 800T',
      slug: 'cinestill-800t',
      brand: 'CineStill',
      iso: 800,
      type: 'color',
      description: 'Film sinematik tungsten-balanced yang memberikan efek halation (glow) unik pada highlight. Warna biru-cyan yang dreamy di bawah lampu tungsten. Favorit nightlife photographer.',
      imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400',
    },
    {
      name: 'Lomography Color 400',
      slug: 'lomography-color-400',
      brand: 'Lomography',
      iso: 400,
      type: 'color',
      description: 'Film eksperimental dengan saturasi tinggi dan kontras kuat. Warna yang hidup dan punchy, cocok untuk gaya lomografi dan kreativitas tanpa batas.',
      imageUrl: 'https://images.unsplash.com/photo-1520390138845-fd2d229dd553?w=400',
    },
  ];

  try {
    // Insert films
    const insertedFilms = await db.insert(films).values(filmData).returning();
    console.log(`✅ ${insertedFilms.length} film berhasil di-seed`);

    // Insert variants for each film
    const variantsData = [];
    for (const film of insertedFilms) {
      // All films get 35mm variant
      variantsData.push({ filmId: film.id, format: '35mm', frameSize: '24x36', exposures: 36 });

      // Some films also have 120 format
      if (['Kodak Portra 400', 'Kodak Ektar 100', 'Fujifilm Pro 400H', 'Ilford HP5 Plus', 'Kodak Tri-X 400', 'Ilford Delta 3200'].includes(film.name)) {
        variantsData.push({ filmId: film.id, format: '120', frameSize: '6x7', exposures: 10 });
        variantsData.push({ filmId: film.id, format: '120', frameSize: '6x6', exposures: 12 });
      }

      // Portra and Ektar also in large format
      if (['Kodak Portra 400', 'Kodak Ektar 100'].includes(film.name)) {
        variantsData.push({ filmId: film.id, format: 'large_format', frameSize: '4x5', exposures: 1 });
      }
    }

    await db.insert(film_variants).values(variantsData);
    console.log(`✅ ${variantsData.length} varian format berhasil di-seed`);

    console.log('🎉 Seeding selesai!');
  } catch (error) {
    console.error('❌ Gagal seed:', error);
  }

  process.exit(0);
}

seed();
