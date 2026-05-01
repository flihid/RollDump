import { and, desc, eq, sql } from 'drizzle-orm';
import {
  comments,
  likes,
  notifications,
  reports,
  users,
  follows,
  reviews,
  photos,
  userLists,
} from '@rolldump/db';
import { authMiddleware, createApp, optionalAuth } from '../lib/context';

const r = createApp();

// Polymorphic likes
r.post('/likes/:type/:id', authMiddleware, async (c) => {
  const userId = c.get('user')!.id;
  const type = c.req.param('type');
  const id = c.req.param('id');
  const db = c.get('db');
  const existing = await db
    .select()
    .from(likes)
    .where(
      and(
        eq(likes.userId, userId),
        eq(likes.likeableId, id),
        eq(likes.likeableType, type),
      ),
    );
  if (existing.length) {
    await db
      .delete(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.likeableId, id),
          eq(likes.likeableType, type),
        ),
      );
    return c.json({ liked: false });
  } else {
    await db.insert(likes).values({ userId, likeableId: id, likeableType: type });
    return c.json({ liked: true });
  }
});

r.get('/likes/:type/:id/count', async (c) => {
  const db = c.get('db');
  const [r0] = await db
    .select({ c: sql<number>`count(*)` })
    .from(likes)
    .where(
      and(eq(likes.likeableId, c.req.param('id')), eq(likes.likeableType, c.req.param('type'))),
    );
  return c.json({ count: Number(r0?.c || 0) });
});

// Polymorphic comments
r.get('/comments/:type/:id', optionalAuth, async (c) => {
  const db = c.get('db');
  const rows = await db
    .select({
      comment: comments,
      author: { id: users.id, username: users.username, avatarUrl: users.avatarUrl },
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(
      and(
        eq(comments.commentableId, c.req.param('id')),
        eq(comments.commentableType, c.req.param('type')),
      ),
    )
    .orderBy(desc(comments.createdAt));
  return c.json({ items: rows });
});

r.post('/comments/:type/:id', authMiddleware, async (c) => {
  const { content, parent_id } = await c.req.json();
  if (!content || !content.trim()) return c.json({ error: 'content wajib' }, 400);
  const [row] = await c
    .get('db')
    .insert(comments)
    .values({
      userId: c.get('user')!.id,
      commentableId: c.req.param('id'),
      commentableType: c.req.param('type'),
      parentId: parent_id || null,
      content,
    })
    .returning();
  return c.json({ comment: row }, 201);
});

r.delete('/comments/:id', authMiddleware, async (c) => {
  const id = c.req.param('id');
  const db = c.get('db');
  const [existing] = await db.select().from(comments).where(eq(comments.id, id));
  if (!existing) return c.json({ error: 'Komentar tidak ditemukan' }, 404);
  if (existing.userId !== c.get('user')!.id && c.get('user')!.role !== 'admin')
    return c.json({ error: 'Forbidden' }, 403);
  await db.update(comments).set({ deletedAt: new Date() }).where(eq(comments.id, id));
  return c.body(null, 204);
});

// Reports
r.post('/reports/:type/:id', authMiddleware, async (c) => {
  const { reason, detail } = await c.req.json();
  if (!reason) return c.json({ error: 'reason wajib' }, 400);
  await c
    .get('db')
    .insert(reports)
    .values({
      reporterId: c.get('user')!.id,
      reportableId: c.req.param('id'),
      reportableType: c.req.param('type'),
      reason,
      detail,
    });
  return c.json({ ok: true });
});

// Activity feed: simple union view of recent actions by users I follow
r.get('/feed', authMiddleware, async (c) => {
  const db = c.get('db');
  const me = c.get('user')!.id;
  const followingRows = await db
    .select({ id: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, me));
  const ids = followingRows.map((r) => r.id);
  if (!ids.length) return c.json({ items: [] });
  const phs = await db
    .select({
      type: sql<string>`'photo'`,
      id: photos.id,
      userId: photos.userId,
      createdAt: photos.createdAt,
      title: sql<string>`coalesce(${photos.caption}, '')`,
      imageUrl: photos.imageUrl,
    })
    .from(photos)
    .where(sql`${photos.userId} = ANY(${ids}) and ${photos.status} = 'published'`)
    .orderBy(desc(photos.createdAt))
    .limit(20);
  const rvs = await db
    .select({
      type: sql<string>`'review'`,
      id: reviews.id,
      userId: reviews.userId,
      createdAt: reviews.createdAt,
      title: sql<string>`substr(${reviews.content}, 1, 100)`,
      imageUrl: sql<string>`null`,
    })
    .from(reviews)
    .where(sql`${reviews.userId} = ANY(${ids}) and ${reviews.status} = 'published'`)
    .orderBy(desc(reviews.createdAt))
    .limit(20);
  const lists0 = await db
    .select({
      type: sql<string>`'list'`,
      id: userLists.id,
      userId: userLists.userId,
      createdAt: userLists.createdAt,
      title: userLists.title,
      imageUrl: userLists.coverImageUrl,
    })
    .from(userLists)
    .where(sql`${userLists.userId} = ANY(${ids}) and ${userLists.isPublic} = true`)
    .orderBy(desc(userLists.createdAt))
    .limit(20);
  const all = [...phs, ...rvs, ...lists0].sort(
    (a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime(),
  );
  // attach user info
  const userIds = Array.from(new Set(all.map((a) => a.userId)));
  const usersRows = userIds.length
    ? await db
        .select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl })
        .from(users)
        .where(sql`${users.id} = ANY(${userIds})`)
    : [];
  const map = new Map(usersRows.map((u) => [u.id, u]));
  return c.json({ items: all.slice(0, 30).map((a) => ({ ...a, author: map.get(a.userId) })) });
});

// Notifications
r.get('/notifications', authMiddleware, async (c) => {
  const db = c.get('db');
  const me = c.get('user')!.id;
  const list = await db
    .select({
      n: notifications,
      actor: { id: users.id, username: users.username, avatarUrl: users.avatarUrl },
    })
    .from(notifications)
    .leftJoin(users, eq(users.id, notifications.actorId))
    .where(eq(notifications.recipientId, me))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  return c.json({ items: list });
});

r.put('/notifications/:id/read', authMiddleware, async (c) => {
  await c
    .get('db')
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.id, c.req.param('id')),
        eq(notifications.recipientId, c.get('user')!.id),
      ),
    );
  return c.json({ ok: true });
});

r.put('/notifications/read-all', authMiddleware, async (c) => {
  await c
    .get('db')
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.recipientId, c.get('user')!.id));
  return c.json({ ok: true });
});

export default r;
