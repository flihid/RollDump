import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm';
import {
  brands,
  films,
  filmVariants,
  reviews,
  photos,
  wishlists,
  filmTips,
} from '@rolldump/db';
import { authMiddleware, createApp, optionalAuth, requireRole, slugify } from '../lib/context';

const r = createApp();

r.get('/', optionalAuth, async (c) => {
  const db = c.get('db');
  const limit = Math.min(parseInt(c.req.query('limit') || '24'), 60);
  const sort = c.req.query('sort') || 'popular';
  const search = c.req.query('q');
  const brandSlug = c.req.query('brand');
  const formats = c.req.query('formats')?.split(',').filter(Boolean);
  const colorType = c.req.query('color_type');
  const isoMin = c.req.query('iso_min') ? Number(c.req.query('iso_min')) : null;
  const isoMax = c.req.query('iso_max') ? Number(c.req.query('iso_max')) : null;
  const country = c.req.query('country');
  const status = c.req.query('status');

  const conds: any[] = [eq(films.isActive, true)];
  if (search) conds.push(ilike(films.name, `%${search}%`));
  if (colorType) conds.push(eq(films.colorType, colorType));
  if (isoMin != null) conds.push(gte(films.iso, isoMin));
  if (isoMax != null) conds.push(lte(films.iso, isoMax));
  if (country) conds.push(eq(films.countryOfOrigin, country));
  if (status) conds.push(eq(films.status, status));

  let brandId: string | null = null;
  if (brandSlug) {
    const [b] = await db.select().from(brands).where(eq(brands.slug, brandSlug));
    if (b) {
      brandId = b.id;
      conds.push(eq(films.brandId, b.id));
    }
  }

  const orderBy =
    sort === 'rating'
      ? desc(films.ratingAvg)
      : sort === 'recent'
      ? desc(films.createdAt)
      : sort === 'name'
      ? asc(films.name)
      : desc(films.reviewCount);

  let rows = await db
    .select()
    .from(films)
    .where(and(...conds))
    .orderBy(orderBy)
    .limit(limit + 1);

  if (formats && formats.length) {
    const fIds = rows.map((r) => r.id);
    const variants = fIds.length
      ? await db.select().from(filmVariants).where(inArray(filmVariants.filmId, fIds))
      : [];
    const allowed = new Set(
      variants.filter((v) => formats.includes(v.format)).map((v) => v.filmId),
    );
    rows = rows.filter((r) => allowed.has(r.id));
  }

  // attach available formats per film
  const ids = rows.slice(0, limit).map((x) => x.id);
  const variants = ids.length
    ? await db.select().from(filmVariants).where(inArray(filmVariants.filmId, ids))
    : [];
  const formatsByFilm = new Map<string, string[]>();
  for (const v of variants) {
    const arr = formatsByFilm.get(v.filmId) || [];
    if (!arr.includes(v.format)) arr.push(v.format);
    formatsByFilm.set(v.filmId, arr);
  }
  const brandIds = Array.from(new Set(rows.map((r) => r.brandId).filter(Boolean) as string[]));
  const brandRows = brandIds.length
    ? await db.select().from(brands).where(inArray(brands.id, brandIds))
    : [];
  const brandMap = new Map(brandRows.map((b) => [b.id, b]));

  return c.json({
    items: rows.slice(0, limit).map((f) => ({
      ...f,
      brand: f.brandId ? brandMap.get(f.brandId) : null,
      availableFormats: formatsByFilm.get(f.id) || [],
    })),
    hasMore: rows.length > limit,
  });
});

r.get('/trending', async (c) => {
  const db = c.get('db');
  const period = c.req.query('period') || 'week';
  const list = await db
    .select()
    .from(films)
    .where(eq(films.isActive, true))
    .orderBy(desc(films.reviewCount), desc(films.photoCount))
    .limit(12);

  const ids = list.map((x) => x.id);
  const variants = ids.length
    ? await db.select().from(filmVariants).where(inArray(filmVariants.filmId, ids))
    : [];
  const formatsByFilm = new Map<string, string[]>();
  for (const v of variants) {
    const arr = formatsByFilm.get(v.filmId) || [];
    if (!arr.includes(v.format)) arr.push(v.format);
    formatsByFilm.set(v.filmId, arr);
  }
  const brandIds = Array.from(new Set(list.map((r) => r.brandId).filter(Boolean) as string[]));
  const brandRows = brandIds.length
    ? await db.select().from(brands).where(inArray(brands.id, brandIds))
    : [];
  const brandMap = new Map(brandRows.map((b) => [b.id, b]));

  return c.json({
    items: list.map((f) => ({
      ...f,
      brand: f.brandId ? brandMap.get(f.brandId) : null,
      availableFormats: formatsByFilm.get(f.id) || [],
    })),
    period,
  });
});

