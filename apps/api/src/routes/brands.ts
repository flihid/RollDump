import { eq, sql } from 'drizzle-orm';
import { brands, films } from '@rolldump/db';
import { createApp } from '../lib/context';

const r = createApp();

r.get('/', async (c) => {
  const db = c.get('db');
  const rows = await db
    .select({
      brand: brands,
      filmCount: sql<number>`count(${films.id})::int`,
    })
    .from(brands)
    .leftJoin(films, eq(films.brandId, brands.id))
    .groupBy(brands.id);
  return c.json({ items: rows.map((r) => ({ ...r.brand, filmCount: Number(r.filmCount || 0) })) });
});

r.get('/:slug', async (c) => {
  const db = c.get('db');
  const [b] = await db.select().from(brands).where(eq(brands.slug, c.req.param('slug')));
  if (!b) return c.json({ error: 'Brand tidak ditemukan' }, 404);
  const f = await db.select().from(films).where(eq(films.brandId, b.id));
  return c.json({ brand: b, films: f });
});

export default r;
