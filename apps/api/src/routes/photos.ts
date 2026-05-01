import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import {
  photos,
  rolls,
  films,
  filmVariants,
  users,
  cameras,
  lenses,
} from '@rolldump/db';
import { authMiddleware, createApp, optionalAuth } from '../lib/context';

const r = createApp();

r.get('/', optionalAuth, async (c) => {
  const db = c.get('db');
  const limit = Math.min(parseInt(c.req.query('limit') || '24'), 60);
  const filmId = c.req.query('film_id');
  const userId = c.req.query('user_id');
  const format = c.req.query('format');
  const conds: any[] = [eq(photos.status, 'published')];
  if (filmId) conds.push(eq(photos.filmId, filmId));
  if (userId) conds.push(eq(photos.userId, userId));
  if (format) {
    const variants = await db
      .select()
      .from(filmVariants)
      .where(eq(filmVariants.format, format));
    const ids = variants.map((v) => v.id);
    if (ids.length) conds.push(inArray(photos.filmVariantId, ids));
    else return c.json({ items: [] });
  }
  const rows = await db
    .select({
      photo: photos,
      author: { id: users.id, username: users.username, avatarUrl: users.avatarUrl },
      film: films,
      variant: filmVariants,
    })
    .from(photos)
    .innerJoin(users, eq(users.id, photos.userId))
    .leftJoin(films, eq(films.id, photos.filmId))
    .leftJoin(filmVariants, eq(filmVariants.id, photos.filmVariantId))
    .where(and(...conds))
    .orderBy(desc(photos.createdAt))
    .limit(limit);
  return c.json({ items: rows });
});

r.get('/:id', optionalAuth, async (c) => {
  const db = c.get('db');
  const [row] = await db
    .select({
      photo: photos,
      author: {
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        fullName: users.fullName,
      },
      film: films,
      variant: filmVariants,
      camera: cameras,
      lens: lenses,
    })
    .from(photos)
    .innerJoin(users, eq(users.id, photos.userId))
    .leftJoin(films, eq(films.id, photos.filmId))
    .leftJoin(filmVariants, eq(filmVariants.id, photos.filmVariantId))
    .leftJoin(cameras, eq(cameras.id, photos.cameraId))
    .leftJoin(lenses, eq(lenses.id, photos.lensId))
    .where(eq(photos.id, c.req.param('id')));
  if (!row) return c.json({ error: 'Foto tidak ditemukan' }, 404);
  await db
    .update(photos)
    .set({ viewCount: sql`${photos.viewCount} + 1` })
    .where(eq(photos.id, row.photo.id));
  return c.json(row);
});

r.post('/', authMiddleware, async (c) => {
  const body = await c.req.json();
  const db = c.get('db');
  if (!body.imageUrl) return c.json({ error: 'imageUrl wajib' }, 400);
  let filmId: string | undefined = body.filmId;
  if (!filmId && body.filmVariantId) {
    const [v] = await db.select().from(filmVariants).where(eq(filmVariants.id, body.filmVariantId));
    if (v) filmId = v.filmId;
  }
  const [row] = await db
    .insert(photos)
    .values({
      userId: c.get('user')!.id,
      imageUrl: body.imageUrl,
      thumbUrl: body.thumbUrl || body.imageUrl,
      caption: body.caption,
      filmId,
      filmVariantId: body.filmVariantId,
      cameraId: body.cameraId,
      lensId: body.lensId,
      frameSize: body.frameSize,
      frameNumber: body.frameNumber,
      pushPullStops: body.pushPullStops || 0,
      shootingConditions: body.shootingConditions,
      shotAtDate: body.shotAtDate ? new Date(body.shotAtDate) : null,
      location: body.location,
      width: body.width,
      height: body.height,
    })
    .returning();
  if (filmId) {
    await db
      .update(films)
      .set({ photoCount: sql`${films.photoCount} + 1` })
      .where(eq(films.id, filmId));
  }
  return c.json({ photo: row }, 201);
});

