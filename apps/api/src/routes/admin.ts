import { and, desc, eq, sql } from 'drizzle-orm';
import {
  users,
  reports,
  films,
  reviews,
  photos,
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
  return c.json({
    users: Number(u?.c || 0),
    films: Number(f?.c || 0),
    reviews: Number(rv?.c || 0),
    photos: Number(ph?.c || 0),
    pendingReports: Number(rp?.c || 0),
  });
});

r.get('/reports', async (c) => {
  const db = c.get('db');
  const list = await db
    .select()
    .from(reports)
    .where(eq(reports.status, 'pending'))
    .orderBy(desc(reports.createdAt))
    .limit(100);
  return c.json({ items: list });
});

r.post('/reports/:id/action', async (c) => {
  const id = c.req.param('id');
  const { action, notes } = await c.req.json();
  const db = c.get('db');
  const [rep] = await db.select().from(reports).where(eq(reports.id, id));
  if (!rep) return c.json({ error: 'Report tidak ditemukan' }, 404);
  if (action === 'remove_content') {
    if (rep.reportableType === 'review') {
      await db
        .update(reviews)
        .set({ status: 'hidden' })
        .where(eq(reviews.id, rep.reportableId));
    } else if (rep.reportableType === 'photo') {
      await db
        .update(photos)
        .set({ status: 'hidden' })
        .where(eq(photos.id, rep.reportableId));
    }
  } else if (action === 'suspend_user') {
    await db.update(users).set({ status: 'suspended' }).where(eq(users.id, rep.reportableId));
  }
  await db
    .update(reports)
    .set({ status: 'resolved', resolvedAt: new Date(), resolvedById: c.get('user')!.id })
    .where(eq(reports.id, id));
  await db.insert(auditLogs).values({
    actorId: c.get('user')!.id,
    actorRole: c.get('user')!.role,
    action: `moderation:${action}`,
    resourceType: rep.reportableType,
    resourceId: rep.reportableId,
    after: { notes },
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
