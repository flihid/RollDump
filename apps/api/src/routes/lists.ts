import { and, desc, eq, inArray, notInArray, sql } from 'drizzle-orm';
import {
  userLists,
  listItems,
  listLikes,
  listSaves,
  films,
  filmVariants,
  brands,
  users,
} from '@rolldump/db';
import { authMiddleware, createApp, getHiddenUserIds, optionalAuth, slugify } from '../lib/context';

const r = createApp();

r.get('/', optionalAuth, async (c) => {
  const db = c.get('db');
  const tab = c.req.query('tab') || 'recent';
  const order = tab === 'trending' ? desc(userLists.likeCount) : desc(userLists.createdAt);
  const conds: any[] = [eq(userLists.isPublic, true), eq(userLists.status, 'active')];
  const hidden = await getHiddenUserIds(c);
  if (hidden.length) conds.push(notInArray(userLists.userId, hidden));
  const rows = await db
    .select({
      list: userLists,
      author: { id: users.id, username: users.username, avatarUrl: users.avatarUrl },
    })
    .from(userLists)
    .innerJoin(users, eq(users.id, userLists.userId))
    .where(and(...conds))
    .orderBy(order)
    .limit(30);
  return c.json({ items: rows });
});

r.get('/by-user/:userId', optionalAuth, async (c) => {
  const db = c.get('db');
  const list = await db
    .select()
    .from(userLists)
    .where(and(eq(userLists.userId, c.req.param('userId')), eq(userLists.status, 'active')))
    .orderBy(desc(userLists.createdAt));
  return c.json({ items: list });
});

r.get('/:id', optionalAuth, async (c) => {
  const db = c.get('db');
  const [list] = await db.select().from(userLists).where(eq(userLists.id, c.req.param('id')));
  if (!list) return c.json({ error: 'List not found' }, 404);
  if (!list.isPublic && list.userId !== c.get('user')?.id)
    return c.json({ error: 'Forbidden' }, 403);
  const hidden = await getHiddenUserIds(c);
  if (hidden.includes(list.userId)) return c.json({ error: 'List not found' }, 404);
  const rawItems = await db
    .select({ item: listItems, film: films, variant: filmVariants, brand: brands })
    .from(listItems)
    .innerJoin(filmVariants, eq(filmVariants.id, listItems.filmVariantId))
    .innerJoin(films, eq(films.id, filmVariants.filmId))
    .leftJoin(brands, eq(brands.id, films.brandId))
    .where(eq(listItems.listId, list.id))
    .orderBy(listItems.position);
  // Flatten: attach brand onto film so FilmRoll3D + FilmCard work
  const items = rawItems.map((row: any) => ({
    item: row.item,
    film: { ...row.film, brand: row.brand },
    variant: row.variant,
  }));
  const [author] = await db.select().from(users).where(eq(users.id, list.userId));
  return c.json({
    list,
    items,
    author: author
      ? { id: author.id, username: author.username, avatarUrl: author.avatarUrl, fullName: author.fullName }
      : null,
  });
});

r.post('/', authMiddleware, async (c) => {
  const b = await c.req.json();
  if (!b.title) return c.json({ error: 'title wajib' }, 400);
  const slug = slugify(b.title) + '-' + Math.random().toString(36).slice(2, 6);
  const [row] = await c
    .get('db')
    .insert(userLists)
    .values({
      userId: c.get('user')!.id,
      slug,
      title: b.title,
      description: b.description,
      coverImageUrl: b.coverImageUrl,
      isPublic: b.isPublic ?? true,
    })
    .returning();
  return c.json({ list: row }, 201);
});

r.put('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const b = await c.req.json();
  const db = c.get('db');
  const [existing] = await db.select().from(userLists).where(eq(userLists.id, id));
  if (!existing) return c.json({ error: 'List tidak ditemukan' }, 404);
  if (existing.userId !== c.get('user')!.id) return c.json({ error: 'Forbidden' }, 403);
  const upd: any = { updatedAt: new Date() };
  ['title', 'description', 'coverImageUrl', 'isPublic'].forEach((k) => {
    if (k in b) upd[k] = b[k];
  });
  await db.update(userLists).set(upd).where(eq(userLists.id, id));
  return c.json({ ok: true });
});

r.delete('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');
  const [existing] = await db.select().from(userLists).where(eq(userLists.id, id));
  if (!existing) return c.json({ error: 'List tidak ditemukan' }, 404);
  if (existing.userId !== c.get('user')!.id) return c.json({ error: 'Forbidden' }, 403);
  await db.update(userLists).set({ status: 'deleted' }).where(eq(userLists.id, id));
  return c.body(null, 204);
});

r.post('/:id/items', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const { film_variant_id, personal_note } = await c.req.json();
  const db = c.get('db');
  const [existing] = await db.select().from(userLists).where(eq(userLists.id, id));
  if (!existing) return c.json({ error: 'List tidak ditemukan' }, 404);
  if (existing.userId !== c.get('user')!.id) return c.json({ error: 'Forbidden' }, 403);
  await db
    .insert(listItems)
    .values({ listId: id, filmVariantId: film_variant_id, personalNote: personal_note })
    .onConflictDoNothing();
  await db
    .update(userLists)
    .set({ itemCount: sql`${userLists.itemCount} + 1`, updatedAt: new Date() })
    .where(eq(userLists.id, id));
  return c.json({ ok: true });
});

r.delete('/:id/items/:itemId', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const itemId = c.req.param('itemId');
  const db = c.get('db');
  const [existing] = await db.select().from(userLists).where(eq(userLists.id, id));
  if (!existing) return c.json({ error: 'List tidak ditemukan' }, 404);
  if (existing.userId !== c.get('user')!.id) return c.json({ error: 'Forbidden' }, 403);
  await db.delete(listItems).where(eq(listItems.id, itemId));
  await db
    .update(userLists)
    .set({ itemCount: sql`greatest(${userLists.itemCount} - 1, 0)`, updatedAt: new Date() })
    .where(eq(userLists.id, id));
  return c.body(null, 204);
});

r.post('/:id/like', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('user')!.id;
  const db = c.get('db');
  const existing = await db
    .select()
    .from(listLikes)
    .where(and(eq(listLikes.userId, userId), eq(listLikes.listId, id)));
  if (existing.length) {
    await db
      .delete(listLikes)
      .where(and(eq(listLikes.userId, userId), eq(listLikes.listId, id)));
    await db
      .update(userLists)
      .set({ likeCount: sql`greatest(${userLists.likeCount} - 1, 0)` })
      .where(eq(userLists.id, id));
    return c.json({ liked: false });
  } else {
    await db.insert(listLikes).values({ userId, listId: id });
    await db
      .update(userLists)
      .set({ likeCount: sql`${userLists.likeCount} + 1` })
      .where(eq(userLists.id, id));
    return c.json({ liked: true });
  }
});

r.post('/:id/save', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const userId = c.get('user')!.id;
  const db = c.get('db');
  const existing = await db
    .select()
    .from(listSaves)
    .where(and(eq(listSaves.userId, userId), eq(listSaves.listId, id)));
  if (existing.length) {
    await db
      .delete(listSaves)
      .where(and(eq(listSaves.userId, userId), eq(listSaves.listId, id)));
    return c.json({ saved: false });
  } else {
    await db.insert(listSaves).values({ userId, listId: id });
    return c.json({ saved: true });
  }
});

export default r;