r.post('/bulk', authMiddleware, async (c) => {
  const body = await c.req.json();
  const db = c.get('db');
  const items: any[] = body.items || [];
  if (!items.length) return c.json({ error: 'items wajib' }, 400);
  let filmId: string | undefined = body.filmId;
  if (!filmId && body.filmVariantId) {
    const [v] = await db.select().from(filmVariants).where(eq(filmVariants.id, body.filmVariantId));
    if (v) filmId = v.filmId;
  }
  // create roll
  const [roll] = await db
    .insert(rolls)
    .values({
      userId: c.get('user')!.id,
      filmVariantId: body.filmVariantId,
      title: body.rollTitle || `Roll ${new Date().toLocaleDateString('id-ID')}`,
      labName: body.labName,
      developedAt: body.developedAt ? new Date(body.developedAt) : null,
      photoCount: items.length,
    })
    .returning();
  const created: any[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const [p] = await db
      .insert(photos)
      .values({
        userId: c.get('user')!.id,
        rollId: roll.id,
        imageUrl: it.imageUrl,
        thumbUrl: it.thumbUrl || it.imageUrl,
        caption: it.caption,
        filmId,
        filmVariantId: body.filmVariantId,
        cameraId: body.cameraId,
        lensId: body.lensId,
        frameSize: body.frameSize,
        frameNumber: it.frameNumber || i + 1,
        shootingConditions: body.shootingConditions,
      })
      .returning();
    created.push(p);
  }
  if (created.length && !roll.coverPhotoId) {
    await db.update(rolls).set({ coverPhotoId: created[0].id }).where(eq(rolls.id, roll.id));
  }
  if (filmId)
    await db
      .update(films)
      .set({ photoCount: sql`${films.photoCount} + ${created.length}` })
      .where(eq(films.id, filmId));
  return c.json({ roll, photos: created }, 201);
});

r.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const db = c.get('db');
  const [existing] = await db.select().from(photos).where(eq(photos.id, id));
  if (!existing) return c.json({ error: 'Foto tidak ditemukan' }, 404);
  if (existing.userId !== c.get('user')!.id) return c.json({ error: 'Forbidden' }, 403);
  const allowed = [
    'caption',
    'cameraId',
    'lensId',
    'frameSize',
    'frameNumber',
    'pushPullStops',
    'shootingConditions',
    'location',
  ];
  const upd: any = {};
  for (const k of allowed) if (k in body) upd[k] = body[k];
  await db.update(photos).set(upd).where(eq(photos.id, id));
  return c.json({ ok: true });
});

r.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');
  const [existing] = await db.select().from(photos).where(eq(photos.id, id));
  if (!existing) return c.json({ error: 'Foto tidak ditemukan' }, 404);
  if (existing.userId !== c.get('user')!.id && c.get('user')!.role !== 'admin')
    return c.json({ error: 'Forbidden' }, 403);
  await db
    .update(photos)
    .set({ status: 'deleted', deletedAt: new Date() })
    .where(eq(photos.id, id));
  if (existing.filmId)
    await db
      .update(films)
      .set({ photoCount: sql`greatest(${films.photoCount} - 1, 0)` })
      .where(eq(films.id, existing.filmId));
  return c.body(null, 204);
});

// Rolls
r.get('/rolls/by-user/:userId', optionalAuth, async (c) => {
  const list = await c
    .get('db')
    .select()
    .from(rolls)
    .where(eq(rolls.userId, c.req.param('userId')))
    .orderBy(desc(rolls.createdAt))
    .limit(50);
  return c.json({ items: list });
});

r.get('/rolls/:id', optionalAuth, async (c) => {
  const db = c.get('db');
  const [roll] = await db.select().from(rolls).where(eq(rolls.id, c.req.param('id')));
  if (!roll) return c.json({ error: 'Roll tidak ditemukan' }, 404);
  const ps = await db.select().from(photos).where(eq(photos.rollId, roll.id));
  return c.json({ roll, photos: ps });
});

export default r;
