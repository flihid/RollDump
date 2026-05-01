import { and, desc, eq, sql } from 'drizzle-orm';
import { filmTips, tipVotes, users } from '@rolldump/db';
import { authMiddleware, createApp, optionalAuth } from '../lib/context';

const r = createApp();

r.get('/by-film/:filmId', optionalAuth, async (c) => {
  const db = c.get('db');
  const filmId = c.req.param('filmId');
  const format = c.req.query('format');
  const category = c.req.query('category');
  const sort = c.req.query('sort') || 'top';
  const conds: any[] = [eq(filmTips.filmId, filmId), eq(filmTips.status, 'published')];
  if (format && format !== 'all') conds.push(eq(filmTips.targetFormat, format));
  if (category) conds.push(eq(filmTips.category, category));
  const orderBy = sort === 'recent' ? desc(filmTips.createdAt) : desc(filmTips.netScore);
  const rows = await db
    .select({
      tip: filmTips,
      author: { id: users.id, username: users.username, avatarUrl: users.avatarUrl },
    })
    .from(filmTips)
    .innerJoin(users, eq(users.id, filmTips.userId))
    .where(and(...conds))
    .orderBy(orderBy)
    .limit(50);
  return c.json({ items: rows });
});

r.get('/:id', optionalAuth, async (c) => {
  const db = c.get('db');
  const [row] = await db
    .select({
      tip: filmTips,
      author: {
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        fullName: users.fullName,
      },
    })
    .from(filmTips)
    .innerJoin(users, eq(users.id, filmTips.userId))
    .where(eq(filmTips.id, c.req.param('id')));
  if (!row) return c.json({ error: 'Tips tidak ditemukan' }, 404);
  await db
    .update(filmTips)
    .set({ viewCount: sql`${filmTips.viewCount} + 1` })
    .where(eq(filmTips.id, row.tip.id));
  return c.json(row);
});

r.post('/', authMiddleware, async (c) => {
  const b = await c.req.json();
  if (!b.filmId || !b.title || !b.content || b.content.length < 50)
    return c.json({ error: 'filmId, title, content (min 50 char) wajib' }, 400);
  const [row] = await c
    .get('db')
    .insert(filmTips)
    .values({
      userId: c.get('user')!.id,
      filmId: b.filmId,
      title: b.title,
      content: b.content,
      targetFormat: b.targetFormat || 'all',
      category: b.category || 'general',
    })
    .returning();
  return c.json({ tip: row }, 201);
});

r.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const b = await c.req.json();
  const db = c.get('db');
  const [existing] = await db.select().from(filmTips).where(eq(filmTips.id, id));
  if (!existing) return c.json({ error: 'Tips tidak ditemukan' }, 404);
  if (existing.userId !== c.get('user')!.id) return c.json({ error: 'Forbidden' }, 403);
  const allowed = ['title', 'content', 'targetFormat', 'category'];
  const upd: any = { edited: true, updatedAt: new Date() };
  for (const k of allowed) if (k in b) upd[k] = b[k];
  await db.update(filmTips).set(upd).where(eq(filmTips.id, id));
  return c.json({ ok: true });
});

r.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');
  const [existing] = await db.select().from(filmTips).where(eq(filmTips.id, id));
  if (!existing) return c.json({ error: 'Tips tidak ditemukan' }, 404);
  if (existing.userId !== c.get('user')!.id && c.get('user')!.role !== 'admin')
    return c.json({ error: 'Forbidden' }, 403);
  await db.update(filmTips).set({ status: 'deleted' }).where(eq(filmTips.id, id));
  return c.body(null, 204);
});

r.post('/:id/vote', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { vote_type } = await c.req.json();
  const userId = c.get('user')!.id;
  const db = c.get('db');
  const [tip] = await db.select().from(filmTips).where(eq(filmTips.id, id));
  if (!tip) return c.json({ error: 'Tips tidak ditemukan' }, 404);
  if (tip.userId === userId) return c.json({ error: 'Tidak bisa vote tips sendiri' }, 400);
  const existing = await db
    .select()
    .from(tipVotes)
    .where(and(eq(tipVotes.userId, userId), eq(tipVotes.tipId, id)));
  let delta = 0;
  if (existing.length) {
    delta = -existing[0].voteType;
    await db
      .delete(tipVotes)
      .where(and(eq(tipVotes.userId, userId), eq(tipVotes.tipId, id)));
  }
  if (vote_type === 1 || vote_type === -1) {
    await db.insert(tipVotes).values({ userId, tipId: id, voteType: vote_type });
    delta += vote_type;
  }
  if (delta !== 0)
    await db
      .update(filmTips)
      .set({ netScore: sql`${filmTips.netScore} + ${delta}` })
      .where(eq(filmTips.id, id));
  return c.json({ ok: true });
});

export default r;
