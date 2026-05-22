import { and, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import {
  users,
  reports,
  films,
  reviews,
  photos,
  comments,
  userLists,
  filmTips,
  userModerationActions,
  auditLogs,
  featureFlags,
  announcements,
} from '@rolldump/db';
import { authMiddleware, createApp, requireRole } from '../lib/context';

const r = createApp();

r.use('*', authMiddleware, requireRole('admin', 'super_admin', 'moderator'));

r.get('/stats', async (c) => {
  const db = c.get('db');
  const [u] = await db.select({ c: sql<number>`count(*)` }).from(users);
  const [f] = await db.select({ c: sql<number>`count(*)` }).from(films);
  const [rv] = await db.select({ c: sql<number>`count(*)` }).from(reviews);
  const [ph] = await db.select({ c: sql<number>`count(*)` }).from(photos);
  const [rp] = await db
    .select({ c: sql<number>`count(*)` })
    .from(reports)
    .where(eq(reports.status, 'pending'));

  // Moderation stats — used by Moderation Queue stat grid
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [resolvedToday] = await db
    .select({ c: sql<number>`count(*)` })
    .from(reports)
    .where(and(eq(reports.status, 'resolved'), gte(reports.resolvedAt, dayAgo)));
  const [resolvedAll] = await db
    .select({ c: sql<number>`count(*)` })
    .from(reports)
    .where(eq(reports.status, 'resolved'));
  const [avgResponse] = await db
    .select({
      avg: sql<number>`avg(extract(epoch from (${reports.resolvedAt} - ${reports.createdAt})) / 3600)`,
    })
    .from(reports)
    .where(eq(reports.status, 'resolved'));
  const [activeMods] = await db
    .select({ c: sql<number>`count(*)` })
    .from(users)
    .where(inArray(users.role, ['moderator', 'admin', 'super_admin']));

  const totalReports = Number(rp?.c || 0) + Number(resolvedAll?.c || 0);
  const resolveRate = totalReports > 0 ? Math.round((Number(resolvedAll?.c || 0) / totalReports) * 100) : 0;

  return c.json({
    users: Number(u?.c || 0),
    films: Number(f?.c || 0),
    reviews: Number(rv?.c || 0),
    photos: Number(ph?.c || 0),
    pendingReports: Number(rp?.c || 0),
    resolvedToday: Number(resolvedToday?.c || 0),
    avgResponseHours: avgResponse?.avg ? Number(avgResponse.avg) : null,
    activeMods: Number(activeMods?.c || 0),
    resolveRate,
  });
});

r.get('/reports', async (c) => {
  const db = c.get('db');
  const rows = await db
    .select({
      report: reports,
      reporter: { id: users.id, username: users.username, avatarUrl: users.avatarUrl },
    })
    .from(reports)
    .leftJoin(users, eq(users.id, reports.reporterId))
    .where(eq(reports.status, 'pending'))
    .orderBy(desc(reports.createdAt))
    .limit(100);

  // Group by (type, id) to surface "this content has N reports"
  const byKey = new Map<string, number>();
  for (const row of rows) {
    const k = `${row.report.reportableType}:${row.report.reportableId}`;
    byKey.set(k, (byKey.get(k) || 0) + 1);
  }

  // Resolve target previews for each reportable (photo image, review snippet, etc.)
  const photoIds = rows.filter((r: any) => r.report.reportableType === 'photo').map((r: any) => r.report.reportableId);
  const reviewIds = rows.filter((r: any) => r.report.reportableType === 'review').map((r: any) => r.report.reportableId);
  const commentIds = rows.filter((r: any) => r.report.reportableType === 'comment').map((r: any) => r.report.reportableId);
  const listIds = rows.filter((r: any) => r.report.reportableType === 'list').map((r: any) => r.report.reportableId);
  const tipIds = rows.filter((r: any) => r.report.reportableType === 'tip').map((r: any) => r.report.reportableId);

  const photoRows = photoIds.length
    ? await db
        .select({
          id: photos.id,
          imageUrl: photos.imageUrl,
          thumbUrl: photos.thumbUrl,
          caption: photos.caption,
          userId: photos.userId,
        })
        .from(photos)
        .where(inArray(photos.id, photoIds))
    : [];
  const reviewRows = reviewIds.length
    ? await db
        .select({ id: reviews.id, content: reviews.content, userId: reviews.userId })
        .from(reviews)
        .where(inArray(reviews.id, reviewIds))
    : [];
  const commentRows = commentIds.length
    ? await db
        .select({ id: comments.id, content: comments.content, userId: comments.userId })
        .from(comments)
        .where(inArray(comments.id, commentIds))
    : [];
  const listRows = listIds.length
    ? await db
        .select({ id: userLists.id, title: userLists.title, userId: userLists.userId })
        .from(userLists)
        .where(inArray(userLists.id, listIds))
    : [];
  const tipRows = tipIds.length
    ? await db
        .select({ id: filmTips.id, title: filmTips.title, userId: filmTips.userId })
        .from(filmTips)
        .where(inArray(filmTips.id, tipIds))
    : [];

  const authorUserIds = Array.from(
    new Set([
      ...photoRows.map((r: any) => r.userId),
      ...reviewRows.map((r: any) => r.userId),
      ...commentRows.map((r: any) => r.userId),
      ...listRows.map((r: any) => r.userId),
      ...tipRows.map((r: any) => r.userId),
    ].filter(Boolean)),
  );
  const authors = authorUserIds.length
    ? await db
        .select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl })
        .from(users)
        .where(inArray(users.id, authorUserIds))
    : [];
  const authorMap = new Map(authors.map((u: any) => [u.id, u]));

  const photoMap = new Map(photoRows.map((p: any) => [p.id, { ...p, author: authorMap.get(p.userId) }]));
  const reviewMap = new Map(
    reviewRows.map((r: any) => [
      r.id,
      {
        ...r,
        title: r.content?.match(/^\s*#\s+(.+?)\s*$/m)?.[1] || r.content?.slice(0, 80),
        author: authorMap.get(r.userId),
      },
    ]),
  );
  const commentMap = new Map(commentRows.map((c: any) => [c.id, { ...c, author: authorMap.get(c.userId) }]));
  const listMap = new Map(listRows.map((l: any) => [l.id, { ...l, author: authorMap.get(l.userId) }]));
  const tipMap = new Map(tipRows.map((t: any) => [t.id, { ...t, author: authorMap.get(t.userId) }]));

  // Deduplicate by (type, id) so the queue shows one row per reported resource
  const seen = new Set<string>();
  const items: any[] = [];
  for (const row of rows) {
    const k = `${row.report.reportableType}:${row.report.reportableId}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const r = row.report;
    const target =
      r.reportableType === 'photo' ? photoMap.get(r.reportableId) :
      r.reportableType === 'review' ? reviewMap.get(r.reportableId) :
      r.reportableType === 'comment' ? commentMap.get(r.reportableId) :
      r.reportableType === 'list' ? listMap.get(r.reportableId) :
      r.reportableType === 'tip' ? tipMap.get(r.reportableId) :
      null;
    items.push({
      id: r.id,
      reason: r.reason,
      detail: r.detail,
      reportableType: r.reportableType,
      reportableId: r.reportableId,
      createdAt: r.createdAt,
      reporterCount: byKey.get(k) || 1,
      reporter: row.reporter,
      target,
    });
  }
  return c.json({ items });
});

r.post('/reports/:id/action', async (c) => {
  const id = c.req.param('id');
  const { action, notes } = await c.req.json();
  const db = c.get('db');
  const [rep] = await db.select().from(reports).where(eq(reports.id, id));
  if (!rep) return c.json({ error: 'Report not found' }, 404);

  // Helper to look up the owner of the reported resource
  let ownerId: string | null = null;
  if (rep.reportableType === 'photo') {
    const [p] = await db.select({ userId: photos.userId }).from(photos).where(eq(photos.id, rep.reportableId));
    ownerId = p?.userId ?? null;
  } else if (rep.reportableType === 'review') {
    const [rv] = await db.select({ userId: reviews.userId }).from(reviews).where(eq(reviews.id, rep.reportableId));
    ownerId = rv?.userId ?? null;
  } else if (rep.reportableType === 'comment') {
    const [cm] = await db.select({ userId: comments.userId }).from(comments).where(eq(comments.id, rep.reportableId));
    ownerId = cm?.userId ?? null;
  } else if (rep.reportableType === 'list') {
    const [l] = await db.select({ userId: userLists.userId }).from(userLists).where(eq(userLists.id, rep.reportableId));
    ownerId = l?.userId ?? null;
  } else if (rep.reportableType === 'tip') {
    const [t] = await db.select({ userId: filmTips.userId }).from(filmTips).where(eq(filmTips.id, rep.reportableId));
    ownerId = t?.userId ?? null;
  } else if (rep.reportableType === 'user') {
    ownerId = rep.reportableId;
  }

  if (action === 'remove_content') {
    if (rep.reportableType === 'review') {
      await db.update(reviews).set({ status: 'hidden' }).where(eq(reviews.id, rep.reportableId));
    } else if (rep.reportableType === 'photo') {
      await db.update(photos).set({ status: 'hidden' }).where(eq(photos.id, rep.reportableId));
    } else if (rep.reportableType === 'comment') {
      await db.update(comments).set({ deletedAt: new Date() }).where(eq(comments.id, rep.reportableId));
    } else if (rep.reportableType === 'list') {
      await db.update(userLists).set({ status: 'hidden' }).where(eq(userLists.id, rep.reportableId));
    } else if (rep.reportableType === 'tip') {
      await db.update(filmTips).set({ status: 'hidden' }).where(eq(filmTips.id, rep.reportableId));
    }
  } else if (action === 'suspend_user' && ownerId) {
    // Suspend the user AND hide the offending content
    await db.update(users).set({ status: 'suspended' }).where(eq(users.id, ownerId));
    if (rep.reportableType === 'photo') await db.update(photos).set({ status: 'hidden' }).where(eq(photos.id, rep.reportableId));
    if (rep.reportableType === 'review') await db.update(reviews).set({ status: 'hidden' }).where(eq(reviews.id, rep.reportableId));
    if (rep.reportableType === 'comment') await db.update(comments).set({ deletedAt: new Date() }).where(eq(comments.id, rep.reportableId));
    await db.insert(userModerationActions).values({
      userId: ownerId,
      moderatorId: c.get('user')!.id,
      action: 'suspended',
      reason: notes || 'Auto-suspended via moderation queue',
    });
  } else if (action === 'warn_user' && ownerId) {
    await db.insert(userModerationActions).values({
      userId: ownerId,
      moderatorId: c.get('user')!.id,
      action: 'warning',
      reason: notes || 'Warning issued via moderation queue',
    });
  }

  // Resolve ALL pending reports for this same resource (de-dupe)
  await db
    .update(reports)
    .set({ status: 'resolved', resolvedAt: new Date(), resolvedById: c.get('user')!.id })
    .where(
      and(
        eq(reports.reportableType, rep.reportableType),
        eq(reports.reportableId, rep.reportableId),
        eq(reports.status, 'pending'),
      ),
    );

  await db.insert(auditLogs).values({
    actorId: c.get('user')!.id,
    actorRole: c.get('user')!.role,
    action: `moderation:${action}`,
    resourceType: rep.reportableType,
    resourceId: rep.reportableId,
    after: { notes, ownerId },
  });
  return c.json({ ok: true });
});

r.get('/users', async (c) => {
  const q = c.req.query('q') || '';
  const list = await c
    .get('db')
    .select({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
      status: users.status,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(q ? sql`${users.username} ilike ${'%' + q + '%'} or ${users.email} ilike ${'%' + q + '%'}` : undefined)
    .orderBy(desc(users.createdAt))
    .limit(100);
  return c.json({ items: list });
});

r.patch('/users/:id/status', async (c) => {
  const id = c.req.param('id');
  const { status, reason } = await c.req.json();
  const db = c.get('db');
  await db.update(users).set({ status }).where(eq(users.id, id));
  await db.insert(userModerationActions).values({
    userId: id,
    moderatorId: c.get('user')!.id,
    action: status,
    reason,
  });
  await db.insert(auditLogs).values({
    actorId: c.get('user')!.id,
    actorRole: c.get('user')!.role,
    action: 'user:set_status',
    resourceType: 'user',
    resourceId: id,
    after: { status, reason },
  });
  return c.json({ ok: true });
});

r.patch('/users/:id/role', async (c) => {
  const id = c.req.param('id');
  const { role } = await c.req.json();
  await c.get('db').update(users).set({ role }).where(eq(users.id, id));
  return c.json({ ok: true });
});

r.get('/audit-logs', async (c) => {
  const list = await c
    .get('db')
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);
  return c.json({ items: list });
});

r.get('/feature-flags', async (c) => {
  const list = await c.get('db').select().from(featureFlags);
  return c.json({ items: list });
});

r.put('/feature-flags/:key', async (c) => {
  const key = c.req.param('key');
  const b = await c.req.json();
  await c
    .get('db')
    .insert(featureFlags)
    .values({ key, ...b, updatedAt: new Date() })
    .onConflictDoUpdate({ target: featureFlags.key, set: { ...b, updatedAt: new Date() } });
  return c.json({ ok: true });
});

r.get('/announcements', async (c) => {
  const list = await c
    .get('db')
    .select()
    .from(announcements)
    .orderBy(desc(announcements.createdAt));
  return c.json({ items: list });
});

r.post('/announcements', async (c) => {
  const b = await c.req.json();
  const [row] = await c
    .get('db')
    .insert(announcements)
    .values({
      title: b.title,
      body: b.body,
      audience: b.audience || { type: 'all' },
      channels: b.channels || ['in_app'],
      status: b.status || 'sent',
      sentAt: new Date(),
    })
    .returning();
  return c.json({ announcement: row }, 201);
});

export default r;
