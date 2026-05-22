import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import {
  photos,
  rolls,
  films,
  filmVariants,
  users,
  cameras,
  lenses,
  likes,
  comments,
} from '@rolldump/db';
import { authMiddleware, createApp, getHiddenUserIds, optionalAuth } from '../lib/context';
import { notInArray } from 'drizzle-orm';

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
  // Hide content from users blocked by / blocking the viewer
  const hidden = await getHiddenUserIds(c);
  if (hidden.length) conds.push(notInArray(photos.userId, hidden));
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

  // Enrich with viewerHasLiked flags so the gallery shows filled hearts where appropriate
  const me = c.get('user')?.id;
  const photoIds = rows.map((r: any) => r.photo.id);
  const likedIds = new Set<string>();
  if (me && photoIds.length) {
    const liked = await db
      .select({ id: likes.likeableId })
      .from(likes)
      .where(
        and(
          eq(likes.userId, me),
          eq(likes.likeableType, 'photo'),
          inArray(likes.likeableId, photoIds),
        ),
      );
    for (const l of liked) likedIds.add(l.id as string);
  }
  return c.json({
    items: rows.map((r: any) => ({ ...r, viewerHasLiked: likedIds.has(r.photo.id) })),
  });
});

r.get('/:id', optionalAuth, async (c) => {
  const db = c.get('db');
  const photoId = c.req.param('id');
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
    .where(eq(photos.id, photoId));
  if (!row) return c.json({ error: 'Photo not found' }, 404);
  const hidden = await getHiddenUserIds(c);
  if (hidden.includes(row.author?.id)) return c.json({ error: 'Photo not found' }, 404);

  // Like & comment counts so the FE doesn't need extra round-trips
  const [{ c: likeC }] = await db
    .select({ c: sql<number>`count(*)` })
    .from(likes)
    .where(and(eq(likes.likeableId, photoId), eq(likes.likeableType, 'photo')));
  const [{ c: commentC }] = await db
    .select({ c: sql<number>`count(*)` })
    .from(comments)
    .where(and(eq(comments.commentableId, photoId), eq(comments.commentableType, 'photo')));

  // Did the current user already like this photo?
  let viewerHasLiked = false;
  const me = c.get('user')?.id;
  if (me) {
    const existing = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, me),
          eq(likes.likeableId, photoId),
          eq(likes.likeableType, 'photo'),
        ),
      );
    viewerHasLiked = existing.length > 0;
  }

  await db
    .update(photos)
    .set({ viewCount: sql`${photos.viewCount} + 1` })
    .where(eq(photos.id, row.photo.id));

  return c.json({
    ...row,
    likeCount: Number(likeC || 0),
    commentCount: Number(commentC || 0),
    viewerHasLiked,
  });
});

