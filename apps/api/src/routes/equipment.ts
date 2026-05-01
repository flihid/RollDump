import { ilike, or, eq } from 'drizzle-orm';
import { cameras, lenses } from '@rolldump/db';
import { authMiddleware, createApp, requireRole, slugify } from '../lib/context';

const r = createApp();

r.get('/cameras/search', async (c) => {
  const q = c.req.query('q') || '';
  const list = await c
    .get('db')
    .select()
    .from(cameras)
    .where(or(ilike(cameras.brand, `%${q}%`), ilike(cameras.model, `%${q}%`)))
    .limit(15);
  return c.json({ items: list });
});

r.get('/lenses/search', async (c) => {
  const q = c.req.query('q') || '';
  const list = await c
    .get('db')
    .select()
    .from(lenses)
    .where(or(ilike(lenses.brand, `%${q}%`), ilike(lenses.model, `%${q}%`)))
    .limit(15);
  return c.json({ items: list });
});

r.get('/cameras/:slug', async (c) => {
  const [row] = await c
    .get('db')
    .select()
    .from(cameras)
    .where(eq(cameras.slug, c.req.param('slug')));
  if (!row) return c.json({ error: 'Kamera tidak ditemukan' }, 404);
  return c.json({ camera: row });
});

r.post('/cameras', authMiddleware, requireRole('admin', 'editor', 'super_admin'), async (c) => {
  const b = await c.req.json();
  const slug = b.slug || slugify(`${b.brand}-${b.model}`);
  const [row] = await c
    .get('db')
    .insert(cameras)
    .values({
      brand: b.brand,
      model: b.model,
      slug,
      type: b.type,
      formatsSupported: b.formatsSupported || [],
      yearIntroduced: b.yearIntroduced,
      imageUrl: b.imageUrl,
    })
    .returning();
  return c.json({ camera: row }, 201);
});

r.post('/lenses', authMiddleware, requireRole('admin', 'editor', 'super_admin'), async (c) => {
  const b = await c.req.json();
  const slug = b.slug || slugify(`${b.brand}-${b.model}`);
  const [row] = await c
    .get('db')
    .insert(lenses)
    .values({
      brand: b.brand,
      model: b.model,
      slug,
      mount: b.mount,
      focalLengthMm: b.focalLengthMm,
      maxAperture: b.maxAperture,
      imageUrl: b.imageUrl,
    })
    .returning();
  return c.json({ lens: row }, 201);
});

export default r;