r.get('/:slug', optionalAuth, async (c) => {
  const db = c.get('db');
  const slug = c.req.param('slug');
  const [f] = await db.select().from(films).where(eq(films.slug, slug));
  if (!f) return c.json({ error: 'Film tidak ditemukan' }, 404);
  const variants = await db.select().from(filmVariants).where(eq(filmVariants.filmId, f.id));
  const brand = f.brandId
    ? (await db.select().from(brands).where(eq(brands.id, f.brandId)))[0]
    : null;
  const reviewsCount = await db
    .select({ c: sql<number>`count(*)` })
    .from(reviews)
    .where(and(eq(reviews.filmId, f.id), eq(reviews.status, 'published')));
  const photosCount = await db
    .select({ c: sql<number>`count(*)` })
    .from(photos)
    .where(and(eq(photos.filmId, f.id), eq(photos.status, 'published')));
  const tipsCount = await db
    .select({ c: sql<number>`count(*)` })
    .from(filmTips)
    .where(and(eq(filmTips.filmId, f.id), eq(filmTips.status, 'published')));
  return c.json({
    film: {
      ...f,
      brand,
      variants,
      stats: {
        reviewCount: Number(reviewsCount[0]?.c || 0),
        photoCount: Number(photosCount[0]?.c || 0),
        tipsCount: Number(tipsCount[0]?.c || 0),
      },
    },
  });
});

r.post('/', authMiddleware, requireRole('admin', 'editor', 'super_admin'), async (c) => {
  const body = await c.req.json();
  const db = c.get('db');
  const slug = body.slug || slugify(`${body.brandName || ''}-${body.name}`) || slugify(body.name);
  let brandId = body.brandId as string | undefined;
  if (!brandId && body.brandName) {
    const existing = await db.select().from(brands).where(eq(brands.name, body.brandName));
    if (existing.length) brandId = existing[0].id;
    else {
      const [nb] = await db
        .insert(brands)
        .values({ name: body.brandName, slug: slugify(body.brandName) })
        .returning();
      brandId = nb.id;
    }
  }
  const [f] = await db
    .insert(films)
    .values({
      slug,
      name: body.name,
      brandId,
      description: body.description,
      coverUrl: body.coverUrl,
      iso: body.iso,
      colorType: body.colorType,
      countryOfOrigin: body.countryOfOrigin,
      yearIntroduced: body.yearIntroduced,
    })
    .returning();
  if (Array.isArray(body.variants)) {
    for (const v of body.variants) {
      await db.insert(filmVariants).values({
        filmId: f.id,
        format: v.format,
        exposures: v.exposures,
        frameSize: v.frameSize,
        pushPullRange: v.pushPullRange,
        dxCoded: v.dxCoded,
        msrpUsd: v.msrpUsd,
      });
    }
  }
  return c.json({ film: f }, 201);
});

r.put('/:id', authMiddleware, requireRole('admin', 'editor', 'super_admin'), async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const db = c.get('db');
  const allowed = [
    'name',
    'description',
    'coverUrl',
    'datasheetUrl',
    'iso',
    'colorType',
    'countryOfOrigin',
    'yearIntroduced',
    'yearDiscontinued',
    'status',
    'isActive',
  ];
  const upd: any = { updatedAt: new Date() };
  for (const k of allowed) if (k in body) upd[k] = body[k];
  await db.update(films).set(upd).where(eq(films.id, id));
  return c.json({ ok: true });
});

r.patch('/:id/status', authMiddleware, requireRole('admin', 'super_admin'), async (c) => {
  const { status } = await c.req.json();
  await c.get('db').update(films).set({ status }).where(eq(films.id, c.req.param('id')));
  return c.json({ ok: true });
});

// Lightweight: just the variant IDs the current user has wishlisted.
// Used by FilmCard hearts to render filled/empty state without N+1 queries.
r.get('/wishlists/ids', authMiddleware, async (c) => {
  const db = c.get('db');
  const list = await db
    .select({ id: wishlists.filmVariantId })
    .from(wishlists)
    .where(eq(wishlists.userId, c.get('user')!.id));
  return c.json({ ids: list.map((r: any) => r.id) });
});

// Wishlist on variants
r.post('/wishlists', authMiddleware, async (c) => {
  const { film_variant_id } = await c.req.json();
  const userId = c.get('user')!.id;
  await c
    .get('db')
    .insert(wishlists)
    .values({ userId, filmVariantId: film_variant_id })
    .onConflictDoNothing();
  return c.json({ ok: true });
});

r.delete('/wishlists/:variantId', authMiddleware, async (c) => {
  const userId = c.get('user')!.id;
  await c
    .get('db')
    .delete(wishlists)
    .where(
      and(
        eq(wishlists.userId, userId),
        eq(wishlists.filmVariantId, c.req.param('variantId')),
      ),
    );
  return c.body(null, 204);
});

r.get('/wishlists/me', authMiddleware, async (c) => {
  const db = c.get('db');
  const userId = c.get('user')!.id;
  const rows = await db
    .select({
      film: films,
      variant: filmVariants,
      brand: brands,
    })
    .from(wishlists)
    .innerJoin(filmVariants, eq(filmVariants.id, wishlists.filmVariantId))
    .innerJoin(films, eq(films.id, filmVariants.filmId))
    .leftJoin(brands, eq(brands.id, films.brandId))
    .where(eq(wishlists.userId, userId));
  // Flatten: attach brand onto film so FilmRoll3D + FilmCard can read film.brand.name
  return c.json({
    items: rows.map((row: any) => ({
      film: { ...row.film, brand: row.brand },
      variant: row.variant,
    })),
  });
});

export default r;