r.post('/', authMiddleware, async (c) => {
  const body = await c.req.json();
  const db = c.get('db');
  if (!body.imageUrl) return c.json({ error: 'imageUrl is required' }, 400);
  let filmId: string | undefined = body.filmId;
  if (!filmId && body.filmVariantId) {
    const [v] = await db.select().from(filmVariants).where(eq(filmVariants.id, body.filmVariantId));
    if (v) filmId = v.filmId;
  }
  // Persist cameraText/lensText as EXIF since the photos table has no dedicated columns
  const exif: Record<string, any> = body.exif || {};
  if (body.cameraText) exif.camera = body.cameraText;
  if (body.lensText) exif.lens = body.lensText;
  if (body.labName) exif.lab = body.labName;
  if (body.visibility) exif.visibility = body.visibility;
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
      location: body.location || body.shotLocation,
      exif: Object.keys(exif).length ? exif : null,
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
  const items: any[] = (body.items || []).filter((it: any) => it && it.imageUrl);
  if (!items.length) return c.json({ error: 'items is required' }, 400);
  let filmId: string | undefined = body.filmId;
  if (!filmId && body.filmVariantId) {
    const [v] = await db.select().from(filmVariants).where(eq(filmVariants.id, body.filmVariantId));
    if (v) filmId = v.filmId;
  }
  const sharedExif: Record<string, any> = {};
  if (body.cameraText) sharedExif.camera = body.cameraText;
  if (body.lensText) sharedExif.lens = body.lensText;
  if (body.labName) sharedExif.lab = body.labName;
  if (body.visibility) sharedExif.visibility = body.visibility;

  // Create roll album
  const [roll] = await db
    .insert(rolls)
    .values({
      userId: c.get('user')!.id,
      filmVariantId: body.filmVariantId,
      title: body.rollTitle || `Roll ${new Date().toLocaleDateString('en-US')}`,
      description: body.shotLocation
        ? `Shot in ${body.shotLocation}${body.cameraText ? ` on ${body.cameraText}` : ''}`
        : null,
      labName: body.labName,
      developedAt: body.developedAt ? new Date(body.developedAt) : null,
      photoCount: items.length,
    })
    .returning();

  const created: any[] = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const exif = { ...sharedExif, ...(it.exif || {}) };
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
        frameNumber: it.frameNumber ?? i + 1,
        pushPullStops: body.pushPullStops ?? 0,
        shootingConditions: body.shootingConditions,
        location: body.shotLocation || body.location || null,
        exif: Object.keys(exif).length ? exif : null,
      })
      .returning();
    created.push(p);
  }
  if (created.length && !roll.coverPhotoId) {
    await db.update(rolls).set({ coverPhotoId: created[0].id }).where(eq(rolls.id, roll.id));
  }
  if (filmId) {
    await db
      .update(films)
      .set({ photoCount: sql`${films.photoCount} + ${created.length}` })
      .where(eq(films.id, filmId));
  }
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

// Rolls — list by user, enriched with film name + cover thumbnail
r.get('/rolls/by-user/:userId', optionalAuth, async (c) => {
  const db = c.get('db');
  const rows = await db
    .select({
      id: rolls.id,
      title: rolls.title,
      description: rolls.description,
      labName: rolls.labName,
      developedAt: rolls.developedAt,
      photoCount: rolls.photoCount,
      coverPhotoId: rolls.coverPhotoId,
      createdAt: rolls.createdAt,
      filmVariantId: rolls.filmVariantId,
      variantFormat: filmVariants.format,
      filmId: filmVariants.filmId,
      filmName: films.name,
    })
    .from(rolls)
    .leftJoin(filmVariants, eq(filmVariants.id, rolls.filmVariantId))
    .leftJoin(films, eq(films.id, filmVariants.filmId))
    .where(eq(rolls.userId, c.req.param('userId')))
    .orderBy(desc(rolls.createdAt))
    .limit(50);

  // Attach cover URL from photo
  const coverIds = rows.map((r: any) => r.coverPhotoId).filter(Boolean);
  const covers = coverIds.length
    ? await db.select({ id: photos.id, thumbUrl: photos.thumbUrl, imageUrl: photos.imageUrl })
        .from(photos)
        .where(inArray(photos.id, coverIds))
    : [];
  const coverMap = new Map(covers.map((c: any) => [c.id, c.thumbUrl || c.imageUrl]));

  return c.json({
    items: rows.map((r: any) => ({
      ...r,
      coverUrl: coverMap.get(r.coverPhotoId) || null,
    })),
  });
});

r.get('/rolls/:id', optionalAuth, async (c) => {
  const db = c.get('db');
  const [row] = await db
    .select({
      roll: rolls,
      film: films,
      variant: filmVariants,
      author: { id: users.id, username: users.username, avatarUrl: users.avatarUrl, fullName: users.fullName },
    })
    .from(rolls)
    .leftJoin(filmVariants, eq(filmVariants.id, rolls.filmVariantId))
    .leftJoin(films, eq(films.id, filmVariants.filmId))
    .leftJoin(users, eq(users.id, rolls.userId))
    .where(eq(rolls.id, c.req.param('id')));
  if (!row) return c.json({ error: 'Roll not found' }, 404);
  const ps = await db
    .select()
    .from(photos)
    .where(eq(photos.rollId, row.roll.id))
    .orderBy(photos.frameNumber);
  return c.json({ ...row, photos: ps });
});

export default r;
