import { and, desc, eq, inArray, notInArray, sql } from 'drizzle-orm';
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
  films,
  filmVariants,
} from '@rolldump/db';
import { authMiddleware, createApp, getHiddenUserIds, optionalAuth } from '../lib/context';

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

// Polymorphic comments — hidden authors are filtered out
r.get('/comments/:type/:id', optionalAuth, async (c) => {
  const db = c.get('db');
  const conds: any[] = [
    eq(comments.commentableId, c.req.param('id')),
    eq(comments.commentableType, c.req.param('type')),
  ];
  const hidden = await getHiddenUserIds(c);
  if (hidden.length) conds.push(notInArray(comments.userId, hidden));
  const rows = await db
    .select({
      comment: comments,
      author: { id: users.id, username: users.username, avatarUrl: users.avatarUrl },
    })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(and(...conds))
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

// Activity feed: union of photo / review / list activity from followed users,
// enriched with author info + like/comment counts + film name.
r.get('/feed', authMiddleware, async (c) => {
  const db = c.get('db');
  const me = c.get('user')!.id;
  const followingRows = await db
    .select({ id: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, me));
  let ids = followingRows.map((r: any) => r.id);

  // Fallback: if user follows nobody, surface popular activity globally
  if (!ids.length) {
    const recent = await db.select({ id: users.id }).from(users).limit(20);
    ids = recent.map((r: any) => r.id);
  }
  // Strip hidden (blocked) users from the candidate set
  const hidden = await getHiddenUserIds(c);
  if (hidden.length) ids = ids.filter((id: string) => !hidden.includes(id));
  if (!ids.length) return c.json({ items: [] });

  const phs = await db
    .select({
      type: sql<string>`'photo'`,
      id: photos.id,
      userId: photos.userId,
      createdAt: photos.createdAt,
      caption: photos.caption,
      imageUrl: photos.imageUrl,
      filmVariantId: photos.filmVariantId,
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
      content: reviews.content,
      filmId: reviews.filmId,
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

  const all = [...phs, ...rvs, ...lists0]
    .sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime())
    .slice(0, 30);

  // === Enrichment ===
  const userIds = Array.from(new Set(all.map((a: any) => a.userId)));
  const usersRows = userIds.length
    ? await db
        .select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl, fullName: users.fullName })
        .from(users)
        .where(inArray(users.id, userIds))
    : [];
  const userMap = new Map(usersRows.map((u: any) => [u.id, u]));

  // film name for photos (via filmVariant → film) + reviews (filmId direct)
  const photoVariantIds = phs.map((p: any) => p.filmVariantId).filter(Boolean);
  const variants = photoVariantIds.length
    ? await db.select().from(filmVariants).where(inArray(filmVariants.id, photoVariantIds))
    : [];
  const filmIdsFromPhotos = variants.map((v: any) => v.filmId);
  const reviewFilmIds = rvs.map((r: any) => r.filmId).filter(Boolean);
  const filmIds = Array.from(new Set([...filmIdsFromPhotos, ...reviewFilmIds]));
  const filmRows = filmIds.length
    ? await db.select({ id: films.id, name: films.name, slug: films.slug }).from(films).where(inArray(films.id, filmIds))
    : [];
  const filmMap = new Map(filmRows.map((f: any) => [f.id, f]));
  const variantMap = new Map(variants.map((v: any) => [v.id, v]));

  // like/comment counts per (type, id)
  const photoIds = phs.map((p: any) => p.id);
  const reviewIds = rvs.map((r: any) => r.id);
  const allIds = [...photoIds, ...reviewIds];
  const likeRows = allIds.length
    ? await db
        .select({ id: likes.likeableId, type: likes.likeableType, c: sql<number>`count(*)` })
        .from(likes)
        .where(inArray(likes.likeableId, allIds))
        .groupBy(likes.likeableId, likes.likeableType)
    : [];
  const commentRows = allIds.length
    ? await db
        .select({ id: comments.commentableId, type: comments.commentableType, c: sql<number>`count(*)` })
        .from(comments)
        .where(inArray(comments.commentableId, allIds))
        .groupBy(comments.commentableId, comments.commentableType)
    : [];
  const likeMap = new Map(likeRows.map((r: any) => [`${r.type}:${r.id}`, Number(r.c)]));
  const commentMap = new Map(commentRows.map((r: any) => [`${r.type}:${r.id}`, Number(r.c)]));

  return c.json({
    items: all.map((a: any) => {
      const author = userMap.get(a.userId);
      const filmName =
        a.type === 'photo'
          ? filmMap.get(variantMap.get(a.filmVariantId)?.filmId)?.name
          : a.type === 'review'
          ? filmMap.get(a.filmId)?.name
          : undefined;
      const likeCount = likeMap.get(`${a.type}:${a.id}`) || 0;
      const commentCount = commentMap.get(`${a.type}:${a.id}`) || 0;
      return {
        ...a,
        author,
        filmName,
        likeCount,
        commentCount,
        // Keep "title" alias for back-compat
        title: a.caption || a.title || (a.content ? String(a.content).slice(0, 100) : ''),
      };
    }),
  });
});

// Notifications — flat shape consumed by NotificationBell + Notifications page
r.get('/notifications', authMiddleware, async (c) => {
  const db = c.get('db');
  const me = c.get('user')!.id;
  const hidden = await getHiddenUserIds(c);
  const conds: any[] = [eq(notifications.recipientId, me)];
  if (hidden.length) conds.push(notInArray(notifications.actorId, hidden));
  const list = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      payload: notifications.payload,
      notifiableId: notifications.notifiableId,
      notifiableType: notifications.notifiableType,
      isRead: notifications.isRead,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
      actorId: users.id,
      actorUsername: users.username,
      actorAvatarUrl: users.avatarUrl,
    })
    .from(notifications)
    .leftJoin(users, eq(users.id, notifications.actorId))
    .where(and(...conds))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  const flat = list.map((row: any) => {
    const messageFromPayload =
      row.payload && typeof row.payload === 'object' && row.payload.message;
    const fallbackMsg = {
      like: `@${row.actorUsername} liked your content`,
      comment: `@${row.actorUsername} commented on your content`,
      follow: `@${row.actorUsername} started following you`,
      review_helpful: `@${row.actorUsername} marked your review as helpful`,
      mention: `@${row.actorUsername} mentioned you`,
    }[row.type as string];

    // Deep-link by notifiable type → otherwise fall back to actor profile
    let actionUrl: string | null = null;
    if (row.notifiableType === 'photo' && row.notifiableId) actionUrl = `/photos/${row.notifiableId}`;
    else if (row.notifiableType === 'review' && row.notifiableId) actionUrl = `/reviews/${row.notifiableId}`;
    else if (row.notifiableType === 'list' && row.notifiableId) actionUrl = `/lists/${row.notifiableId}`;
    else if (row.type === 'follow' && row.actorUsername) actionUrl = `/u/${row.actorUsername}`;
    else if (row.actorUsername) actionUrl = `/u/${row.actorUsername}`;

    return {
      id: row.id,
      type: row.type,
      message: messageFromPayload || fallbackMsg || 'New activity',
      title: messageFromPayload || fallbackMsg || 'Notification',
      actionUrl,
      readAt: row.readAt,
      isRead: row.isRead,
      createdAt: row.createdAt,
      actor: row.actorId
        ? { id: row.actorId, username: row.actorUsername, avatarUrl: row.actorAvatarUrl }
        : null,
      // Back-compat with old Notifications page consumer
      n: {
        id: row.id,
        type: row.type,
        isRead: row.isRead,
        createdAt: row.createdAt,
      },
    };
  });
  return c.json({ items: flat });
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
