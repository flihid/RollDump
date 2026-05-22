import { and, desc, eq, notInArray, sql } from 'drizzle-orm';
import {
  reviews,
  reviewHelpfulMarks,
  films,
  users,
  filmVariants,
} from '@rolldump/db';
import { authMiddleware, createApp, getHiddenUserIds, optionalAuth } from '../lib/context';

/** Extract a derived title from the first markdown H1 in review content. */
function deriveTitle(content?: string | null): string | null {
  if (!content) return null;
  const m = content.match(/^\s*#\s+(.+?)\s*$/m);
  return m ? m[1] : null;
}
function withTitle<T extends { review: any }>(row: T): T {
  return { ...row, review: { ...row.review, title: deriveTitle(row.review?.content) } };
}

const r = createApp();

async function recomputeFilmAggregate(db: any, filmId: string) {
  const rows = await db
    .select({ avg: sql<number>`avg(${reviews.ratingOverall})`, count: sql<number>`count(*)` })
    .from(reviews)
    .where(and(eq(reviews.filmId, filmId), eq(reviews.status, 'published')));
  const avg = Number(rows[0]?.avg || 0);
  const count = Number(rows[0]?.count || 0);
  await db.update(films).set({ ratingAvg: avg, reviewCount: count }).where(eq(films.id, filmId));
}

r.get('/by-film/:filmId', optionalAuth, async (c) => {
  const db = c.get('db');
  const filmId = c.req.param('filmId');
  const format = c.req.query('format');
  const sort = c.req.query('sort') || 'helpful';
  const conds: any[] = [eq(reviews.filmId, filmId), eq(reviews.status, 'published')];
  const hidden = await getHiddenUserIds(c);
  if (hidden.length) conds.push(notInArray(reviews.userId, hidden));
  if (format) {
    const variants = await db.select().from(filmVariants).where(eq(filmVariants.filmId, filmId));
    const ids = variants.filter((v) => v.format === format).map((v) => v.id);
    if (ids.length) {
      conds.push(sql`${reviews.filmVariantId} = ANY(${ids})`);
    } else return c.json({ items: [] });
  }
  const orderBy =
    sort === 'recent'
      ? desc(reviews.createdAt)
      : sort === 'rating_high'
      ? desc(reviews.ratingOverall)
      : sort === 'rating_low'
      ? sql`${reviews.ratingOverall} asc`
      : desc(reviews.helpfulCount);
  const rows = await db
    .select({
      review: reviews,
      author: {
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        fullName: users.fullName,
      },
      variant: filmVariants,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .leftJoin(filmVariants, eq(filmVariants.id, reviews.filmVariantId))
    .where(and(...conds))
    .orderBy(orderBy)
    .limit(50);
  return c.json({ items: rows.map(withTitle) });
});

r.get('/:id', optionalAuth, async (c) => {
  const db = c.get('db');
  const [row] = await db
    .select({
      review: reviews,
      author: {
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        fullName: users.fullName,
      },
      film: films,
      variant: filmVariants,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .innerJoin(films, eq(films.id, reviews.filmId))
    .leftJoin(filmVariants, eq(filmVariants.id, reviews.filmVariantId))
    .where(eq(reviews.id, c.req.param('id')));
  if (!row) return c.json({ error: 'Review not found' }, 404);
  const hidden = await getHiddenUserIds(c);
  if (hidden.includes(row.author?.id)) return c.json({ error: 'Review not found' }, 404);
  return c.json(withTitle(row));
});

r.post('/', authMiddleware, async (c) => {
  const body = await c.req.json();
  const db = c.get('db');
  if (!body.filmId || !body.ratingOverall || !body.content || body.content.length < 20) {
    return c.json({ error: 'filmId, ratingOverall, dan content (min 20 char) wajib' }, 400);
  }
  const [row] = await db
    .insert(reviews)
    .values({
      userId: c.get('user')!.id,
      filmId: body.filmId,
      filmVariantId: body.filmVariantId,
      ratingOverall: body.ratingOverall,
      ratingColor: body.ratingColor,
      ratingGrain: body.ratingGrain,
      ratingSharpness: body.ratingSharpness,
      content: body.content,
      cameraId: body.cameraId,
      lensId: body.lensId,
      cameraText: body.cameraText,
      lensText: body.lensText,
      labDevelopedAt: body.labDevelopedAt,
      scanMethod: body.scanMethod,
      pushPullStops: body.pushPullStops || 0,
      shootingConditions: body.shootingConditions,
    })
    .returning();
  await recomputeFilmAggregate(db, body.filmId);
  return c.json({ review: row }, 201);
});

r.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const db = c.get('db');
  const [existing] = await db.select().from(reviews).where(eq(reviews.id, id));
  if (!existing) return c.json({ error: 'Review tidak ditemukan' }, 404);
  if (existing.userId !== c.get('user')!.id) return c.json({ error: 'Forbidden' }, 403);
  const upd: any = { edited: true, updatedAt: new Date() };
  const allowed = [
    'ratingOverall',
    'ratingColor',
    'ratingGrain',
    'ratingSharpness',
    'content',
    'cameraText',
    'lensText',
    'pushPullStops',
    'shootingConditions',
  ];
  for (const k of allowed) if (k in body) upd[k] = body[k];
  await db.update(reviews).set(upd).where(eq(reviews.id, id));
  if (body.ratingOverall) await recomputeFilmAggregate(db, existing.filmId);
  return c.json({ ok: true });
});

r.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');
  const [existing] = await db.select().from(reviews).where(eq(reviews.id, id));
  if (!existing) return c.json({ error: 'Review tidak ditemukan' }, 404);
  if (existing.userId !== c.get('user')!.id && c.get('user')!.role !== 'admin')
    return c.json({ error: 'Forbidden' }, 403);
  await db
    .update(reviews)
    .set({ status: 'deleted', deletedAt: new Date() })
    .where(eq(reviews.id, id));
  await recomputeFilmAggregate(db, existing.filmId);
  return c.body(null, 204);
});

r.post('/:id/helpful', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('user')!.id;
  const db = c.get('db');
  const [r0] = await db.select().from(reviews).where(eq(reviews.id, id));
  if (!r0) return c.json({ error: 'Review tidak ditemukan' }, 404);
  if (r0.userId === userId) return c.json({ error: 'Tidak bisa vote sendiri' }, 400);
  const existing = await db
    .select()
    .from(reviewHelpfulMarks)
    .where(and(eq(reviewHelpfulMarks.userId, userId), eq(reviewHelpfulMarks.reviewId, id)));
  if (existing.length) {
    await db
      .delete(reviewHelpfulMarks)
      .where(and(eq(reviewHelpfulMarks.userId, userId), eq(reviewHelpfulMarks.reviewId, id)));
    await db
      .update(reviews)
      .set({ helpfulCount: sql`${reviews.helpfulCount} - 1` })
      .where(eq(reviews.id, id));
    return c.json({ helpful: false });
  } else {
    await db.insert(reviewHelpfulMarks).values({ userId, reviewId: id });
    await db
      .update(reviews)
      .set({ helpfulCount: sql`${reviews.helpfulCount} + 1` })
      .where(eq(reviews.id, id));
    return c.json({ helpful: true });
  }
});

r.get('/by-user/:userId', optionalAuth, async (c) => {
  const db = c.get('db');
  const list = await db
    .select({ review: reviews, film: films })
    .from(reviews)
    .innerJoin(films, eq(films.id, reviews.filmId))
    .where(and(eq(reviews.userId, c.req.param('userId')), eq(reviews.status, 'published')))
    .orderBy(desc(reviews.createdAt))
    .limit(50);
  return c.json({ items: list.map(withTitle) });
});

export default r;
